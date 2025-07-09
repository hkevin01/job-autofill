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
    
    return {
      form,
      fields,
      jobBoard: this.detectJobBoard(),
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
      
      // Check if element matches any selector for this field type
      const matches = selectors.some(selector => {
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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
