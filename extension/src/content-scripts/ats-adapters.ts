/**
 * Job AutoFill - ATS Platform Adapters
 * Platform-specific selectors and form handling for major ATS systems
 */

import { calculateFieldConfidence, createDebugInfo, isElementInteractable } from './utils';

// =====================================================
// ATS Platform Detection
// =====================================================

export interface ATSPlatform {
  name: string;
  domains: string[];
  detect: () => boolean;
  selectors: FieldSelectorMap;
  customLogic?: (fieldType: string, context?: any) => Element | null;
  formSubmitSelector?: string;
  waitForLoad?: number;
}

export interface FieldSelectorMap {
  [fieldType: string]: string[];
}

export interface FieldMapping {
  element: Element;
  fieldType: string;
  confidence: number;
  platform: string;
  detectionReason: string[];
}

// =====================================================
// Greenhouse ATS
// =====================================================

const greenhouseAdapter: ATSPlatform = {
  name: 'Greenhouse',
  domains: ['greenhouse.io', 'boards.greenhouse.io'],
  detect: () => {
    return !!(
      document.querySelector('[data-qa="job-board"]') ||
      document.querySelector('.application-form') ||
      document.querySelector('#application_form') ||
      window.location.hostname.includes('greenhouse')
    );
  },
  selectors: {
    firstName: [
      'input[data-qa="first-name"]',
      'input[name="job_application[first_name]"]',
      'input[id*="first_name"]',
      '.first-name input',
    ],
    lastName: [
      'input[data-qa="last-name"]',
      'input[name="job_application[last_name]"]',
      'input[id*="last_name"]',
      '.last-name input',
    ],
    email: [
      'input[data-qa="email"]',
      'input[name="job_application[email]"]',
      'input[type="email"]',
    ],
    phone: ['input[data-qa="phone"]', 'input[name="job_application[phone]"]', 'input[type="tel"]'],
    resume: [
      'input[data-qa="resume-file"]',
      'input[name="job_application[resume]"]',
      'input[type="file"][accept*="pdf"]',
    ],
    coverLetter: [
      'textarea[data-qa="cover-letter"]',
      'textarea[name="job_application[cover_letter]"]',
      '.cover-letter textarea',
    ],
    linkedin: [
      'input[data-qa="linkedin"]',
      'input[name="job_application[linkedin]"]',
      'input[placeholder*="linkedin"]',
    ],
    website: [
      'input[data-qa="website"]',
      'input[name="job_application[website]"]',
      'input[placeholder*="portfolio"]',
    ],
  },
  formSubmitSelector:
    '.application-form button[type="submit"], button[data-qa="submit-application"]',
  waitForLoad: 1000,
};

// =====================================================
// Lever ATS
// =====================================================

const leverAdapter: ATSPlatform = {
  name: 'Lever',
  domains: ['lever.co', 'jobs.lever.co'],
  detect: () => {
    return !!(
      document.querySelector('.application-form') ||
      document.querySelector('[data-qa="btn-apply"]') ||
      document.querySelector('.postings-form') ||
      window.location.hostname.includes('lever')
    );
  },
  selectors: {
    firstName: [
      'input[name="name"]',
      'input[placeholder*="First name"]',
      '.first-name input',
      'input[data-qa="input-name"]',
    ],
    lastName: [
      'input[name="name"]', // Lever often uses single name field
      'input[placeholder*="Last name"]',
      '.last-name input',
    ],
    email: ['input[name="email"]', 'input[type="email"]', 'input[data-qa="input-email"]'],
    phone: ['input[name="phone"]', 'input[type="tel"]', 'input[placeholder*="phone"]'],
    resume: ['input[name="resume"]', 'input[type="file"]', '.file-upload input'],
    coverLetter: [
      'textarea[name="comments"]',
      'textarea[placeholder*="cover letter"]',
      '.additional-information textarea',
    ],
    linkedin: ['input[name="urls[LinkedIn]"]', 'input[placeholder*="linkedin"]'],
    github: ['input[name="urls[Github]"]', 'input[placeholder*="github"]'],
  },
  formSubmitSelector: '.template-btn-submit, button[type="submit"]',
  waitForLoad: 800,
};

// =====================================================
// Workday ATS
// =====================================================

const workdayAdapter: ATSPlatform = {
  name: 'Workday',
  domains: ['myworkdayjobs.com', 'workday.com'],
  detect: () => {
    return !!(
      document.querySelector('[data-automation-id]') ||
      document.querySelector('.css-19oo7lp') ||
      window.location.hostname.includes('workday') ||
      document.querySelector('div[data-automation-id="jobPostingHeader"]')
    );
  },
  selectors: {
    firstName: [
      'input[data-automation-id="legalNameSection_firstName"]',
      'input[data-automation-id="firstName"]',
      'input[aria-label*="First Name"]',
    ],
    lastName: [
      'input[data-automation-id="legalNameSection_lastName"]',
      'input[data-automation-id="lastName"]',
      'input[aria-label*="Last Name"]',
    ],
    email: ['input[data-automation-id="email"]', 'input[type="email"]'],
    phone: ['input[data-automation-id="phone"]', 'input[type="tel"]'],
    address: [
      'input[data-automation-id="addressSection_addressLine1"]',
      'input[aria-label*="Address Line 1"]',
    ],
    city: ['input[data-automation-id="addressSection_city"]', 'input[aria-label*="City"]'],
    state: [
      'input[data-automation-id="addressSection_countryRegion"]',
      'select[aria-label*="State"]',
    ],
    zipCode: [
      'input[data-automation-id="addressSection_postalCode"]',
      'input[aria-label*="Postal Code"]',
    ],
    resume: ['input[data-automation-id="file-upload-input-ref"]', 'input[type="file"]'],
  },
  customLogic: (fieldType: string) => {
    // Workday has complex nested structures
    const automationId = {
      firstName: 'legalNameSection_firstName',
      lastName: 'legalNameSection_lastName',
      email: 'email',
      phone: 'phone',
    }[fieldType];

    if (automationId) {
      return document.querySelector(`input[data-automation-id="${automationId}"]`);
    }
    return null;
  },
  formSubmitSelector: 'button[data-automation-id="bottom-navigation-next-button"]',
  waitForLoad: 1500,
};

// =====================================================
// Taleo ATS
// =====================================================

const taleoAdapter: ATSPlatform = {
  name: 'Taleo',
  domains: ['taleo.net'],
  detect: () => {
    return !!(
      document.querySelector('#requisitionDescriptionInterface') ||
      document.querySelector('.taleo') ||
      window.location.hostname.includes('taleo') ||
      document.querySelector('form[name="applicantForm"]')
    );
  },
  selectors: {
    firstName: ['input[name="firstName"]', 'input[id="firstName"]'],
    lastName: ['input[name="lastName"]', 'input[id="lastName"]'],
    email: ['input[name="email"]', 'input[type="email"]'],
    phone: ['input[name="phone"]', 'input[name="phoneNumber"]'],
    resume: ['input[name="resume"]', 'input[type="file"]'],
    coverLetter: ['textarea[name="coverLetter"]', 'textarea[name="additionalInformation"]'],
  },
  formSubmitSelector: 'input[type="submit"], button[type="submit"]',
  waitForLoad: 1000,
};

// =====================================================
// Ashby ATS
// =====================================================

const ashbyAdapter: ATSPlatform = {
  name: 'Ashby',
  domains: ['ashbyhq.com', 'jobs.ashbyhq.com'],
  detect: () => {
    return !!(
      document.querySelector('[data-testid]') ||
      document.querySelector('.ashby-job-posting') ||
      window.location.hostname.includes('ashby')
    );
  },
  selectors: {
    firstName: ['input[data-testid="application-first-name"]', 'input[name="firstName"]'],
    lastName: ['input[data-testid="application-last-name"]', 'input[name="lastName"]'],
    email: ['input[data-testid="application-email"]', 'input[type="email"]'],
    phone: ['input[data-testid="application-phone"]', 'input[type="tel"]'],
    resume: ['input[data-testid="application-resume"]', 'input[type="file"]'],
    linkedin: ['input[data-testid="application-linkedin"]', 'input[placeholder*="linkedin"]'],
  },
  formSubmitSelector: 'button[data-testid="submit-application"]',
  waitForLoad: 800,
};

// =====================================================
// SmartRecruiters ATS
// =====================================================

const smartRecruitersAdapter: ATSPlatform = {
  name: 'SmartRecruiters',
  domains: ['smartrecruiters.com', 'jobs.smartrecruiters.com'],
  detect: () => {
    return !!(
      document.querySelector('.sr-application-form') ||
      document.querySelector('[data-qa="apply-form"]') ||
      window.location.hostname.includes('smartrecruiters')
    );
  },
  selectors: {
    firstName: ['input[data-qa="first-name-input"]', 'input[name="firstName"]'],
    lastName: ['input[data-qa="last-name-input"]', 'input[name="lastName"]'],
    email: ['input[data-qa="email-input"]', 'input[type="email"]'],
    phone: ['input[data-qa="phone-input"]', 'input[type="tel"]'],
    resume: ['input[data-qa="resume-upload"]', 'input[type="file"]'],
  },
  formSubmitSelector: 'button[data-qa="submit-application-button"]',
  waitForLoad: 1000,
};

// =====================================================
// LinkedIn Jobs
// =====================================================

const linkedinAdapter: ATSPlatform = {
  name: 'LinkedIn',
  domains: ['linkedin.com'],
  detect: () => {
    return !!(
      document.querySelector('.jobs-easy-apply-modal') ||
      document.querySelector('[data-test-modal="jobs-easy-apply-modal"]') ||
      (window.location.hostname.includes('linkedin') && window.location.pathname.includes('jobs'))
    );
  },
  selectors: {
    firstName: [
      'input[id*="first-name"]',
      'input[data-test-text-entity-list-form-component="first-name"]',
    ],
    lastName: [
      'input[id*="last-name"]',
      'input[data-test-text-entity-list-form-component="last-name"]',
    ],
    email: ['input[type="email"]', 'input[id*="email"]'],
    phone: ['input[type="tel"]', 'input[id*="phone"]'],
    resume: ['input[type="file"]', 'input[data-test-file-upload-input]'],
  },
  customLogic: (fieldType: string) => {
    // LinkedIn Easy Apply has dynamic forms
    const modal = document.querySelector('.jobs-easy-apply-modal');
    if (!modal) return null;

    const fieldMappings = {
      phone: ['phoneNumber', 'phone'],
      email: ['email'],
      firstName: ['firstName', 'first-name'],
      lastName: ['lastName', 'last-name'],
    };

    const possibleNames = fieldMappings[fieldType as keyof typeof fieldMappings] || [];
    for (const name of possibleNames) {
      const element = modal.querySelector(`input[id*="${name}"], input[name*="${name}"]`);
      if (element && isElementInteractable(element)) {
        return element;
      }
    }

    return null;
  },
  formSubmitSelector:
    '.jobs-easy-apply-modal button[aria-label*="Submit"], .jobs-easy-apply-modal button[type="submit"]',
  waitForLoad: 1200,
};

// =====================================================
// Indeed Jobs
// =====================================================

const indeedAdapter: ATSPlatform = {
  name: 'Indeed',
  domains: ['indeed.com'],
  detect: () => {
    return !!(
      document.querySelector('#ia-container') ||
      document.querySelector('.ia-BasePage') ||
      (window.location.hostname.includes('indeed') &&
        document.querySelector('.jobsearch-ApplyButtonContainer'))
    );
  },
  selectors: {
    firstName: ['input[name="contact.firstName"]', 'input[id="applicant.firstName"]'],
    lastName: ['input[name="contact.lastName"]', 'input[id="applicant.lastName"]'],
    email: ['input[name="contact.email"]', 'input[type="email"]'],
    phone: ['input[name="contact.phoneNumber"]', 'input[type="tel"]'],
    resume: ['input[name="resume"]', 'input[type="file"]', 'input[accept*="pdf"]'],
  },
  formSubmitSelector: 'button[data-testid="ContactInfoContinueButton"], .ia-continueButton',
  waitForLoad: 1000,
};

// =====================================================
// Generic Fallback Adapter
// =====================================================

const genericAdapter: ATSPlatform = {
  name: 'Generic',
  domains: ['*'],
  detect: () => true, // Always matches as fallback
  selectors: {
    firstName: [
      'input[name*="first"][name*="name"]:not([name*="last"])',
      'input[id*="first"][id*="name"]:not([id*="last"])',
      'input[placeholder*="first name" i]',
      'input[aria-label*="first name" i]',
    ],
    lastName: [
      'input[name*="last"][name*="name"]',
      'input[id*="last"][id*="name"]',
      'input[placeholder*="last name" i]',
      'input[aria-label*="last name" i]',
    ],
    fullName: [
      'input[name="name"]:not([name*="first"]):not([name*="last"])',
      'input[name*="full"][name*="name"]',
      'input[placeholder*="full name" i]',
      'input[aria-label*="full name" i]',
    ],
    email: [
      'input[type="email"]',
      'input[name*="email"]',
      'input[id*="email"]',
      'input[placeholder*="email" i]',
    ],
    phone: [
      'input[type="tel"]',
      'input[name*="phone"]',
      'input[id*="phone"]',
      'input[placeholder*="phone" i]',
    ],
    address: [
      'input[name*="address"]:not([name*="email"])',
      'input[id*="address"]',
      'input[placeholder*="address" i]',
    ],
    city: ['input[name*="city"]', 'input[id*="city"]', 'input[placeholder*="city" i]'],
    state: ['select[name*="state"]', 'input[name*="state"]', 'select[name*="region"]'],
    zipCode: [
      'input[name*="zip"]',
      'input[name*="postal"]',
      'input[id*="zip"]',
      'input[placeholder*="zip" i]',
    ],
    resume: [
      'input[type="file"][accept*="pdf"]',
      'input[type="file"][name*="resume"]',
      'input[type="file"][name*="cv"]',
    ],
    coverLetter: [
      'textarea[name*="cover"]',
      'textarea[name*="letter"]',
      'textarea[placeholder*="cover letter" i]',
      'textarea[placeholder*="why are you interested" i]',
    ],
    linkedin: [
      'input[name*="linkedin"]',
      'input[placeholder*="linkedin" i]',
      'input[name*="url"][placeholder*="linkedin" i]',
    ],
    github: ['input[name*="github"]', 'input[placeholder*="github" i]'],
    website: [
      'input[name*="website"]',
      'input[name*="portfolio"]',
      'input[placeholder*="portfolio" i]',
    ],
  },
  waitForLoad: 500,
};

// =====================================================
// ATS Platform Registry
// =====================================================

export const ATS_PLATFORMS: ATSPlatform[] = [
  greenhouseAdapter,
  leverAdapter,
  workdayAdapter,
  taleoAdapter,
  ashbyAdapter,
  smartRecruitersAdapter,
  linkedinAdapter,
  indeedAdapter,
  genericAdapter, // Always last as fallback
];

// =====================================================
// Platform Detection and Field Mapping
// =====================================================

export class ATSDetector {
  private currentPlatform: ATSPlatform | null = null;
  private detectedFields: FieldMapping[] = [];

  /**
   * Detect the current ATS platform
   */
  detectPlatform(): ATSPlatform {
    // Check if we've already detected the platform
    if (this.currentPlatform) {
      return this.currentPlatform;
    }

    // Try to detect platform by domain first
    const hostname = window.location.hostname.toLowerCase();
    for (const platform of ATS_PLATFORMS.slice(0, -1)) {
      // Exclude generic
      for (const domain of platform.domains) {
        if (hostname.includes(domain.toLowerCase())) {
          if (platform.detect()) {
            this.currentPlatform = platform;
            return platform;
          }
        }
      }
    }

    // Fallback to detection functions
    for (const platform of ATS_PLATFORMS.slice(0, -1)) {
      // Exclude generic
      if (platform.detect()) {
        this.currentPlatform = platform;
        return platform;
      }
    }

    // Use generic adapter as final fallback
    this.currentPlatform = genericAdapter;
    return genericAdapter;
  }

  /**
   * Find form fields using platform-specific selectors
   */
  detectFields(targetFields?: string[]): FieldMapping[] {
    const platform = this.detectPlatform();
    const fieldsToDetect = targetFields || Object.keys(platform.selectors);
    const mappings: FieldMapping[] = [];

    for (const fieldType of fieldsToDetect) {
      const selectors = platform.selectors[fieldType];
      if (!selectors) continue;

      const elements = this.findElementsBySelectors(selectors);

      for (const element of elements) {
        if (!isElementInteractable(element)) continue;

        const detectionReason = this.getDetectionReason(element, selectors);
        const confidence = calculateFieldConfidence(element, fieldType, detectionReason);

        // Only include high-confidence matches
        if (confidence >= 0.3) {
          mappings.push({
            element,
            fieldType,
            confidence,
            platform: platform.name,
            detectionReason,
          });
        }
      }

      // Try custom logic if no elements found
      if (mappings.filter(m => m.fieldType === fieldType).length === 0 && platform.customLogic) {
        const element = platform.customLogic(fieldType);
        if (element && isElementInteractable(element)) {
          mappings.push({
            element,
            fieldType,
            confidence: 0.8,
            platform: platform.name,
            detectionReason: ['custom-logic'],
          });
        }
      }
    }

    // Sort by confidence and remove duplicates
    const sortedMappings = mappings
      .sort((a, b) => b.confidence - a.confidence)
      .filter((mapping, index, array) => {
        // Remove duplicate elements (keep highest confidence)
        return array.findIndex(m => m.element === mapping.element) === index;
      });

    this.detectedFields = sortedMappings;
    return sortedMappings;
  }

  /**
   * Find elements using an array of selectors
   */
  private findElementsBySelectors(selectors: string[]): Element[] {
    const elements: Element[] = [];

    for (const selector of selectors) {
      try {
        const found = document.querySelectorAll(selector);
        elements.push(...Array.from(found));
      } catch (error) {
        console.warn('Invalid selector:', selector, error);
      }
    }

    return elements;
  }

  /**
   * Determine how the element was detected
   */
  private getDetectionReason(element: Element, selectors: string[]): string[] {
    const reasons: string[] = [];

    for (const selector of selectors) {
      if (element.matches(selector)) {
        if (selector.includes('[name=')) reasons.push('name-exact');
        else if (selector.includes('[name*=')) reasons.push('name-contains');
        else if (selector.includes('[id=')) reasons.push('id-exact');
        else if (selector.includes('[id*=')) reasons.push('id-contains');
        else if (selector.includes('[placeholder*=')) reasons.push('placeholder');
        else if (selector.includes('[aria-label*=')) reasons.push('aria-label');
        else if (selector.includes('[type=')) reasons.push('input-type');
        else if (selector.includes('[data-automation-id')) reasons.push('automation-id');
        else if (selector.includes('[data-qa')) reasons.push('data-qa');
        else if (selector.includes('[data-testid')) reasons.push('data-testid');
        else reasons.push('css-selector');
        break;
      }
    }

    return reasons;
  }

  /**
   * Get debug information about detected fields
   */
  getDebugInfo(): any {
    const platform = this.currentPlatform || this.detectPlatform();

    return {
      platform: platform.name,
      url: window.location.href,
      detectedFields: this.detectedFields.map(mapping =>
        createDebugInfo(
          mapping.element,
          mapping.fieldType,
          mapping.confidence,
          mapping.detectionReason
        )
      ),
      totalFields: this.detectedFields.length,
      highConfidenceFields: this.detectedFields.filter(m => m.confidence >= 0.7).length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset detection state
   */
  reset(): void {
    this.currentPlatform = null;
    this.detectedFields = [];
  }

  /**
   * Get the current platform
   */
  getCurrentPlatform(): ATSPlatform | null {
    return this.currentPlatform;
  }

  /**
   * Get detected fields
   */
  getDetectedFields(): FieldMapping[] {
    return this.detectedFields;
  }
}

// Export singleton instance
export const atsDetector = new ATSDetector();

// Make available for debugging
if (typeof window !== 'undefined') {
  (window as any).__JOB_AUTOFILL_ATS__ = {
    detector: atsDetector,
    platforms: ATS_PLATFORMS,
    ATSDetector,
  };
}
