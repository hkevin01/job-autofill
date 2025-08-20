// Job board detector - identifies which job platform the user is on
declare const chrome: any;

export interface JobBoard {
  name: string;
  domain: string;
  selectors: JobBoardSelectors;
  features: JobBoardFeatures;
}

export interface JobBoardSelectors {
  // Job listing selectors
  jobTitle: string[];
  companyName: string[];
  jobDescription: string[];
  jobLocation: string[];
  jobType: string[];
  salary: string[];

  // Application form selectors
  applyButton: string[];
  applicationForm: string[];

  // Common form fields (override generic selectors)
  firstName?: string[];
  lastName?: string[];
  email?: string[];
  phone?: string[];
  resume?: string[];
  coverLetter?: string[];

  // Platform-specific fields
  customFields?: Record<string, string[]>;
}

export interface JobBoardFeatures {
  hasQuickApply: boolean;
  hasMultiStep: boolean;
  hasFileUpload: boolean;
  hasCustomQuestions: boolean;
  requiresAccount: boolean;
}

// Supported job boards configuration
export const JOB_BOARDS: Record<string, JobBoard> = {
  greenhouse: {
    name: 'Greenhouse',
    domain: 'greenhouse.io',
    selectors: {
      jobTitle: ['h1', '.app-title', '.opening .title'],
      companyName: ['.company-name', 'a[href*="greenhouse.io/companies"]', '.opening .company'],
      jobDescription: ['.opening .content', '#content', '.content'],
      jobLocation: ['.location', '.opening .location'],
      jobType: ['.employment-type'],
      salary: ['.compensation'],
      applyButton: ['a[href*="/apply" i]', 'a[href*="/applications" i]', 'button[type="submit"]'],
      applicationForm: ['form#application_form', 'form[action*="/applications" i]', 'form[action*="/apply" i]'],
      firstName: ['input[name="first_name"]', 'input[name*="first" i]', 'input[id*="first" i]'],
      lastName: ['input[name="last_name"]', 'input[name*="last" i]', 'input[id*="last" i]'],
      email: ['input[name="email"]', 'input[type="email"]'],
      phone: ['input[name="phone"]', 'input[type="tel"]'],
      resume: ['input[type="file"][name*="resume" i]', 'input[type="file"][name*="cv" i]'],
      coverLetter: ['textarea[name*="cover" i]']
    },
    features: {
      hasQuickApply: false,
      hasMultiStep: false,
      hasFileUpload: true,
      hasCustomQuestions: true,
      requiresAccount: false
    }
  },

  lever: {
    name: 'Lever',
    domain: 'lever.co',
    selectors: {
      jobTitle: ['.posting-headline h2', 'h2.posting-headline'],
      companyName: ['.posting-headline .company', 'a[href*="jobs.lever.co"]'],
      jobDescription: ['.section-wrapper.page-full-width', '.posting-description'],
      jobLocation: ['.posting-categories .location', '.sort-by-time > .location'],
      jobType: ['.posting-categories .commitment'],
      salary: ['.compensation'],
      applyButton: ['a[href*="/apply" i]', 'button[type="submit"]'],
      applicationForm: ['form.posting-form', 'form[action*="/apply" i]'],
      firstName: ['input[name*="first" i]', 'input[id*="first" i]'],
      lastName: ['input[name*="last" i]', 'input[id*="last" i]'],
      email: ['input[name="email"]', 'input[type="email"]'],
      phone: ['input[name="phone"]', 'input[type="tel"]'],
      resume: ['input[type="file"][name*="resume" i]'],
      coverLetter: ['textarea[name*="cover" i]']
    },
    features: {
      hasQuickApply: false,
      hasMultiStep: false,
      hasFileUpload: true,
      hasCustomQuestions: true,
      requiresAccount: false
    }
  },

  workday: {
    name: 'Workday',
    domain: 'myworkdayjobs.com',
    selectors: {
      jobTitle: ['h1', '[data-automation-id*="jobTitle" i]'],
      companyName: ['[data-automation-id*="company" i]'],
      jobDescription: ['[data-automation-id*="jobPostingDescription" i]', '.gwt-HTML'],
      jobLocation: ['[data-automation-id*="locations" i]', '[data-automation-id*="jobPostingLocations" i]'],
      jobType: ['[data-automation-id*="jobPostingJobType" i]'],
      salary: ['[data-automation-id*="compensation" i]'],
      applyButton: ['button[title*="Apply" i]', 'button[data-automation-id*="apply" i]'],
      applicationForm: ['form', 'div[role="form"]', '.gwt-FormPanel'],
      firstName: ['input[name*="first" i]', 'input[id*="first" i]'],
      lastName: ['input[name*="last" i]', 'input[id*="last" i]'],
      email: ['input[type="email"]', 'input[name*="email" i]'],
      phone: ['input[type="tel"]', 'input[name*="phone" i]'],
      resume: ['input[type="file"]'],
      coverLetter: ['textarea[name*="cover" i]']
    },
    features: {
      hasQuickApply: false,
      hasMultiStep: true,
      hasFileUpload: true,
      hasCustomQuestions: true,
      requiresAccount: true
    }
  },

  taleo: {
    name: 'Taleo',
    domain: 'taleo.net',
    selectors: {
      jobTitle: ['h1', '.title'],
      companyName: ['.company', '.branding'],
      jobDescription: ['.description', '#requisitionDescriptionInterface\.requisitionDescription', '.jobdescription'],
      jobLocation: ['.location', '[id*="location" i]'],
      jobType: ['.employmentType'],
      salary: ['.salaryRange'],
      applyButton: ['a[href*="applyRequisition" i]', 'button[type="submit"]'],
      applicationForm: ['form[action*="applyRequisition" i]', 'form[id*="apply" i]'],
      firstName: ['input[id*="firstName" i]', 'input[name*="first" i]'],
      lastName: ['input[id*="lastName" i]', 'input[name*="last" i]'],
      email: ['input[id*="email" i]', 'input[type="email"]'],
      phone: ['input[id*="phone" i]', 'input[type="tel"]'],
      resume: ['input[type="file"]'],
      coverLetter: ['textarea[name*="cover" i]']
    },
    features: {
      hasQuickApply: false,
      hasMultiStep: true,
      hasFileUpload: true,
      hasCustomQuestions: true,
      requiresAccount: true
    }
  },

  ashby: {
    name: 'Ashby',
    domain: 'ashbyhq.com',
    selectors: {
      jobTitle: ['h1', '[data-testid*="job-title" i]'],
      companyName: ['[data-testid*="company-name" i]', 'a[href*="jobs.ashbyhq.com" i]'],
      jobDescription: ['[data-testid*="job-description" i]', '.ProseMirror'],
      jobLocation: ['[data-testid*="job-location" i]', '.location'],
      jobType: ['.employment-type'],
      salary: ['[data-testid*="salary" i]'],
      applyButton: ['a[href*="/application" i]', 'button[type="submit"]'],
      applicationForm: ['form[action*="/application" i]', 'form'],
      firstName: ['input[name*="first" i]', 'input[id*="first" i]'],
      lastName: ['input[name*="last" i]', 'input[id*="last" i]'],
      email: ['input[name*="email" i]', 'input[type="email"]'],
      phone: ['input[name*="phone" i]', 'input[type="tel"]'],
      resume: ['input[type="file"]'],
      coverLetter: ['textarea[name*="cover" i]']
    },
    features: {
      hasQuickApply: false,
      hasMultiStep: false,
      hasFileUpload: true,
      hasCustomQuestions: true,
      requiresAccount: false
    }
  },

  smartrecruiters: {
    name: 'SmartRecruiters',
    domain: 'smartrecruiters.com',
    selectors: {
      jobTitle: ['h1', '[data-qa*="job-title" i]'],
      companyName: ['[data-qa*="company-name" i]'],
      jobDescription: ['[data-qa*="job-description" i]', '.job-page__description'],
      jobLocation: ['[data-qa*="job-location" i]'],
      jobType: ['[data-qa*="job-type" i]'],
      salary: ['[data-qa*="salary" i]'],
      applyButton: ['a[href*="/apply" i]', 'button[type="submit"]'],
      applicationForm: ['form', 'form[action*="/apply" i]'],
      firstName: ['input[name="firstName" i]', 'input[name*="first" i]'],
      lastName: ['input[name="lastName" i]', 'input[name*="last" i]'],
      email: ['input[name="email" i]', 'input[type="email"]'],
      phone: ['input[name="phoneNumber" i]', 'input[type="tel"]'],
      resume: ['input[type="file"]'],
      coverLetter: ['textarea[name*="cover" i]']
    },
    features: {
      hasQuickApply: true,
      hasMultiStep: true,
      hasFileUpload: true,
      hasCustomQuestions: true,
      requiresAccount: false
    }
  },
  linkedin: {
    name: 'LinkedIn',
    domain: 'linkedin.com',
    selectors: {
      jobTitle: [
        '.jobs-unified-top-card__job-title',
        '.job-details-jobs-unified-top-card__job-title',
        'h1[data-test-id="job-title"]'
      ],
      companyName: [
        '.jobs-unified-top-card__company-name',
        '.job-details-jobs-unified-top-card__company-name',
        'a[data-test-id="job-details-company-name"]'
      ],
      jobDescription: [
        '.jobs-description-content__text',
        '.jobs-box__html-content',
        '#job-details'
      ],
      jobLocation: [
        '.jobs-unified-top-card__bullet',
        '.job-details-jobs-unified-top-card__primary-description-text'
      ],
      jobType: [
        '.jobs-unified-top-card__workplace-type',
        '.job-details-jobs-unified-top-card__workplace-type'
      ],
      salary: [
        '.jobs-unified-top-card__job-insight',
        '.job-details-jobs-unified-top-card__job-insight'
      ],
      applyButton: [
        '.jobs-apply-button',
        'button[aria-label*="Apply"]',
        'button[data-test-id="apply-button"]'
      ],
      applicationForm: [
        '.jobs-easy-apply-content',
        '.jobs-easy-apply-modal',
        'form[data-test-id="jobs-apply-form"]'
      ],
      firstName: [
        'input[id*="firstName"]',
        'input[name*="firstName"]'
      ],
      lastName: [
        'input[id*="lastName"]',
        'input[name*="lastName"]'
      ],
      phone: [
        'input[id*="phoneNumber"]',
        'input[name*="phoneNumber"]'
      ],
      customFields: {
        linkedinProfile: ['input[id*="profile"]', 'input[name*="profile"]'],
        portfolio: ['input[id*="portfolio"]', 'input[name*="website"]']
      }
    },
    features: {
      hasQuickApply: true,
      hasMultiStep: true,
      hasFileUpload: true,
      hasCustomQuestions: true,
      requiresAccount: true
    }
  },

  indeed: {
    name: 'Indeed',
    domain: 'indeed.com',
    selectors: {
      jobTitle: [
        '[data-testid="jobsearch-JobInfoHeader-title"]',
        '.jobsearch-JobInfoHeader-title',
        'h1[data-test-id="job-title"]'
      ],
      companyName: [
        '[data-testid="inlineHeader-companyName"]',
        '.jobsearch-InlineCompanyRating-companyHeader',
        'span[data-test-id="company-name"]'
      ],
      jobDescription: [
        '#jobDescriptionText',
        '.jobsearch-jobDescriptionText',
        '[data-test-id="job-description"]'
      ],
      jobLocation: [
        '[data-testid="job-location"]',
        '.jobsearch-JobInfoHeader-subtitle',
        '.jobLocationText'
      ],
      jobType: [
        '.jobsearch-JobMetadataHeader-item',
        '.jobsearch-JobDescriptionSection-sectionItem'
      ],
      salary: [
        '.jobsearch-JobMetadataHeader-item',
        '.icl-u-textColor--success'
      ],
      applyButton: [
        '.indeed-apply-button',
        'button[aria-label*="Apply"]',
        '.ia-continueButton'
      ],
      applicationForm: [
        '.indeed-apply-widget',
        '.ia-Modal-content',
        '#ia-container'
      ],
      resume: [
        'input[type="file"][accept*=".pdf"]',
        'input[name*="resume"]'
      ],
      coverLetter: [
        'textarea[name*="coverLetter"]',
        'textarea[name*="cover"]'
      ]
    },
    features: {
      hasQuickApply: true,
      hasMultiStep: false,
      hasFileUpload: true,
      hasCustomQuestions: true,
      requiresAccount: false
    }
  },

  glassdoor: {
    name: 'Glassdoor',
    domain: 'glassdoor.com',
    selectors: {
      jobTitle: [
        '[data-test="job-title"]',
        '.JobDetails_jobTitle__Rw_gn'
      ],
      companyName: [
        '[data-test="employer-name"]',
        '.JobDetails_companyName__W3oAV'
      ],
      jobDescription: [
        '.JobDetails_jobDescription__uW_fK',
        '[data-test="job-description"]'
      ],
      jobLocation: [
        '[data-test="job-location"]',
        '.JobDetails_location__mSg5h'
      ],
      jobType: [
        '.JobDetails_jobType__3QEpx'
      ],
      salary: [
        '.JobDetails_salary__Yr9Ow',
        '[data-test="salary-estimate"]'
      ],
      applyButton: [
        '[data-test="apply-button"]',
        '.JobDetails_applyButton__x_fen'
      ],
      applicationForm: [
        '.JobApplication_container__QTJez'
      ]
    },
    features: {
      hasQuickApply: false,
      hasMultiStep: true,
      hasFileUpload: true,
      hasCustomQuestions: true,
      requiresAccount: true
    }
  },

  ziprecruiter: {
    name: 'ZipRecruiter',
    domain: 'ziprecruiter.com',
    selectors: {
      jobTitle: [
        'h1[data-testid="job-title"]',
        '.jobTitle'
      ],
      companyName: [
        '[data-testid="company-name"]',
        '.companyName'
      ],
      jobDescription: [
        '.jobDescriptionSection',
        '[data-testid="job-description"]'
      ],
      jobLocation: [
        '[data-testid="job-location"]',
        '.location'
      ],
      jobType: [
        '.jobType'
      ],
      salary: [
        '.salary',
        '[data-testid="salary"]'
      ],
      applyButton: [
        '.apply_button',
        'button[data-testid="apply-button"]'
      ],
      applicationForm: [
        '.application-form'
      ]
    },
    features: {
      hasQuickApply: true,
      hasMultiStep: false,
      hasFileUpload: true,
      hasCustomQuestions: false,
      requiresAccount: false
    }
  },

  monster: {
    name: 'Monster',
    domain: 'monster.com',
    selectors: {
      jobTitle: [
        'h1[data-test-id="svx-job-title"]',
        '.header-title'
      ],
      companyName: [
        '[data-test-id="svx-company-name"]',
        '.company-name'
      ],
      jobDescription: [
        '[data-test-id="svx-job-description-text"]',
        '.job-description'
      ],
      jobLocation: [
        '[data-test-id="svx-job-location"]',
        '.location'
      ],
      jobType: [
        '.job-type'
      ],
      salary: [
        '.salary-range'
      ],
      applyButton: [
        '[data-test-id="apply-button"]',
        '.apply-btn'
      ],
      applicationForm: [
        '.application-container'
      ]
    },
    features: {
      hasQuickApply: false,
      hasMultiStep: true,
      hasFileUpload: true,
      hasCustomQuestions: true,
      requiresAccount: true
    }
  }
};

export class JobBoardDetector {
  private currentBoard: JobBoard | null = null;

  constructor() {
    this.detectJobBoard();
  }

  private detectJobBoard(): void {
    const hostname = window.location.hostname.toLowerCase();

    for (const [key, board] of Object.entries(JOB_BOARDS)) {
      if (hostname.includes(board.domain)) {
        this.currentBoard = board;
        console.log(`✅ Detected job board: ${board.name}`);
        this.notifyExtension(board);
        break;
      }
    }

    if (!this.currentBoard) {
      console.log('ℹ️  Generic job site detected, using fallback selectors');
      this.currentBoard = this.createGenericBoard();
    }
  }

  private createGenericBoard(): JobBoard {
    return {
      name: 'Generic',
      domain: window.location.hostname,
      selectors: {
        jobTitle: ['h1', '.job-title', '.title', '[class*="title"]'],
        companyName: ['.company', '.company-name', '[class*="company"]'],
        jobDescription: ['.description', '.job-description', '[class*="description"]'],
        jobLocation: ['.location', '.job-location', '[class*="location"]'],
        jobType: ['.job-type', '.employment-type'],
        salary: ['.salary', '.compensation', '[class*="salary"]'],
        applyButton: ['button[type="submit"]', '.apply', '.apply-button', 'input[type="submit"]'],
        applicationForm: ['form', '.application-form', '.job-application']
      },
      features: {
        hasQuickApply: false,
        hasMultiStep: false,
        hasFileUpload: true,
        hasCustomQuestions: false,
        requiresAccount: false
      }
    };
  }

  private notifyExtension(board: JobBoard): void {
    // Send message to extension about detected job board
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'JOB_BOARD_DETECTED',
        data: {
          boardName: board.name,
          domain: board.domain,
          features: board.features,
          url: window.location.href
        }
      }).catch(() => {
        // Ignore errors if extension context is not available
      });
    }
  }

  public getCurrentBoard(): JobBoard | null {
    return this.currentBoard;
  }

  public getJobDetails(): any {
    if (!this.currentBoard) return null;

    const details: any = {};
    const selectors = this.currentBoard.selectors;

    // Extract job information using platform-specific selectors
    details.title = this.extractText(selectors.jobTitle);
    details.company = this.extractText(selectors.companyName);
    details.description = this.extractText(selectors.jobDescription);
    details.location = this.extractText(selectors.jobLocation);
    details.jobType = this.extractText(selectors.jobType);
    details.salary = this.extractText(selectors.salary);
    details.url = window.location.href;
    details.platform = this.currentBoard.name;

    return details;
  }

  private extractText(selectors: string[]): string {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent?.trim() || '';
      }
    }
    return '';
  }

  public findApplicationForm(): HTMLFormElement | null {
    if (!this.currentBoard) return null;

    for (const selector of this.currentBoard.selectors.applicationForm) {
      const form = document.querySelector(selector) as HTMLFormElement;
      if (form) {
        return form;
      }
    }

    // Fallback to any form on the page
    return document.querySelector('form');
  }

  public findApplyButton(): HTMLButtonElement | null {
    if (!this.currentBoard) return null;

    for (const selector of this.currentBoard.selectors.applyButton) {
      const button = document.querySelector(selector) as HTMLButtonElement;
      if (button && !button.disabled) {
        return button;
      }
    }

    return null;
  }

  public isQuickApplyAvailable(): boolean {
    return this.currentBoard?.features.hasQuickApply || false;
  }

  public requiresAccount(): boolean {
    return this.currentBoard?.features.requiresAccount || false;
  }

  public hasMultiStepApplication(): boolean {
    return this.currentBoard?.features.hasMultiStep || false;
  }
}

// Initialize detector when script loads
const jobBoardDetector = new JobBoardDetector();

// Export for use by other content scripts
(window as any).jobBoardDetector = jobBoardDetector;
