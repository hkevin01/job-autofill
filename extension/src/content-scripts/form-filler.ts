// Form filler content script for Job AutoFill extension

console.log('Job AutoFill form filler loaded');

interface FillableField {
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  type: string;
  label: string;
  value?: string;
}

interface UserProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    linkedinUrl?: string;
  };
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    skills: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
  }>;
  skills: string[];
}

class FormFiller {
  private userProfile: UserProfile | null = null;
  private settings: any = {};

  constructor() {
    this.loadUserData();
    this.setupMessageListener();
  }

  private async loadUserData() {
    try {
      const result = await chrome.storage.sync.get(['userProfile', 'settings']);
      this.userProfile = result.userProfile || null;
      this.settings = result.settings || {};
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
      switch (message.type) {
        case 'AUTO_FILL_FORMS':
          this.fillAllForms().then(result => sendResponse(result));
          return true; // Keep message channel open for async response
        
        case 'ANALYZE_PAGE':
          const analysis = this.analyzePage();
          sendResponse(analysis);
          break;
        
        case 'SAVE_APPLICATION':
          this.saveCurrentApplication().then(result => sendResponse(result));
          return true;
        
        case 'SETTINGS_UPDATED':
          this.settings = message.data;
          break;
      }
    });
  }

  public analyzePage(): { success: boolean; data: { formsFound: number; fields: number } } {
    const forms = document.querySelectorAll('form');
    let totalFields = 0;
    
    forms.forEach(form => {
      const fields = this.detectFormFields(form);
      totalFields += fields.length;
    });

    return {
      success: true,
      data: {
        formsFound: forms.length,
        fields: totalFields
      }
    };
  }

  public async fillAllForms(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.userProfile) {
        throw new Error('User profile not found. Please complete your profile first.');
      }

      if (!this.settings.autoFillEnabled) {
        throw new Error('Auto-fill is disabled. Enable it in settings.');
      }

      const forms = Array.from(document.querySelectorAll('form'));
      let filledFormsCount = 0;

      for (const form of forms) {
        const filled = await this.fillForm(form as HTMLFormElement);
        if (filled) filledFormsCount++;
      }

      if (filledFormsCount === 0) {
        throw new Error('No forms found to fill');
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error filling forms:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  private async fillForm(form: HTMLFormElement): Promise<boolean> {
    const fields = this.detectFormFields(form);
    let filledCount = 0;

    for (const field of fields) {
      const value = this.getFieldValue(field);
      if (value && this.fillField(field.element, value)) {
        filledCount++;
        // Add small delay between fills for natural feel
        await this.delay(100);
      }
    }

    return filledCount > 0;
  }

  private detectFormFields(form: HTMLFormElement): FillableField[] {
    const fields: FillableField[] = [];
    const inputs = form.querySelectorAll('input, textarea, select');

    inputs.forEach(element => {
      const el = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      
      // Skip hidden, submit, and button inputs
      if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') {
        return;
      }

      const fieldType = this.detectFieldType(el);
      if (fieldType) {
        fields.push({
          element: el,
          type: fieldType,
          label: this.getFieldLabel(el)
        });
      }
    });

    return fields;
  }

  private detectFieldType(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string | null {
    const name = element.name?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';
    const placeholder = (element as HTMLInputElement).placeholder?.toLowerCase() || '';
    const label = this.getFieldLabel(element).toLowerCase();

    // Personal information
    if (this.matchesPattern(name, id, placeholder, label, ['first', 'fname', 'given'])) return 'firstName';
    if (this.matchesPattern(name, id, placeholder, label, ['last', 'lname', 'surname', 'family'])) return 'lastName';
    if (this.matchesPattern(name, id, placeholder, label, ['email', 'mail'])) return 'email';
    if (this.matchesPattern(name, id, placeholder, label, ['phone', 'tel', 'mobile', 'cell'])) return 'phone';
    
    // Address
    if (this.matchesPattern(name, id, placeholder, label, ['address', 'street'])) return 'address';
    if (this.matchesPattern(name, id, placeholder, label, ['city', 'town'])) return 'city';
    if (this.matchesPattern(name, id, placeholder, label, ['state', 'province', 'region'])) return 'state';
    if (this.matchesPattern(name, id, placeholder, label, ['zip', 'postal', 'postcode'])) return 'zipCode';
    
    // Professional
    if (this.matchesPattern(name, id, placeholder, label, ['linkedin', 'profile'])) return 'linkedinUrl';
    if (this.matchesPattern(name, id, placeholder, label, ['resume', 'cv'])) return 'resume';
    if (this.matchesPattern(name, id, placeholder, label, ['cover', 'letter', 'motivation'])) return 'coverLetter';
    
    // Check for textarea or large text fields for cover letters
    if (element.tagName.toLowerCase() === 'textarea') {
      if (this.matchesPattern(name, id, placeholder, label, ['cover', 'letter', 'why', 'motivation', 'interest'])) {
        return 'coverLetter';
      }
      if (this.matchesPattern(name, id, placeholder, label, ['summary', 'about', 'bio', 'description'])) {
        return 'summary';
      }
    }

    return null;
  }

  private matchesPattern(name: string, id: string, placeholder: string, label: string, patterns: string[]): boolean {
    const text = `${name} ${id} ${placeholder} ${label}`;
    return patterns.some(pattern => text.includes(pattern));
  }

  private getFieldLabel(element: HTMLElement): string {
    // Check for associated label
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent?.trim() || '';
    }

    // Check for parent label
    const parentLabel = element.closest('label');
    if (parentLabel) return parentLabel.textContent?.trim() || '';

    // Check for nearby text
    const previousSibling = element.previousElementSibling;
    if (previousSibling && ['LABEL', 'SPAN', 'DIV'].includes(previousSibling.tagName)) {
      return previousSibling.textContent?.trim() || '';
    }

    return '';
  }

  private getFieldValue(field: FillableField): string | null {
    if (!this.userProfile) return null;

    const { personalInfo, experience, education } = this.userProfile;

    switch (field.type) {
      case 'firstName':
        return personalInfo.firstName;
      case 'lastName':
        return personalInfo.lastName;
      case 'email':
        return personalInfo.email;
      case 'phone':
        return personalInfo.phone;
      case 'address':
        return personalInfo.address;
      case 'city':
        return personalInfo.city;
      case 'state':
        return personalInfo.state;
      case 'zipCode':
        return personalInfo.zipCode;
      case 'linkedinUrl':
        return personalInfo.linkedinUrl || '';
      case 'coverLetter':
        return this.generateCoverLetter();
      case 'summary':
        return this.generateSummary();
      default:
        return null;
    }
  }

  private fillField(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string): boolean {
    try {
      // Handle different input types
      if (element.tagName.toLowerCase() === 'select') {
        const select = element as HTMLSelectElement;
        const option = Array.from(select.options).find(opt => 
          opt.text.toLowerCase().includes(value.toLowerCase()) ||
          opt.value.toLowerCase().includes(value.toLowerCase())
        );
        if (option) {
          select.value = option.value;
          this.triggerEvents(element);
          return true;
        }
      } else {
        // Regular input or textarea
        element.value = value;
        this.triggerEvents(element);
        return true;
      }
    } catch (error) {
      console.error('Error filling field:', error);
    }
    return false;
  }

  private triggerEvents(element: HTMLElement) {
    // Trigger events to ensure form validation and handlers work
    const events = ['input', 'change', 'blur'];
    events.forEach(eventType => {
      const event = new Event(eventType, { bubbles: true });
      element.dispatchEvent(event);
    });
  }

  private generateCoverLetter(): string {
    if (!this.userProfile) return '';
    
    const { personalInfo, experience } = this.userProfile;
    const latestJob = experience?.[0];
    
    return `Dear Hiring Manager,

I am writing to express my strong interest in this position. With my background in ${latestJob?.position || 'my field'} and experience at ${latestJob?.company || 'previous companies'}, I am confident I would be a valuable addition to your team.

In my previous role${latestJob ? ` as ${latestJob.position} at ${latestJob.company}` : ''}, I have developed strong skills in ${this.userProfile.skills.slice(0, 3).join(', ')}. I am particularly drawn to this opportunity because it aligns perfectly with my career goals and expertise.

I would welcome the opportunity to discuss how my skills and experience can contribute to your organization's success.

Best regards,
${personalInfo.firstName} ${personalInfo.lastName}`;
  }

  private generateSummary(): string {
    if (!this.userProfile) return '';
    
    const { experience, skills } = this.userProfile;
    const latestJob = experience?.[0];
    
    return `Experienced professional with ${experience?.length || 0}+ years in ${latestJob?.position || 'the industry'}. Skilled in ${skills.slice(0, 5).join(', ')}. Proven track record of delivering results and contributing to team success.`;
  }

  private async saveCurrentApplication(): Promise<{ success: boolean; error?: string }> {
    try {
      const jobDetails = this.extractJobDetails();
      const application = {
        jobDetails,
        url: window.location.href,
        appliedAt: new Date().toISOString(),
        status: 'saved'
      };

      // Save to storage
      const result = await chrome.storage.local.get('applications');
      const applications = result.applications || [];
      applications.push(application);
      await chrome.storage.local.set({ applications });

      return { success: true };
    } catch (error: any) {
      console.error('Error saving application:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  private extractJobDetails(): any {
    // Try to extract job title, company, and description from the page
    const jobTitle = this.extractText(['h1', '.job-title', '[data-test="job-title"]']);
    const company = this.extractText(['.company-name', '[data-test="company-name"]', '.employer']);
    const description = this.extractText(['.job-description', '.description', '.job-summary']);

    return {
      title: jobTitle,
      company: company,
      description: description?.substring(0, 1000) // Limit description length
    };
  }

  private extractText(selectors: string[]): string {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize form filler
const formFiller = new FormFiller();
