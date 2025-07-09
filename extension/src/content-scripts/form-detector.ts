// Form detector content script

// Declare chrome for content script
declare const chrome: any;

console.log('Job AutoFill form detector loaded');

// Common job application form selectors
const FORM_SELECTORS = {
  // Common form containers
  forms: 'form',
  
  // Personal information fields
  firstName: [
    'input[name*="first"]',
    'input[name*="fname"]',
    'input[id*="first"]',
    'input[placeholder*="first" i]'
  ],
  lastName: [
    'input[name*="last"]',
    'input[name*="lname"]',
    'input[id*="last"]',
    'input[placeholder*="last" i]'
  ],
  email: [
    'input[type="email"]',
    'input[name*="email"]',
    'input[id*="email"]'
  ],
  phone: [
    'input[type="tel"]',
    'input[name*="phone"]',
    'input[id*="phone"]',
    'input[name*="mobile"]'
  ],
  
  // Address fields
  address: [
    'input[name*="address"]',
    'input[id*="address"]',
    'textarea[name*="address"]'
  ],
  city: [
    'input[name*="city"]',
    'input[id*="city"]'
  ],
  state: [
    'select[name*="state"]',
    'select[id*="state"]',
    'input[name*="state"]'
  ],
  zipCode: [
    'input[name*="zip"]',
    'input[name*="postal"]',
    'input[id*="zip"]'
  ],
  
  // Professional fields
  resume: [
    'input[type="file"][name*="resume"]',
    'input[type="file"][name*="cv"]',
    'input[type="file"][id*="resume"]'
  ],
  coverLetter: [
    'textarea[name*="cover"]',
    'textarea[name*="letter"]',
    'textarea[id*="cover"]'
  ],
  experience: [
    'textarea[name*="experience"]',
    'textarea[name*="background"]',
    'textarea[id*="experience"]'
  ],
  skills: [
    'textarea[name*="skill"]',
    'textarea[id*="skill"]',
    'input[name*="skill"]'
  ],
  
  // Common question fields
  whyInterested: [
    'textarea[name*="why"]',
    'textarea[name*="interest"]',
    'textarea[name*="motivation"]'
  ],
  availability: [
    'input[name*="available"]',
    'input[name*="start"]',
    'select[name*="available"]'
  ]
};

// Job board specific patterns
const JOB_BOARDS = {
  linkedin: 'linkedin.com',
  indeed: 'indeed.com',
  glassdoor: 'glassdoor.com',
  monster: 'monster.com',
  ziprecruiter: 'ziprecruiter.com',
  dice: 'dice.com',
  careerbuilder: 'careerbuilder.com'
};

interface FormField {
  element: HTMLElement;
  type: string;
  fieldType: string;
  selector: string;
  value?: string;
}

interface DetectedForm {
  form: HTMLFormElement;
  fields: FormField[];
  jobBoard?: string;
  url: string;
  title?: string;
}

class FormDetector {
  private detectedForms: DetectedForm[] = [];
  private observer: MutationObserver;
  
  constructor() {
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.init();
  }
  
  init() {
    // Initial scan
    this.scanForForms();
    
    // Set up observer for dynamic content
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id']
    });
    
    // Scan again after page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.scanForForms(), 1000);
      });
    }
  }
  
  handleMutations(mutations: MutationRecord[]) {
    let shouldRescan = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        const addedNodes = Array.from(mutation.addedNodes);
        if (addedNodes.some(node => 
          node.nodeType === Node.ELEMENT_NODE && 
          (node as Element).tagName === 'FORM'
        )) {
          shouldRescan = true;
          break;
        }
      }
    }
    
    if (shouldRescan) {
      // Debounce rescanning
      setTimeout(() => this.scanForForms(), 500);
    }
  }
  
  scanForForms() {
    const forms = document.querySelectorAll('form');
    const newForms: DetectedForm[] = [];
    
    forms.forEach(form => {
      if (this.isJobApplicationForm(form)) {
        const detectedForm = this.analyzeForm(form);
        if (detectedForm && detectedForm.fields.length > 0) {
          newForms.push(detectedForm);
        }
      }
    });
    
    // Check if we found new forms
    if (newForms.length > this.detectedForms.length) {
      this.detectedForms = newForms;
      this.notifyFormDetected(newForms);
    }
  }
  
  isJobApplicationForm(form: HTMLFormElement): boolean {
    const formText = form.textContent?.toLowerCase() || '';
    const formHTML = form.innerHTML.toLowerCase();
    
    // Keywords that indicate job application
    const jobKeywords = [
      'apply', 'application', 'resume', 'cv', 'cover letter',
      'experience', 'skills', 'employment', 'career', 'job',
      'position', 'candidate', 'submit application'
    ];
    
    // Check for job-related keywords
    const hasJobKeywords = jobKeywords.some(keyword => 
      formText.includes(keyword) || formHTML.includes(keyword)
    );
    
    // Check for typical application form fields
    const hasApplicationFields = this.hasApplicationFields(form);
    
    // Check URL for job board patterns
    const isJobBoard = this.detectJobBoard() !== null;
    
    return hasJobKeywords || hasApplicationFields || isJobBoard;
  }
  
  hasApplicationFields(form: HTMLFormElement): boolean {
    const inputs = form.querySelectorAll('input, textarea, select');
    let fieldCount = 0;
    
    inputs.forEach(input => {
      const name = input.getAttribute('name')?.toLowerCase() || '';
      const id = input.getAttribute('id')?.toLowerCase() || '';
      const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
      
      const isApplicationField = [
        'first', 'last', 'name', 'email', 'phone', 'resume',
        'cover', 'experience', 'skill', 'address', 'city'
      ].some(term => 
        name.includes(term) || id.includes(term) || placeholder.includes(term)
      );
      
      if (isApplicationField) fieldCount++;
    });
    
    return fieldCount >= 3; // Require at least 3 application-related fields
  }
  
  analyzeForm(form: HTMLFormElement): DetectedForm | null {
    const fields: FormField[] = [];
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      const fieldType = this.identifyFieldType(input as HTMLElement);
      if (fieldType) {
        fields.push({
          element: input as HTMLElement,
          type: input.tagName.toLowerCase(),
          fieldType,
          selector: this.generateSelector(input as HTMLElement),
          value: (input as HTMLInputElement).value
        });
      }
    });
    
    if (fields.length === 0) return null;
    
    const jobBoard = this.detectJobBoard();
    
    return {
      form,
      fields,
      jobBoard: jobBoard || undefined,
      url: window.location.href,
      title: document.title
    };
  }
  
  identifyFieldType(element: HTMLElement): string | null {
    const name = element.getAttribute('name')?.toLowerCase() || '';
    const id = element.getAttribute('id')?.toLowerCase() || '';
    const placeholder = element.getAttribute('placeholder')?.toLowerCase() || '';
    const type = element.getAttribute('type')?.toLowerCase() || '';
    
    // Check each field type
    for (const [fieldType, selectors] of Object.entries(FORM_SELECTORS)) {
      if (fieldType === 'forms') continue;
      
      // Ensure selectors is an array
      const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
      
      // Check if element matches any selector for this field type
      const matches = selectorArray.some((selector: string) => {
        try {
          return element.matches(selector);
        } catch {
          return false;
        }
      });
      
      if (matches) return fieldType;
      
      // Also check name, id, placeholder for keywords
      if (name.includes(fieldType) || id.includes(fieldType) || placeholder.includes(fieldType)) {
        return fieldType;
      }
    }
    
    // Special type checking
    if (type === 'email') return 'email';
    if (type === 'tel') return 'phone';
    if (type === 'file') return 'resume';
    
    return null;
  }
  
  generateSelector(element: HTMLElement): string {
    // Try to generate a unique selector
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.getAttribute('name')) {
      return `${element.tagName.toLowerCase()}[name="${element.getAttribute('name')}"]`;
    }
    
    // Fall back to position-based selector
    const siblings = Array.from(element.parentElement?.children || []);
    const index = siblings.indexOf(element);
    const tag = element.tagName.toLowerCase();
    
    return `${tag}:nth-child(${index + 1})`;
  }
  
  detectJobBoard(): string | null {
    const hostname = window.location.hostname;
    
    for (const [board, pattern] of Object.entries(JOB_BOARDS)) {
      if (hostname.includes(pattern)) {
        return board;
      }
    }
    
    return null;
  }
  
  notifyFormDetected(forms: DetectedForm[]) {
    console.log('Job application forms detected:', forms);
    
    // Send message to background script
    chrome.runtime.sendMessage({
      type: 'FORM_DETECTED',
      data: {
        forms: forms.map(form => ({
          fields: form.fields.map(field => ({
            fieldType: field.fieldType,
            type: field.type,
            selector: field.selector,
            value: field.value
          })),
          jobBoard: form.jobBoard,
          url: form.url,
          title: form.title
        })),
        timestamp: new Date().toISOString()
      }
    });
    
    // Add visual indicator
    this.addFormIndicators(forms);
  }
  
  addFormIndicators(forms: DetectedForm[]) {
    forms.forEach(detectedForm => {
      // Add a small indicator to show the form was detected
      const indicator = document.createElement('div');
      indicator.id = 'job-autofill-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #4CAF50;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        font-family: Arial, sans-serif;
      `;
      indicator.textContent = '✓ Job Application Detected';
      
      document.body.appendChild(indicator);
      
      // Remove indicator after 3 seconds
      setTimeout(() => {
        indicator.remove();
      }, 3000);
    });
  }
  
  getDetectedForms(): DetectedForm[] {
    return this.detectedForms;
  }
}

// Initialize form detector
const formDetector = new FormDetector();

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
  switch (message.type) {
    case 'GET_DETECTED_FORMS':
      sendResponse({
        success: true,
        data: formDetector.getDetectedForms()
      });
      break;
    
    case 'SCAN_FORMS':
      formDetector.scanForForms();
      sendResponse({ success: true });
      break;
    
    default:
      console.warn('Unknown message type:', message.type);
  }
});

// Export for testing
(window as any).jobAutofillFormDetector = formDetector;

// Import job board detection
import { JobBoard, JobBoardDetector } from './job-board-detector';

// Enhanced form detector with multi-platform support
class EnhancedFormDetector {
  private jobBoardDetector: JobBoardDetector;
  private detectedForms: Map<string, HTMLFormElement> = new Map();
  private fieldMapping: Map<string, HTMLInputElement> = new Map();

  constructor() {
    this.jobBoardDetector = new JobBoardDetector();
    this.initializeDetection();
  }

  private initializeDetection(): void {
    this.detectForms();
    this.setupMutationObserver();
    this.notifyExtension();
  }

  private detectForms(): void {
    const currentBoard = this.jobBoardDetector.getCurrentBoard();
    
    if (currentBoard) {
      this.detectPlatformSpecificForms(currentBoard);
    }
    
    this.detectGenericForms();
    this.mapFormFields();
  }

  private detectPlatformSpecificForms(board: JobBoard): void {
    // Use platform-specific selectors
    for (const selector of board.selectors.applicationForm) {
      const forms = document.querySelectorAll(selector) as NodeListOf<HTMLFormElement>;
      forms.forEach((form, index) => {
        const formId = `${board.name.toLowerCase()}_form_${index}`;
        this.detectedForms.set(formId, form);
        console.log(`✅ Detected ${board.name} application form:`, formId);
      });
    }
  }

  private detectGenericForms(): void {
    // Fallback generic form detection
    const forms = document.querySelectorAll('form') as NodeListOf<HTMLFormElement>;
    forms.forEach((form, index) => {
      if (this.isJobApplicationForm(form)) {
        const formId = `generic_form_${index}`;
        if (!Array.from(this.detectedForms.values()).includes(form)) {
          this.detectedForms.set(formId, form);
          console.log(`✅ Detected generic application form:`, formId);
        }
      }
    });
  }

  private isJobApplicationForm(form: HTMLFormElement): boolean {
    const formText = form.textContent?.toLowerCase() || '';
    const formHTML = form.innerHTML.toLowerCase();
    
    const jobKeywords = [
      'application', 'apply', 'resume', 'cv', 'cover letter',
      'experience', 'education', 'skills', 'employment',
      'job', 'position', 'career', 'hire', 'interview'
    ];

    const personalInfoFields = [
      'first name', 'last name', 'email', 'phone',
      'address', 'city', 'state', 'zip'
    ];

    const hasJobKeywords = jobKeywords.some(keyword => 
      formText.includes(keyword) || formHTML.includes(keyword)
    );

    const hasPersonalFields = personalInfoFields.some(field => 
      formText.includes(field) || formHTML.includes(field)
    );

    // Check for file upload inputs (resume/CV)
    const hasFileUpload = form.querySelector('input[type="file"]') !== null;

    // Check for common application form attributes
    const hasApplicationAttributes = form.getAttribute('action')?.toLowerCase().includes('apply') ||
                                   form.getAttribute('id')?.toLowerCase().includes('apply') ||
                                   form.getAttribute('class')?.toLowerCase().includes('apply') ||
                                   false;

    return (hasJobKeywords && hasPersonalFields) || hasFileUpload || hasApplicationAttributes;
  }

  private mapFormFields(): void {
    const currentBoard = this.jobBoardDetector.getCurrentBoard();
    
    this.detectedForms.forEach((form, formId) => {
      this.mapFieldsInForm(form, currentBoard);
    });
  }

  private mapFieldsInForm(form: HTMLFormElement, board: JobBoard | null): void {
    const selectors = board ? { ...FORM_SELECTORS, ...board.selectors } : FORM_SELECTORS;
    
    // Map standard fields
    this.mapField(form, 'firstName', selectors.firstName || FORM_SELECTORS.firstName);
    this.mapField(form, 'lastName', selectors.lastName || FORM_SELECTORS.lastName);
    this.mapField(form, 'email', selectors.email || FORM_SELECTORS.email);
    this.mapField(form, 'phone', selectors.phone || FORM_SELECTORS.phone);
    
    // Map platform-specific fields
    if (board?.selectors.customFields) {
      Object.entries(board.selectors.customFields).forEach(([fieldName, fieldSelectors]) => {
        this.mapField(form, fieldName, fieldSelectors);
      });
    }
  }

  private mapField(form: HTMLFormElement, fieldName: string, selectors: string[]): void {
    for (const selector of selectors) {
      const field = form.querySelector(selector) as HTMLInputElement;
      if (field) {
        this.fieldMapping.set(fieldName, field);
        field.setAttribute('data-job-autofill', fieldName);
        console.log(`🎯 Mapped field: ${fieldName} -> ${selector}`);
        break;
      }
    }
  }

  private setupMutationObserver(): void {
    const observer = new MutationObserver((mutations) => {
      let shouldRedetect = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'FORM' || element.querySelector('form')) {
                shouldRedetect = true;
              }
            }
          });
        }
      });
      
      if (shouldRedetect) {
        console.log('🔄 DOM changed, re-detecting forms...');
        this.detectForms();
        this.notifyExtension();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private notifyExtension(): void {
    const currentBoard = this.jobBoardDetector.getCurrentBoard();
    const formData = {
      platform: currentBoard?.name || 'Generic',
      formsDetected: this.detectedForms.size,
      fieldsDetected: this.fieldMapping.size,
      features: currentBoard?.features || {},
      jobDetails: this.jobBoardDetector.getJobDetails(),
      fields: Array.from(this.fieldMapping.keys()),
      canQuickApply: this.jobBoardDetector.isQuickApplyAvailable(),
      requiresAccount: this.jobBoardDetector.requiresAccount(),
      isMultiStep: this.jobBoardDetector.hasMultiStepApplication()
    };

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'FORMS_DETECTED',
        data: formData
      }).catch(() => {
        // Ignore errors if extension context is not available
      });
    }

    // Store in window for popup access
    (window as any).jobAutoFillData = formData;
  }

  public getDetectedForms(): Map<string, HTMLFormElement> {
    return this.detectedForms;
  }

  public getFieldMapping(): Map<string, HTMLInputElement> {
    return this.fieldMapping;
  }

  public fillField(fieldName: string, value: string): boolean {
    const field = this.fieldMapping.get(fieldName);
    if (field && !field.disabled && !field.readOnly) {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }

  public getJobDetails(): any {
    return this.jobBoardDetector.getJobDetails();
  }

  public getPlatformFeatures(): any {
    const board = this.jobBoardDetector.getCurrentBoard();
    return board?.features || {};
  }
}

// Initialize enhanced form detector
const enhancedFormDetector = new EnhancedFormDetector();

// Export for use by other scripts
(window as any).enhancedFormDetector = enhancedFormDetector;
