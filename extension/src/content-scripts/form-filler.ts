// Enhanced form filler with multi-platform support and AI integration
import apiService from '../services/api.js';

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
    country: string;
  };
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
    gpa?: string;
  }>;
  skills: string[];
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
  }>;
  preferences: {
    jobTypes: string[];
    industries: string[];
    locations: string[];
    salaryRange: {
      min: number;
      max: number;
    };
    remote: boolean;
  };
}

class EnhancedFormFiller {
  private userProfile: UserProfile | null = null;
  private settings: any = {};
  private templates: any[] = [];
  private currentJobDetails: any = null;
  private fillCount = 0;
  private analytics = {
    startTime: Date.now(),
    formFieldsFilled: 0,
    aiResponsesGenerated: 0,
    templatesUsed: 0,
  };

  constructor() {
    this.loadUserData();
    this.setupMessageListener();
    this.initializeApiConnection();
  }

  private async loadUserData(): Promise<void> {
    try {
      // Load local cache first
      const result = await chrome.storage.sync.get(['userProfile', 'settings']);
      this.userProfile = result.userProfile || null;
      this.settings = result.settings || {};

      // Sync with backend if authenticated
      if (apiService.isAuthenticated()) {
        await this.syncProfileWithBackend();
      }
    } catch (error) {
      console.warn('Failed to load user data:', error);
    }
  }

  private async syncProfileWithBackend(): Promise<void> {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        this.userProfile = response.data;
        // Update local cache
        await chrome.storage.sync.set({ userProfile: this.userProfile });
      }
    } catch (error) {
      console.warn('Failed to sync profile with backend:', error);
    }
  }

  private async initializeApiConnection(): Promise<void> {
    try {
      const isConnected = await apiService.checkConnection();
      if (!isConnected) {
        console.warn('Backend API is not available, using local data only');
      }
    } catch (error) {
      console.warn('Failed to connect to backend:', error);
    }
  }

  private setupMessageListener(): void {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
          case 'FILL_FORM':
            this.handleFillFormMessage(message.data);
            break;
          case 'FILL_FORM_AI':
            this.fillFormWithAI(message.data.jobDetails);
            break;
          case 'ANALYZE_JOB':
            this.analyzeCurrentJobPosting(sendResponse);
            return true; // Required for async response
          case 'GET_FORM_DATA':
            this.getFormData(sendResponse);
            return true;
        }
      });
    }
  }

  private async handleFillFormMessage(data: any): Promise<void> {
    this.analytics.startTime = Date.now();
    
    if (data.useAI && data.jobDetails) {
      await this.fillFormWithAI(data.jobDetails);
    } else {
      await this.fillFormBasic();
    }

    // Track analytics
    await this.trackFormFillAnalytics();
  }

  private async trackFormFillAnalytics(): Promise<void> {
    if (!apiService.isAuthenticated()) return;

    try {
      const analytics = {
        ...this.analytics,
        completionTime: Date.now() - this.analytics.startTime,
        url: window.location.href,
        domain: window.location.hostname,
      };

      // Log analytics (could be sent to backend)
      console.log('Form fill analytics:', analytics);
    } catch (error) {
      console.warn('Failed to track analytics:', error);
    }
  }

  private async fillFormBasic(): Promise<void> {
    if (!this.userProfile) {
      console.warn('No user profile available for form filling');
      return;
    }

    await this.loadTemplates();
    
    try {
      await this.fillPersonalInfo();
      await this.fillExperience();
      await this.fillEducation();
      await this.fillSkills();
      
      this.analytics.formFieldsFilled = document.querySelectorAll('input:not([value=""]), textarea:not(:empty), select option:checked').length;
      
      console.log('Basic form filling completed');
    } catch (error) {
      console.error('Form filling error:', error);
    }
  }
      return;
    }

    // Get field mapping from enhanced detector
    const formDetector = (window as any).enhancedFormDetector;
    if (!formDetector) {
      console.warn('Enhanced form detector not available');
      return;
    }

    const fieldMapping = formDetector.getFieldMapping();
    await this.fillStandardFields(fieldMapping);
  }

  private async initializeAuthToken(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(['authToken']);
      this.authToken = result.authToken || null;
      
      if (this.authToken) {
        await this.loadBackendProfile();
        await this.loadTemplates();
      }
    } catch (error) {
      console.warn('Failed to initialize auth token:', error);
    }
  }

  private async loadBackendProfile(): Promise<void> {
    if (!this.authToken) return;

    try {
      const response = await fetch(`${this.apiBaseUrl}/profile`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.userProfile = this.transformBackendProfile(data.data);
        console.log('✅ Loaded profile from backend');
      }
    } catch (error) {
      console.warn('Failed to load profile from backend:', error);
      // Fallback to local storage
      await this.loadUserData();
    }
  }

  private async loadTemplates(): Promise<void> {
    if (!this.authToken) return;

    try {
      const response = await fetch(`${this.apiBaseUrl}/templates?includePublic=true`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.templates = data.data.templates || [];
        console.log(`✅ Loaded ${this.templates.length} templates from backend`);
      }
    } catch (error) {
      console.warn('Failed to load templates from backend:', error);
    }
  }

  private transformBackendProfile(backendProfile: any): UserProfile {
    return {
      personalInfo: {
        firstName: backendProfile.personalInfo?.firstName || '',
        lastName: backendProfile.personalInfo?.lastName || '',
        email: backendProfile.personalInfo?.email || '',
        phone: backendProfile.personalInfo?.phone || '',
        address: backendProfile.personalInfo?.address?.street || '',
        city: backendProfile.personalInfo?.address?.city || '',
        state: backendProfile.personalInfo?.address?.state || '',
        zipCode: backendProfile.personalInfo?.address?.zipCode || '',
        linkedinUrl: backendProfile.personalInfo?.linkedinUrl || ''
      },
      experience: backendProfile.experience || [],
      education: backendProfile.education || [],
      skills: backendProfile.skills || []
    };
  }

  public async fillFormWithAI(jobDetails: any): Promise<void> {
    if (!this.authToken || !this.userProfile) {
      console.warn('Cannot use AI filling without authentication and profile');
      await this.fillFormBasic();
      return;
    }

    try {
      // Get enhanced form detector
      const formDetector = (window as any).enhancedFormDetector;
      if (!formDetector) {
        console.warn('Enhanced form detector not available');
        await this.fillFormBasic();
        return;
      }

      const fieldMapping = formDetector.getFieldMapping();
      const platformFeatures = formDetector.getPlatformFeatures();

      // Analyze the job for better responses
      const analysis = await this.analyzeJobWithAI(jobDetails);
      
      // Fill standard fields
      await this.fillStandardFields(fieldMapping);

      // Fill custom fields with AI-generated content
      await this.fillCustomFieldsWithAI(fieldMapping, jobDetails, analysis, platformFeatures);

      // Track application for analytics
      await this.trackApplicationStart(jobDetails);

      console.log('✅ Form filled using AI assistance');
    } catch (error) {
      console.error('AI form filling failed:', error);
      await this.fillFormBasic();
    }
  }

  private async analyzeJobWithAI(jobDetails: any): Promise<any> {
    if (!this.authToken) return null;

    try {
      const response = await fetch(`${this.apiBaseUrl}/ai/analyze-job-advanced`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobTitle: jobDetails.title,
          jobDescription: jobDetails.description,
          companyName: jobDetails.company
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.warn('Failed to analyze job with AI:', error);
    }

    return null;
  }

  private async fillStandardFields(fieldMapping: Map<string, HTMLInputElement>): Promise<void> {
    if (!this.userProfile) return;

    const personalInfo = this.userProfile.personalInfo;
    const standardFields = {
      firstName: personalInfo.firstName,
      lastName: personalInfo.lastName,
      email: personalInfo.email,
      phone: personalInfo.phone,
      address: personalInfo.address,
      city: personalInfo.city,
      state: personalInfo.state,
      zipCode: personalInfo.zipCode
    };

    for (const [fieldName, value] of Object.entries(standardFields)) {
      const field = fieldMapping.get(fieldName);
      if (field && value) {
        await this.fillFieldWithAnimation(field, value);
      }
    }
  }

  private async fillCustomFieldsWithAI(
    fieldMapping: Map<string, HTMLInputElement>,
    jobDetails: any,
    analysis: any,
    platformFeatures: any
  ): Promise<void> {
    // Find text areas and custom fields that might need AI-generated content
    const customFields = this.identifyCustomFields(fieldMapping);

    for (const field of customFields) {
      const aiContent = await this.generateAIContent(field, jobDetails, analysis);
      if (aiContent) {
        await this.fillFieldWithAnimation(field.element, aiContent);
      }
    }
  }

  private identifyCustomFields(fieldMapping: Map<string, HTMLInputElement>): Array<{element: HTMLElement, type: string, purpose: string}> {
    const customFields: Array<{element: HTMLElement, type: string, purpose: string}> = [];
    
    // Look for text areas and large text inputs
    document.querySelectorAll('textarea, input[type="text"]').forEach((element: HTMLElement) => {
      const el = element as HTMLInputElement | HTMLTextAreaElement;
      
      // Skip if it's already mapped to a standard field
      const isStandardField = Array.from(fieldMapping.values()).includes(el as HTMLInputElement);
      if (isStandardField) return;

      const purpose = this.identifyFieldPurpose(el);
      if (purpose !== 'unknown') {
        customFields.push({
          element: el,
          type: el.tagName.toLowerCase(),
          purpose
        });
      }
    });

    return customFields;
  }

  private identifyFieldPurpose(element: HTMLElement): string {
    const label = this.getFieldLabel(element);
    const placeholder = element.getAttribute('placeholder') || '';
    const name = element.getAttribute('name') || '';
    const id = element.getAttribute('id') || '';
    
    const text = `${label} ${placeholder} ${name} ${id}`.toLowerCase();

    if (text.includes('cover letter') || text.includes('covering letter')) {
      return 'cover_letter';
    }
    if (text.includes('why') && (text.includes('interested') || text.includes('want') || text.includes('apply'))) {
      return 'why_interested';
    }
    if (text.includes('experience') || text.includes('background')) {
      return 'experience';
    }
    if (text.includes('skills') || text.includes('qualifications')) {
      return 'skills';
    }
    if (text.includes('personal statement') || text.includes('about yourself')) {
      return 'personal_statement';
    }
    if (text.includes('additional') || text.includes('comments') || text.includes('notes')) {
      return 'additional_info';
    }

    return 'unknown';
  }

  private async generateAIContent(field: any, jobDetails: any, analysis: any): Promise<string | null> {
    if (!this.authToken) return null;

    try {
      // First try to find a relevant template
      const template = this.findBestTemplate(field.purpose, jobDetails);
      if (template) {
        return this.populateTemplate(template, jobDetails, analysis);
      }

      // Fall back to AI generation
      const response = await fetch(`${this.apiBaseUrl}/ai/generate-response`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fieldType: field.purpose,
          context: {
            jobDetails,
            analysis,
            fieldLabel: this.getFieldLabel(field.element)
          },
          options: {
            tone: this.settings.tone || 'professional',
            length: this.getDesiredLength(field.element)
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.data.content;
      }
    } catch (error) {
      console.warn('Failed to generate AI content:', error);
    }

    return null;
  }

  private findBestTemplate(purpose: string, jobDetails: any): any {
    // Find templates matching the field purpose
    const relevantTemplates = this.templates.filter(template => 
      template.category === purpose ||
      template.tags?.includes(purpose) ||
      template.tags?.includes(jobDetails.platform?.toLowerCase())
    );

    if (relevantTemplates.length === 0) return null;

    // Sort by usage count and rating
    relevantTemplates.sort((a, b) => {
      const scoreA = (a.usageCount || 0) * 0.7 + (a.rating || 0) * 0.3;
      const scoreB = (b.usageCount || 0) * 0.7 + (b.rating || 0) * 0.3;
      return scoreB - scoreA;
    });

    return relevantTemplates[0];
  }

  private populateTemplate(template: any, jobDetails: any, analysis: any): string {
    let content = template.content;

    // Replace common placeholders
    const placeholders = {
      '{jobTitle}': jobDetails.title || '',
      '{companyName}': jobDetails.company || '',
      '{firstName}': this.userProfile?.personalInfo.firstName || '',
      '{lastName}': this.userProfile?.personalInfo.lastName || '',
      '{skills}': this.userProfile?.skills.join(', ') || '',
      '{topSkills}': analysis?.skillMatch?.matchedSkills?.slice(0, 3).join(', ') || '',
      '{relevantExperience}': this.getRelevantExperience(analysis) || '',
      '{strengthsToHighlight}': analysis?.advancedRecommendations?.strengthsToHighlight?.join(', ') || ''
    };

    for (const [placeholder, value] of Object.entries(placeholders)) {
      content = content.replace(new RegExp(placeholder, 'g'), value);
    }

    return content;
  }

  private getRelevantExperience(analysis: any): string {
    if (!this.userProfile?.experience || !analysis?.skillMatch?.matchedSkills) {
      return '';
    }

    const relevantExperiences = this.userProfile.experience.filter(exp => {
      return analysis.skillMatch.matchedSkills.some((skill: string) =>
        exp.skills.some(expSkill => 
          expSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(expSkill.toLowerCase())
        )
      );
    });

    return relevantExperiences
      .slice(0, 2)
      .map(exp => `${exp.position} at ${exp.company}`)
      .join(', ');
  }

  private getDesiredLength(element: HTMLElement): 'short' | 'medium' | 'long' {
    if (element.tagName.toLowerCase() === 'textarea') {
      const rows = parseInt(element.getAttribute('rows') || '0');
      if (rows > 10) return 'long';
      if (rows > 5) return 'medium';
    }
    
    const maxLength = parseInt(element.getAttribute('maxlength') || '0');
    if (maxLength > 1000) return 'long';
    if (maxLength > 200) return 'medium';
    
    return 'short';
  }

  private async trackApplicationStart(jobDetails: any): Promise<void> {
    if (!this.authToken) return;

    try {
      await fetch(`${this.apiBaseUrl}/applications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobDetails,
          status: 'draft',
          tracking: {
            startedAt: new Date().toISOString(),
            source: window.location.hostname,
            referrer: document.referrer
          }
        })
      });
    } catch (error) {
      console.warn('Failed to track application start:', error);
    }
  }

  private async fillFieldWithAnimation(element: HTMLElement, value: string): Promise<void> {
    const input = element as HTMLInputElement | HTMLTextAreaElement;
    
    // Add visual feedback
    element.style.backgroundColor = '#e3f2fd';
    element.style.transition = 'background-color 0.3s ease';
    
    // Simulate typing for better UX
    if (this.settings.animateTyping) {
      await this.typeText(input, value);
    } else {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Reset background
    setTimeout(() => {
      element.style.backgroundColor = '';
    }, 1000);
  }

  private async typeText(element: HTMLInputElement | HTMLTextAreaElement, text: string): Promise<void> {
    element.value = '';
    element.focus();
    
    for (let i = 0; i < text.length; i++) {
      element.value += text[i];
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
    }
    
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.blur();
  }

  private getFieldLabel(element: HTMLElement): string {
    // Try multiple ways to get field label
    const id = element.getAttribute('id');
    if (id) {
      const labelElement = document.querySelector(`label[for="${id}"]`);
      if (labelElement) return labelElement.textContent?.trim() || '';
    }

    // Look for parent label
    const parentLabel = element.closest('label');
    if (parentLabel) return parentLabel.textContent?.trim() || '';

    // Look for adjacent label
    const previousSibling = element.previousElementSibling;
    if (previousSibling && previousSibling.tagName === 'LABEL') {
      return previousSibling.textContent?.trim() || '';
    }

    // Check placeholder or name as fallback
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) return placeholder;

    const name = element.getAttribute('name');
    if (name) return name;

    return '';
  }

    // Use placeholder or name as fallback
    return element.getAttribute('placeholder') || 
           element.getAttribute('name') || 
           element.getAttribute('id') || 
           'Unknown Field';
  }
}

// Initialize enhanced form filler
const enhancedFormFiller = new EnhancedFormFiller();

// Export for use by other scripts and maintain backward compatibility  
(window as any).formFiller = enhancedFormFiller;
(window as any).enhancedFormFiller = enhancedFormFiller;
