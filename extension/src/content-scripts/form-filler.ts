// Enhanced form filler with multi-platform support and AI integration
// Declare chrome for content script usage
declare const chrome: any;
import apiService from '../services/api';

// Import enhanced components
import { messenger } from '../services/messaging';
import { debugOverlay } from './debug-overlay';
import { formDetector } from './form-detector';
import { resilientFiller } from './resilient-filler';

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
  private authToken: string | null = null;
  private apiBaseUrl: string = 'http://localhost:3000/api';
  private analytics = {
    startTime: Date.now(),
    formFieldsFilled: 0,
    aiResponsesGenerated: 0,
    templatesUsed: 0,
  };
  private undoStack: Array<{
    element: HTMLInputElement | HTMLTextAreaElement;
    previousValue: string;
  }> = [];
  private currentRunChanges: Array<{ selector: string; from: string; to: string }> = [];

  constructor() {
    this.loadUserData();
    this.setupMessageListener();
    this.initializeApiConnection();
    this.initializeAuthToken();
    this.initializeEnhancedComponents();
  }

  private initializeEnhancedComponents(): void {
    console.log('🚀 Initializing Enhanced Form Filler Components');

    // Setup enhanced message handlers
    this.setupEnhancedMessageHandlers();

    // Setup debug overlay with keyboard shortcut
    this.setupDebugKeyboard();

    // Initialize resilient filler
    console.log('🔧 Framework detection:', resilientFiller.getFrameworkInfo());

    // Start automatic detection
    this.startAutoDetection();
  }

  private setupEnhancedMessageHandlers(): void {
    // Form detection requests
    messenger.onFormDetectionRequest(async () => {
      const forms = formDetector.getDetectedForms();
      const fields = formDetector.getDetectedFields();

      return {
        forms,
        fields,
        platform: forms[0]?.platform || 'Unknown',
        confidence: forms[0]?.confidence || 0,
      };
    });

    // Auto-fill requests with enhanced resilient filling
    messenger.onAutoFillRequest(async message => {
      if (!message.data?.fieldMappings) {
        throw new Error('No field mappings provided');
      }

      return await this.executeEnhancedAutoFill(message.data.fieldMappings);
    });

    // Debug toggle requests
    messenger.onDebugToggle(async message => {
      if (message.data?.enabled) {
        debugOverlay.show();
      } else {
        debugOverlay.hide();
      }

      return { success: true };
    });

    // Status requests
    messenger.onStatusRequest(async () => {
      const forms = formDetector.getDetectedForms();

      return {
        isActive: forms.length > 0,
        formsDetected: forms.length,
        currentPlatform: forms[0]?.platform || 'Unknown',
        lastScan: new Date().toISOString(),
      };
    });
  }

  private setupDebugKeyboard(): void {
    document.addEventListener('keydown', e => {
      // Ctrl+Shift+J to toggle debug overlay
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        debugOverlay.toggle();
      }
    });
  }

  private startAutoDetection(): void {
    // Run initial detection
    this.detectFormsEnhanced();

    // Setup periodic detection
    setInterval(() => {
      this.detectFormsEnhanced();
    }, 5000);

    // Detect on navigation changes
    let lastUrl = location.href;
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(() => this.detectFormsEnhanced(), 1000);
      }
    }, 1000);
  }

  private detectFormsEnhanced(): void {
    try {
      const forms = formDetector.scanForForms();

      if (forms.length > 0) {
        console.log(
          `✅ Enhanced detection: ${forms.length} job application form(s) on ${forms[0].platform}`
        );
      }
    } catch (error) {
      console.error('Enhanced form detection error:', error);
    }
  }

  private async executeEnhancedAutoFill(fieldMappings: Record<string, string>): Promise<any> {
    this.analytics.startTime = Date.now();
    this.currentRunChanges = [];
    this.undoStack = [];

    try {
      console.log('🚀 Starting enhanced auto-fill process with resilient filling');

      // Send initial status
      messenger.sendAutoFillStatus('started', 0, 0, Object.keys(fieldMappings).length);

      // Execute resilient filling
      const result = await resilientFiller.fillForm(fieldMappings, {
        humanLike: true,
        validateAfterFill: true,
        scrollIntoView: true,
        retryAttempts: 3,
      });

      // Track analytics
      this.analytics.formFieldsFilled = result.summary.successful;
      await this.trackFormFillAnalytics();

      // Send progress updates
      const { successful, total } = result.summary;
      const progress = total > 0 ? (successful / total) * 100 : 0;

      messenger.sendAutoFillStatus('completed', progress, successful, total);

      console.log(`✅ Enhanced auto-fill completed: ${successful}/${total} fields filled`);

      return {
        success: true,
        summary: result.summary,
        results: result.results.map(r => ({
          field: r.field.tagName,
          success: r.success,
          attempts: r.attempts,
          errors: r.errors,
        })),
      };
    } catch (error) {
      console.error('Enhanced auto-fill failed:', error);
      messenger.sendAutoFillStatus('error', 0, 0, 0);
      throw error;
    }
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
      chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
        switch (message.type) {
          case 'AUTO_FILL_FORMS': {
            // Handle popup-triggered auto-fill; respect settings for AI usage
            (async () => {
              try {
                const useAI = !!this.settings?.aiAssistanceEnabled;
                const jobDetails =
                  (window as any).enhancedFormDetector?.getJobDetails?.() ||
                  (window as any).jobBoardDetector?.getJobDetails?.() ||
                  null;
                await this.handleFillFormMessage({ useAI, jobDetails });
                sendResponse({ success: true });
              } catch (err: any) {
                sendResponse({ success: false, error: err?.message || 'Fill failed' });
              }
            })();
            return true; // async response
          }
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
          case 'UNDO_FILL':
            this.undoLastFill(sendResponse);
            return true;
        }
      });
    }
  }

  private async handleFillFormMessage(data: any): Promise<void> {
    this.analytics.startTime = Date.now();
    this.currentRunChanges = [];
    this.undoStack = [];

    if (data.useAI && data.jobDetails) {
      await this.fillFormWithAI(data.jobDetails);
    } else {
      await this.fillFormBasic();
    }

    // Track analytics
    await this.trackFormFillAnalytics();

    // Store last run snapshot for debugging / undo
    (window as any).__JOB_AUTOFILL_LAST_RUN__ = {
      at: new Date().toISOString(),
      url: window.location.href,
      changes: this.currentRunChanges,
    };
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
      // Get field mapping from enhanced detector
      const formDetector = (window as any).enhancedFormDetector;
      if (!formDetector) {
        console.warn('Enhanced form detector not available');
        return;
      }

      const fieldMapping = formDetector.getFieldMapping();
      await this.fillStandardFields(fieldMapping);

      this.analytics.formFieldsFilled = document.querySelectorAll(
        'input:not([value=""]), textarea:not(:empty), select option:checked'
      ).length;
      console.log('Basic form filling completed');
    } catch (error) {
      console.error('Form filling error:', error);
    }
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
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
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
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
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
        country: backendProfile.personalInfo?.address?.country || '',
      },
      experience: backendProfile.experience || [],
      education: backendProfile.education || [],
      skills: backendProfile.skills || [],
      certifications: backendProfile.certifications || [],
      preferences: backendProfile.preferences || {
        jobTypes: [],
        industries: [],
        locations: [],
        salaryRange: { min: 0, max: 0 },
        remote: false,
      },
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
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle: jobDetails.title,
          jobDescription: jobDetails.description,
          companyName: jobDetails.company,
        }),
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
      zipCode: personalInfo.zipCode,
    };

    for (const [fieldName, value] of Object.entries(standardFields)) {
      const field = fieldMapping.get(fieldName);
      if (field && value) {
        // skip file inputs defensively
        if ((field as HTMLInputElement).type === 'file') continue;
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

  private identifyCustomFields(
    fieldMapping: Map<string, HTMLInputElement>
  ): Array<{ element: HTMLElement; type: string; purpose: string }> {
    const customFields: Array<{ element: HTMLElement; type: string; purpose: string }> = [];

    // Look for text areas and large text inputs
    document.querySelectorAll('textarea, input[type="text"]').forEach(element => {
      const el = element as unknown as HTMLInputElement | HTMLTextAreaElement;

      // Skip if it's already mapped to a standard field
      const isStandardField = Array.from(fieldMapping.values()).includes(el as HTMLInputElement);
      if (isStandardField) return;

      const purpose = this.identifyFieldPurpose(el);
      if (purpose !== 'unknown') {
        customFields.push({
          element: el,
          type: el.tagName.toLowerCase(),
          purpose,
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
    if (
      text.includes('why') &&
      (text.includes('interested') || text.includes('want') || text.includes('apply'))
    ) {
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

  private async generateAIContent(
    field: any,
    jobDetails: any,
    analysis: any
  ): Promise<string | null> {
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
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldType: field.purpose,
          context: {
            jobDetails,
            analysis,
            fieldLabel: this.getFieldLabel(field.element),
          },
          options: {
            tone: this.settings.tone || 'professional',
            length: this.getDesiredLength(field.element),
          },
        }),
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
    const relevantTemplates = this.templates.filter(
      template =>
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
      '{strengthsToHighlight}':
        analysis?.advancedRecommendations?.strengthsToHighlight?.join(', ') || '',
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
      const desc = (exp.description || '').toLowerCase();
      return analysis.skillMatch.matchedSkills.some((skill: string) =>
        desc.includes(String(skill).toLowerCase())
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
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDetails,
          status: 'draft',
          tracking: {
            startedAt: new Date().toISOString(),
            source: window.location.hostname,
            referrer: document.referrer,
          },
        }),
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
    (element as HTMLElement).style.outline = '2px solid #4CAF50';
    (element as HTMLElement).style.outlineOffset = '1px';

    const prev = input.value || '';
    this.undoStack.push({ element: input, previousValue: prev });

    // Simulate typing for better UX
    if (this.settings.animateTyping) {
      await this.typeText(input, value);
    } else {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // record change
    const selector = this.getBestSelector(element);
    this.currentRunChanges.push({ selector, from: prev, to: value });

    // Reset background
    setTimeout(() => {
      element.style.backgroundColor = '';
      (element as HTMLElement).style.outline = '';
    }, 1000);
  }

  private getBestSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    const name = element.getAttribute('name');
    if (name) return `${element.tagName.toLowerCase()}[name="${name}"]`;
    // fallback path
    const parts: string[] = [];
    let el: HTMLElement | null = element;
    while (el && parts.length < 3) {
      const tag = el.tagName.toLowerCase();
      const idx = Array.from(el.parentElement?.children || []).indexOf(el) + 1;
      parts.unshift(`${tag}:nth-child(${idx})`);
      el = el.parentElement as HTMLElement | null;
    }
    return parts.length ? parts.join(' > ') : element.tagName.toLowerCase();
  }

  private undoLastFill(sendResponse: (resp: any) => void): void {
    try {
      // revert all changes from last run in reverse order
      for (let i = this.undoStack.length - 1; i >= 0; i--) {
        const { element, previousValue } = this.undoStack[i];
        element.value = previousValue;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      this.undoStack = [];
      this.currentRunChanges = [];
      (window as any).__JOB_AUTOFILL_LAST_RUN__ = null;
      sendResponse({ success: true });
    } catch (e: any) {
      sendResponse({ success: false, error: e?.message || 'Failed to undo' });
    }
  }

  private async typeText(
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string
  ): Promise<void> {
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

  // Minimal implementation to support popup analysis and data fetch
  private analyzeCurrentJobPosting(sendResponse: (resp: any) => void): void {
    try {
      const formDetector = (window as any).enhancedFormDetector;
      const jobDetails =
        formDetector?.getJobDetails?.() ||
        (window as any).jobBoardDetector?.getJobDetails?.() ||
        null;
      const fieldsCount = formDetector?.getFieldMapping?.()?.size || 0;
      sendResponse({ success: true, data: { jobDetails, fieldsCount } });
    } catch (e: any) {
      sendResponse({ success: false, error: e?.message || 'Failed to analyze job' });
    }
  }

  private getFormData(sendResponse: (resp: any) => void): void {
    try {
      const formDetector = (window as any).enhancedFormDetector;
      const mapping = formDetector?.getFieldMapping?.();
      const data: Record<string, string> = {};
      if (mapping) {
        mapping.forEach((el: HTMLInputElement, key: string) => {
          data[key] = el.value || '';
        });
      }
      sendResponse({ success: true, data });
    } catch (e: any) {
      sendResponse({ success: false, error: e?.message || 'Failed to get form data' });
    }
  }
}

// Initialize enhanced form filler
const enhancedFormFiller = new EnhancedFormFiller();

// Export for use by other scripts and maintain backward compatibility
(window as any).formFiller = enhancedFormFiller;
(window as any).enhancedFormFiller = enhancedFormFiller;
