/**
 * Job AutoFill - Enhanced Form Detector
 * Detects job application forms with confidence scoring and ATS platform support
 */

import { 
  isElementInteractable, 
  getElementLabel, 
  calculateFieldConfidence, 
  createDebugInfo,
  debounce,
  highlightElement,
  addTooltip
} from './utils';
import { atsDetector, FieldMapping, ATSPlatform } from './ats-adapters';

console.log('Job AutoFill Enhanced Form Detector loaded');

export interface DetectedField {
  element: HTMLElement;
  fieldType: string;
  confidence: number;
  detectionMethod: string[];
  platform?: string;
  label?: string;
  selector?: string;
  value?: string;
}

export interface DetectedForm {
  form: HTMLFormElement | Document;
  fields: DetectedField[];
  platform: string;
  confidence: number;
  url: string;
  title?: string;
  isJobApplication: boolean;
  debugInfo?: any;
}

export interface FormDetectorOptions {
  enableDebug?: boolean;
  minConfidence?: number;
  highlightFields?: boolean;
  includeHiddenFields?: boolean;
}

const FIELD_PATTERNS: Record<string, RegExp[]> = {
  firstName: [/first.*name/i, /given.*name/i, /fname/i],
  lastName: [/last.*name/i, /family.*name/i, /surname/i, /lname/i],
  fullName: [/^name$/i, /full.*name/i, /complete.*name/i],
  email: [/email/i, /e.?mail/i, /mail.*address/i],
  phone: [/phone/i, /mobile/i, /telephone/i, /contact.*number/i],
  address: [/address/i, /street/i, /location/i],
  city: [/city/i, /town/i, /municipality/i],
  state: [/state/i, /province/i, /region/i],
  zipCode: [/zip/i, /postal/i, /post.*code/i],
  country: [/country/i, /nation/i],
  resume: [/resume/i, /cv/i, /curriculum.*vitae/i],
  coverLetter: [/cover.*letter/i, /motivation.*letter/i],
  linkedin: [/linkedin/i, /linked.?in/i],
  github: [/github/i, /git.*hub/i],
  website: [/website/i, /portfolio/i, /personal.*site/i],
  salary: [/salary/i, /compensation/i, /expected.*salary/i],
  availability: [/availability/i, /start.*date/i, /available/i],
  experience: [/experience/i, /background/i, /work.*history/i],
  skills: [/skills/i, /competencies/i, /expertise/i],
  whyInterested: [/why.*interested/i, /why.*apply/i, /motivation/i],
  additionalInfo: [/additional.*info/i, /other.*info/i, /comments/i]
};

const JOB_APPLICATION_PATTERNS = [
  /job.*application/i,
  /apply.*job/i,
  /application.*form/i,
  /career.*form/i,
  /employment.*form/i,
  /join.*team/i,
  /submit.*application/i
];

export class EnhancedFormDetector {
  private detectedForms: DetectedForm[] = [];
  private observer: MutationObserver;
  private options: FormDetectorOptions;
  private debouncedScan: () => void;

  constructor(options: FormDetectorOptions = {}) {
    this.options = {
      enableDebug: true,
      minConfidence: 0.3,
      highlightFields: false,
      includeHiddenFields: false,
      ...options
    };

    this.debouncedScan = debounce(() => this.scanForForms(), 1000);
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.init();
  }

  private init(): void {
    this.scanForForms();
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'name', 'data-qa', 'data-testid']
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.scanForForms(), 1000);
      });
    } else {
      setTimeout(() => this.scanForForms(), 500);
    }

    let lastUrl = location.href;
    const checkUrl = () => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        atsDetector.reset();
        setTimeout(() => this.scanForForms(), 1000);
      }
    };
    setInterval(checkUrl, 1000);
  }

  private handleMutations(mutations: MutationRecord[]): void {
    let shouldRescan = false;

    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.matches('form, input, textarea, select') ||
                element.querySelector('form, input, textarea, select')) {
              shouldRescan = true;
              break;
            }
          }
        }
      }
      if (shouldRescan) break;
    }

    if (shouldRescan) {
      this.debouncedScan();
    }
  }

  public scanForForms(): DetectedForm[] {
    console.log('🔍 Scanning for job application forms...');
    this.detectedForms = [];

    const platform = atsDetector.detectPlatform();
    const atsFields = atsDetector.detectFields();
    const detectedFields = this.convertATSFields(atsFields);

    if (detectedFields.length < 3) {
      const genericFields = this.genericFormDetection();
      detectedFields.push(...genericFields);
    }

    const uniqueFields = this.deduplicateFields(detectedFields);
    const highConfidenceFields = uniqueFields.filter(f => f.confidence >= this.options.minConfidence!);

    if (highConfidenceFields.length > 0) {
      const formContainer = this.findFormContainer(highConfidenceFields);
      const isJobApp = this.isJobApplicationForm(formContainer, highConfidenceFields);
      
      const detectedForm: DetectedForm = {
        form: formContainer,
        fields: highConfidenceFields,
        platform: platform.name,
        confidence: this.calculateFormConfidence(highConfidenceFields),
        url: window.location.href,
        title: document.title,
        isJobApplication: isJobApp,
        debugInfo: this.options.enableDebug ? this.generateDebugInfo(highConfidenceFields, platform) : undefined
      };

      this.detectedForms = [detectedForm];

      if (this.options.highlightFields) {
        this.highlightDetectedFields(highConfidenceFields);
      }

      console.log(`✅ Detected job application form with ${highConfidenceFields.length} fields`);
    }

    this.exportDebugInfo();
    return this.detectedForms;
  }

  private convertATSFields(atsFields: FieldMapping[]): DetectedField[] {
    return atsFields.map(mapping => ({
      element: mapping.element as HTMLElement,
      fieldType: mapping.fieldType,
      confidence: mapping.confidence,
      detectionMethod: mapping.detectionReason,
      platform: mapping.platform,
      label: getElementLabel(mapping.element),
      selector: this.generateElementSelector(mapping.element)
    }));
  }

  private genericFormDetection(): DetectedField[] {
    const fields: DetectedField[] = [];
    const allInputs = document.querySelectorAll('input, textarea, select');

    for (const element of Array.from(allInputs)) {
      if (!isElementInteractable(element) && !this.options.includeHiddenFields) {
        continue;
      }

      const fieldType = this.detectFieldType(element);
      if (fieldType) {
        const detectionMethod = this.getDetectionMethod(element, fieldType);
        const confidence = calculateFieldConfidence(element, fieldType, detectionMethod);

        if (confidence >= this.options.minConfidence!) {
          fields.push({
            element: element as HTMLElement,
            fieldType,
            confidence,
            detectionMethod,
            platform: 'Generic',
            label: getElementLabel(element),
            selector: this.generateElementSelector(element)
          });
        }
      }
    }

    return fields;
  }

  private detectFieldType(element: Element): string | null {
    const attributes = this.getElementAttributes(element);
    const textContent = this.getElementTextContent(element);

    for (const [fieldType, patterns] of Object.entries(FIELD_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(attributes) || pattern.test(textContent)) {
          return fieldType;
        }
      }
    }

    if (element.tagName === 'INPUT' && element.getAttribute('type') === 'file') {
      const accept = element.getAttribute('accept') || '';
      if (accept.includes('pdf') || accept.includes('doc')) {
        return 'resume';
      }
    }

    return null;
  }

  private getElementAttributes(element: Element): string {
    const attrs = ['name', 'id', 'class', 'placeholder', 'aria-label', 'data-qa', 'data-testid'];
    return attrs
      .map(attr => element.getAttribute(attr) || '')
      .filter(val => val)
      .join(' ')
      .toLowerCase();
  }

  private getElementTextContent(element: Element): string {
    const label = getElementLabel(element);
    const title = element.getAttribute('title') || '';
    return (label + ' ' + title).toLowerCase();
  }

  private getDetectionMethod(element: Element, fieldType: string): string[] {
    const methods: string[] = [];
    const patterns = FIELD_PATTERNS[fieldType] || [];

    const name = element.getAttribute('name') || '';
    const id = element.getAttribute('id') || '';
    const placeholder = element.getAttribute('placeholder') || '';
    const label = getElementLabel(element);

    for (const pattern of patterns) {
      if (pattern.test(name)) methods.push('name-match');
      else if (pattern.test(id)) methods.push('id-match');
      else if (pattern.test(placeholder)) methods.push('placeholder-match');
      else if (pattern.test(label)) methods.push('label-match');
    }

    return methods.length ? methods : ['generic'];
  }

  private findFormContainer(fields: DetectedField[]): HTMLFormElement | Document {
    const forms = new Set<HTMLFormElement>();
    
    for (const field of fields) {
      const form = field.element.closest('form');
      if (form) forms.add(form);
    }

    return forms.size === 1 ? Array.from(forms)[0] : document;
  }

  private isJobApplicationForm(container: HTMLFormElement | Document, fields: DetectedField[]): boolean {
    const fieldTypes = new Set(fields.map(f => f.fieldType));
    const hasPersonalInfo = fieldTypes.has('firstName') || fieldTypes.has('email') || fieldTypes.has('fullName');
    const hasJobFields = fieldTypes.has('resume') || fieldTypes.has('coverLetter') || fieldTypes.has('experience');

    if (hasPersonalInfo && hasJobFields) return true;

    const containerText = container === document ? 
      document.body.textContent || '' : 
      container.textContent || '';

    for (const pattern of JOB_APPLICATION_PATTERNS) {
      if (pattern.test(containerText)) return true;
    }

    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    const jobKeywords = ['job', 'career', 'apply', 'application', 'position'];
    
    return jobKeywords.some(keyword => url.includes(keyword) || title.includes(keyword));
  }

  private calculateFormConfidence(fields: DetectedField[]): number {
    if (fields.length === 0) return 0;
    const avgConfidence = fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length;
    const fieldTypeBonus = Math.min(fields.length / 10, 0.2);
    return Math.min(1, avgConfidence + fieldTypeBonus);
  }

  private deduplicateFields(fields: DetectedField[]): DetectedField[] {
    const seen = new Set<Element>();
    const unique: DetectedField[] = [];
    const sorted = fields.sort((a, b) => b.confidence - a.confidence);

    for (const field of sorted) {
      if (!seen.has(field.element)) {
        seen.add(field.element);
        unique.push(field);
      }
    }

    return unique;
  }

  private generateElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;

    const path: string[] = [];
    let current: Element | null = element;

    while (current && current.nodeType === Node.ELEMENT_NODE && path.length < 5) {
      let selector = current.tagName.toLowerCase();
      
      if (current.className) {
        const classes = current.className.split(' ').filter(c => c && !c.startsWith('css-'));
        if (classes.length > 0) {
          selector += '.' + classes.slice(0, 2).join('.');
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  private highlightDetectedFields(fields: DetectedField[]): void {
    for (const field of fields) {
      const confidenceLevel = field.confidence >= 0.7 ? 'success' : 
                             field.confidence >= 0.5 ? 'warning' : 'error';
      
      highlightElement(field.element, confidenceLevel, 2000);
      
      if (this.options.enableDebug) {
        addTooltip(
          field.element, 
          `${field.fieldType} (${Math.round(field.confidence * 100)}%)`,
          3000
        );
      }
    }
  }

  private generateDebugInfo(fields: DetectedField[], platform: ATSPlatform): any {
    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      platform: platform.name,
      fieldsDetected: fields.length,
      confidence: {
        average: fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length,
        highest: Math.max(...fields.map(f => f.confidence)),
        lowest: Math.min(...fields.map(f => f.confidence))
      },
      fields: fields.map(f => createDebugInfo(f.element, f.fieldType, f.confidence, f.detectionMethod))
    };
  }

  private exportDebugInfo(): void {
    if (!this.options.enableDebug) return;

    (window as any).__JOB_AUTOFILL_DETECTED__ = {
      forms: this.detectedForms,
      detector: this,
      atsDetector: atsDetector,
      lastScan: new Date().toISOString(),
      version: '2.0.0'
    };
  }

  public getDetectedForms(): DetectedForm[] {
    return this.detectedForms;
  }

  public getDetectedFields(): DetectedField[] {
    return this.detectedForms.flatMap(form => form.fields);
  }

  public rescan(): DetectedForm[] {
    atsDetector.reset();
    return this.scanForForms();
  }

  public setOptions(options: Partial<FormDetectorOptions>): void {
    this.options = { ...this.options, ...options };
  }

  public destroy(): void {
    this.observer.disconnect();
  }
}

export const formDetector = new EnhancedFormDetector({
  enableDebug: true,
  minConfidence: 0.3,
  highlightFields: false,
  includeHiddenFields: false
});

if (typeof window !== 'undefined') {
  (window as any).__JOB_AUTOFILL_FORM_DETECTOR__ = formDetector;
}

export { EnhancedFormDetector as FormDetector };
