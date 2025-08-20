/**
 * Job AutoFill - Enhanced 3-Step Popup Flow
 * Complete user interface for form detection, field mapping, and auto-fill confirmation
 */

// Declare chrome for extension context
declare const chrome: any;

console.log('Job AutoFill Enhanced Popup loaded');

import { messenger } from '../services/messaging';

// =====================================================
// Interfaces and Types
// =====================================================

interface DetectedField {
  element: HTMLElement;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea';
  label: string;
  confidence: number;
  category: 'personal' | 'contact' | 'experience' | 'skills' | 'other';
  required: boolean;
  value?: string;
}

interface FormData {
  platform: string;
  forms: HTMLFormElement[];
  fields: DetectedField[];
  totalConfidence: number;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  linkedIn: string;
  portfolio: string;
  currentRole: string;
  yearsExperience: string;
  skills: string;
  coverLetter: string;
  resumeText: string;
}

// =====================================================
// Enhanced Popup Manager
// =====================================================

class EnhancedPopupManager {
  private currentStep: 1 | 2 | 3 = 1;
  private formData: FormData | null = null;
  private userProfile: UserProfile | null = null;
  private fieldMappings: Record<string, string> = {};
  private autoFillInProgress = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      // Load user profile from storage
      await this.loadUserProfile();

      // Setup event listeners
      this.setupEventListeners();

      // Initialize UI
      this.initializeUI();

      // Start with step 1 - detection
      await this.executeStep1();
    } catch (error) {
      console.error('Failed to initialize enhanced popup:', error);
      this.showError('Failed to initialize Job AutoFill. Please refresh the page and try again.');
    }
  }

  // =====================================================
  // Step 1: Form Detection and Platform Recognition
  // =====================================================

  private async executeStep1(): Promise<void> {
    this.showStep(1);
    this.updateStepIndicator(1);

    const statusElement = document.getElementById('detection-status')!;
    const progressElement = document.getElementById('detection-progress')!;
    const detailsElement = document.getElementById('detection-details')!;

    try {
      statusElement.textContent = 'Scanning page for job application forms...';
      progressElement.style.width = '25%';

      // Request form detection from content script
      const response = await messenger.requestFormDetection();

      progressElement.style.width = '50%';
      statusElement.textContent = 'Analyzing form structure...';

      if (response.error) {
        throw new Error(response.error);
      }

      this.formData = response.data;

      if (!this.formData) {
        throw new Error('No form data received');
      }

      progressElement.style.width = '75%';
      statusElement.textContent = 'Categorizing form fields...';

      // Display detection results
      this.displayDetectionResults();

      progressElement.style.width = '100%';
      statusElement.textContent = `Detection complete! Found ${this.formData.fields.length} fields on ${this.formData.platform}`;

      // Enable next step
      const nextButton = document.getElementById('step1-next') as HTMLButtonElement;
      nextButton.disabled = false;
      nextButton.classList.add('enabled');
    } catch (error) {
      console.error('Form detection failed:', error);
      statusElement.textContent = 'No job application forms detected on this page.';
      detailsElement.innerHTML = `
        <div class="error-message">
          <p>This page doesn't appear to contain a job application form, or the form structure is not supported.</p>
          <p>Try navigating to a job posting page and clicking "Apply" to access the application form.</p>
        </div>
      `;
    }
  }

  private displayDetectionResults(): void {
    if (!this.formData) return;

    const detailsElement = document.getElementById('detection-details')!;
    const fieldsHtml = this.formData.fields
      .map(
        field => `
      <div class="field-item" data-confidence="${field.confidence}">
        <div class="field-info">
          <span class="field-label">${field.label}</span>
          <span class="field-type">${field.type}</span>
          ${field.required ? '<span class="required">*</span>' : ''}
        </div>
        <div class="field-confidence">
          <div class="confidence-bar">
            <div class="confidence-fill" style="width: ${field.confidence * 100}%"></div>
          </div>
          <span class="confidence-text">${Math.round(field.confidence * 100)}%</span>
        </div>
      </div>
    `
      )
      .join('');

    detailsElement.innerHTML = `
      <div class="detection-summary">
        <h3>🎯 Platform: ${this.formData.platform}</h3>
        <p>Found ${this.formData.fields.length} form fields with ${Math.round(
      this.formData.totalConfidence * 100
    )}% overall confidence</p>
      </div>
      <div class="fields-list">
        ${fieldsHtml}
      </div>
      <div class="detection-actions">
        <button id="rescan-button" class="secondary-button">🔄 Rescan Page</button>
        <button id="manual-mode" class="secondary-button">⚙️ Manual Mode</button>
      </div>
    `;

    // Setup detection action buttons
    document.getElementById('rescan-button')?.addEventListener('click', () => this.executeStep1());
    document
      .getElementById('manual-mode')
      ?.addEventListener('click', () => this.enableManualMode());
  }

  // =====================================================
  // Step 2: Field Mapping and Profile Review
  // =====================================================

  private async executeStep2(): Promise<void> {
    this.showStep(2);
    this.updateStepIndicator(2);

    if (!this.formData || !this.userProfile) {
      this.showError('Missing form data or user profile. Please go back and try again.');
      return;
    }

    const mappingElement = document.getElementById('field-mapping')!;
    const previewElement = document.getElementById('mapping-preview')!;

    // Generate initial field mappings
    this.generateFieldMappings();

    // Display field mapping interface
    this.displayFieldMappingInterface();

    // Show mapping preview
    this.updateMappingPreview();
  }

  private generateFieldMappings(): void {
    if (!this.formData || !this.userProfile) return;

    // Smart field mapping based on labels and types
    this.fieldMappings = {};

    for (const field of this.formData.fields) {
      const label = field.label.toLowerCase();

      // Map common field patterns
      if (label.includes('first') && label.includes('name')) {
        this.fieldMappings[field.label] = this.userProfile.firstName;
      } else if (label.includes('last') && label.includes('name')) {
        this.fieldMappings[field.label] = this.userProfile.lastName;
      } else if (label.includes('email')) {
        this.fieldMappings[field.label] = this.userProfile.email;
      } else if (label.includes('phone')) {
        this.fieldMappings[field.label] = this.userProfile.phone;
      } else if (label.includes('address')) {
        this.fieldMappings[field.label] = this.userProfile.address;
      } else if (label.includes('city')) {
        this.fieldMappings[field.label] = this.userProfile.city;
      } else if (label.includes('state')) {
        this.fieldMappings[field.label] = this.userProfile.state;
      } else if (label.includes('zip')) {
        this.fieldMappings[field.label] = this.userProfile.zipCode;
      } else if (label.includes('linkedin')) {
        this.fieldMappings[field.label] = this.userProfile.linkedIn;
      } else if (label.includes('portfolio') || label.includes('website')) {
        this.fieldMappings[field.label] = this.userProfile.portfolio;
      } else if (label.includes('experience') && label.includes('year')) {
        this.fieldMappings[field.label] = this.userProfile.yearsExperience;
      } else if (label.includes('cover') && label.includes('letter')) {
        this.fieldMappings[field.label] = this.userProfile.coverLetter;
      } else if (label.includes('resume')) {
        this.fieldMappings[field.label] = this.userProfile.resumeText;
      } else if (label.includes('skill')) {
        this.fieldMappings[field.label] = this.userProfile.skills;
      }
    }
  }

  private displayFieldMappingInterface(): void {
    if (!this.formData) return;

    const mappingElement = document.getElementById('field-mapping')!;

    const mappingHtml = this.formData.fields
      .map(field => {
        const currentValue = this.fieldMappings[field.label] || '';

        return `
        <div class="mapping-row">
          <div class="field-info">
            <label class="field-label">${field.label}</label>
            <span class="field-meta">${field.type} • ${field.category} ${
          field.required ? '• Required' : ''
        }</span>
          </div>
          <div class="mapping-input">
            <select class="profile-selector" data-field="${field.label}">
              <option value="">-- Select Value --</option>
              <option value="${this.userProfile!.firstName}" ${
          currentValue === this.userProfile!.firstName ? 'selected' : ''
        }>First Name</option>
              <option value="${this.userProfile!.lastName}" ${
          currentValue === this.userProfile!.lastName ? 'selected' : ''
        }>Last Name</option>
              <option value="${this.userProfile!.email}" ${
          currentValue === this.userProfile!.email ? 'selected' : ''
        }>Email</option>
              <option value="${this.userProfile!.phone}" ${
          currentValue === this.userProfile!.phone ? 'selected' : ''
        }>Phone</option>
              <option value="${this.userProfile!.address}" ${
          currentValue === this.userProfile!.address ? 'selected' : ''
        }>Address</option>
              <option value="${this.userProfile!.city}" ${
          currentValue === this.userProfile!.city ? 'selected' : ''
        }>City</option>
              <option value="${this.userProfile!.state}" ${
          currentValue === this.userProfile!.state ? 'selected' : ''
        }>State</option>
              <option value="${this.userProfile!.zipCode}" ${
          currentValue === this.userProfile!.zipCode ? 'selected' : ''
        }>ZIP Code</option>
              <option value="${this.userProfile!.linkedIn}" ${
          currentValue === this.userProfile!.linkedIn ? 'selected' : ''
        }>LinkedIn</option>
              <option value="${this.userProfile!.portfolio}" ${
          currentValue === this.userProfile!.portfolio ? 'selected' : ''
        }>Portfolio</option>
              <option value="${this.userProfile!.currentRole}" ${
          currentValue === this.userProfile!.currentRole ? 'selected' : ''
        }>Current Role</option>
              <option value="${this.userProfile!.yearsExperience}" ${
          currentValue === this.userProfile!.yearsExperience ? 'selected' : ''
        }>Years Experience</option>
              <option value="${this.userProfile!.skills}" ${
          currentValue === this.userProfile!.skills ? 'selected' : ''
        }>Skills</option>
              <option value="custom">✏️ Custom Value</option>
            </select>
            <input type="text" class="custom-input" data-field="${field.label}"
                   value="${currentValue}" placeholder="Enter custom value..."
                   style="display: ${
                     currentValue && !Object.values(this.userProfile!).includes(currentValue)
                       ? 'block'
                       : 'none'
                   }">
          </div>
        </div>
      `;
      })
      .join('');

    mappingElement.innerHTML = `
      <div class="mapping-header">
        <h3>📝 Field Mapping</h3>
        <p>Review and adjust how your profile data maps to form fields</p>
      </div>
      <div class="mapping-list">
        ${mappingHtml}
      </div>
      <div class="mapping-actions">
        <button id="auto-map" class="secondary-button">🤖 Auto-Map</button>
        <button id="clear-mapping" class="secondary-button">🗑️ Clear All</button>
        <button id="edit-profile" class="secondary-button">👤 Edit Profile</button>
      </div>
    `;

    // Setup mapping event listeners
    this.setupMappingEventListeners();
  }

  private setupMappingEventListeners(): void {
    // Profile selector changes
    document.querySelectorAll('.profile-selector').forEach(select => {
      select.addEventListener('change', e => {
        const target = e.target as HTMLSelectElement;
        const fieldLabel = target.dataset.field!;
        const customInput = document.querySelector(
          `input[data-field="${fieldLabel}"]`
        ) as HTMLInputElement;

        if (target.value === 'custom') {
          customInput.style.display = 'block';
          customInput.focus();
          this.fieldMappings[fieldLabel] = customInput.value;
        } else {
          customInput.style.display = 'none';
          this.fieldMappings[fieldLabel] = target.value;
        }

        this.updateMappingPreview();
      });
    });

    // Custom input changes
    document.querySelectorAll('.custom-input').forEach(input => {
      input.addEventListener('input', e => {
        const target = e.target as HTMLInputElement;
        const fieldLabel = target.dataset.field!;
        this.fieldMappings[fieldLabel] = target.value;
        this.updateMappingPreview();
      });
    });

    // Action buttons
    document.getElementById('auto-map')?.addEventListener('click', () => {
      this.generateFieldMappings();
      this.displayFieldMappingInterface();
      this.updateMappingPreview();
    });

    document.getElementById('clear-mapping')?.addEventListener('click', () => {
      this.fieldMappings = {};
      this.displayFieldMappingInterface();
      this.updateMappingPreview();
    });

    document.getElementById('edit-profile')?.addEventListener('click', () => {
      this.openProfileEditor();
    });
  }

  private updateMappingPreview(): void {
    const previewElement = document.getElementById('mapping-preview')!;
    const mappedFields = Object.keys(this.fieldMappings).filter(key => this.fieldMappings[key]);
    const totalFields = this.formData?.fields.length || 0;

    previewElement.innerHTML = `
      <div class="preview-header">
        <h4>📋 Fill Preview</h4>
        <span class="progress-indicator">${mappedFields.length}/${totalFields} fields mapped</span>
      </div>
      <div class="preview-stats">
        <div class="stat">
          <span class="stat-number">${mappedFields.length}</span>
          <span class="stat-label">Fields Ready</span>
        </div>
        <div class="stat">
          <span class="stat-number">${totalFields - mappedFields.length}</span>
          <span class="stat-label">Unmapped</span>
        </div>
        <div class="stat">
          <span class="stat-number">${Math.round((mappedFields.length / totalFields) * 100)}%</span>
          <span class="stat-label">Complete</span>
        </div>
      </div>
    `;

    // Enable/disable next button
    const nextButton = document.getElementById('step2-next') as HTMLButtonElement;
    if (mappedFields.length > 0) {
      nextButton.disabled = false;
      nextButton.classList.add('enabled');
    } else {
      nextButton.disabled = true;
      nextButton.classList.remove('enabled');
    }
  }

  // =====================================================
  // Step 3: Auto-Fill Confirmation and Execution
  // =====================================================

  private async executeStep3(): Promise<void> {
    this.showStep(3);
    this.updateStepIndicator(3);

    const summaryElement = document.getElementById('fill-summary')!;
    const progressElement = document.getElementById('fill-progress')!;

    // Display fill summary
    this.displayFillSummary();

    // Setup auto-fill execution
    const executeButton = document.getElementById('execute-fill') as HTMLButtonElement;
    executeButton.addEventListener('click', () => this.executeAutoFill());
  }

  private displayFillSummary(): void {
    const summaryElement = document.getElementById('fill-summary')!;
    const mappedFields = Object.keys(this.fieldMappings).filter(key => this.fieldMappings[key]);

    const fieldsHtml = mappedFields
      .map(fieldLabel => {
        const value = this.fieldMappings[fieldLabel];
        const truncatedValue = value.length > 50 ? value.substring(0, 50) + '...' : value;

        return `
        <div class="summary-field">
          <span class="field-name">${fieldLabel}</span>
          <span class="field-value">${truncatedValue}</span>
        </div>
      `;
      })
      .join('');

    summaryElement.innerHTML = `
      <div class="summary-header">
        <h3>🚀 Ready to Fill</h3>
        <p>Review the data that will be filled into the form</p>
      </div>
      <div class="summary-stats">
        <div class="stat-card">
          <span class="stat-number">${mappedFields.length}</span>
          <span class="stat-label">Fields to Fill</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">${this.formData?.platform || 'Unknown'}</span>
          <span class="stat-label">Platform</span>
        </div>
      </div>
      <div class="summary-fields">
        ${fieldsHtml}
      </div>
      <div class="fill-options">
        <label class="checkbox-option">
          <input type="checkbox" id="highlight-fields" checked>
          <span>Highlight filled fields</span>
        </label>
        <label class="checkbox-option">
          <input type="checkbox" id="slow-fill">
          <span>Fill slowly (more human-like)</span>
        </label>
        <label class="checkbox-option">
          <input type="checkbox" id="confirm-each">
          <span>Confirm each field before filling</span>
        </label>
      </div>
    `;
  }

  private async executeAutoFill(): Promise<void> {
    if (this.autoFillInProgress) return;

    this.autoFillInProgress = true;
    const executeButton = document.getElementById('execute-fill') as HTMLButtonElement;
    const progressElement = document.getElementById('fill-progress')!;

    executeButton.disabled = true;
    executeButton.textContent = 'Filling Form...';

    try {
      progressElement.innerHTML = `
        <div class="progress-header">
          <h4>🔄 Auto-Fill in Progress</h4>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" id="progress-fill"></div>
        </div>
        <div class="progress-status" id="progress-status">Starting auto-fill...</div>
      `;

      // Execute auto-fill with progress updates
      await this.performAutoFillWithProgress();

      // Show completion message
      progressElement.innerHTML = `
        <div class="success-message">
          <h4>✅ Auto-Fill Complete!</h4>
          <p>Successfully filled ${Object.keys(this.fieldMappings).length} form fields.</p>
          <div class="completion-actions">
            <button id="review-form" class="primary-button">📝 Review Form</button>
            <button id="submit-form" class="secondary-button">🚀 Submit Application</button>
          </div>
        </div>
      `;

      // Setup completion actions
      document.getElementById('review-form')?.addEventListener('click', () => {
        window.close();
      });

      document.getElementById('submit-form')?.addEventListener('click', () => {
        this.showSubmissionWarning();
      });
    } catch (error) {
      console.error('Auto-fill failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      progressElement.innerHTML = `
        <div class="error-message">
          <h4>❌ Auto-Fill Failed</h4>
          <p>An error occurred while filling the form: ${errorMessage}</p>
          <button id="retry-fill" class="primary-button">🔄 Retry</button>
        </div>
      `;

      document.getElementById('retry-fill')?.addEventListener('click', () => {
        this.executeAutoFill();
      });
    } finally {
      this.autoFillInProgress = false;
    }
  }

  private async performAutoFillWithProgress(): Promise<void> {
    const mappedFields = Object.keys(this.fieldMappings).filter(key => this.fieldMappings[key]);
    const totalFields = mappedFields.length;

    const progressFill = document.getElementById('progress-fill')!;
    const progressStatus = document.getElementById('progress-status')!;

    // Send auto-fill request to content script
    const response = await messenger.requestAutoFill(this.fieldMappings);

    if (response.error) {
      throw new Error(response.error);
    }

    // Simulate progress updates (in a real implementation, these would come from the content script)
    for (let i = 0; i <= totalFields; i++) {
      const progress = (i / totalFields) * 100;
      progressFill.style.width = `${progress}%`;
      progressStatus.textContent =
        i === totalFields
          ? `Completed filling ${totalFields} fields`
          : `Filling field ${i + 1} of ${totalFields}...`;

      await this.delay(200); // Simulate progressive filling
    }
  }

  // =====================================================
  // UI Management
  // =====================================================

  private showStep(step: 1 | 2 | 3): void {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(el => {
      el.classList.remove('active');
    });

    // Show current step
    document.getElementById(`step-${step}`)?.classList.add('active');
    this.currentStep = step;
  }

  private updateStepIndicator(currentStep: number): void {
    document.querySelectorAll('.step-indicator .step').forEach((step, index) => {
      const stepNumber = index + 1;
      step.classList.toggle('active', stepNumber === currentStep);
      step.classList.toggle('completed', stepNumber < currentStep);
    });
  }

  private setupEventListeners(): void {
    // Step navigation buttons
    document.getElementById('step1-next')?.addEventListener('click', () => this.executeStep2());
    document.getElementById('step2-back')?.addEventListener('click', () => this.executeStep1());
    document.getElementById('step2-next')?.addEventListener('click', () => this.executeStep3());
    document.getElementById('step3-back')?.addEventListener('click', () => this.executeStep2());

    // Header actions
    document
      .getElementById('settings-button')
      ?.addEventListener('click', () => this.openSettings());
    document.getElementById('help-button')?.addEventListener('click', () => this.openHelp());
  }

  private initializeUI(): void {
    document.body.innerHTML = `
      <div class="popup-container">
        <header class="popup-header">
          <div class="logo">
            <img src="../assets/icons/icon32.png" alt="Job AutoFill" />
            <span>Job AutoFill</span>
          </div>
          <div class="header-actions">
            <button id="settings-button" class="icon-button" title="Settings">⚙️</button>
            <button id="help-button" class="icon-button" title="Help">❓</button>
          </div>
        </header>

        <div class="step-indicator">
          <div class="step active">
            <span class="step-number">1</span>
            <span class="step-label">Detect</span>
          </div>
          <div class="step">
            <span class="step-number">2</span>
            <span class="step-label">Map</span>
          </div>
          <div class="step">
            <span class="step-number">3</span>
            <span class="step-label">Fill</span>
          </div>
        </div>

        <main class="popup-main">
          <!-- Step 1: Form Detection -->
          <div id="step-1" class="step-content active">
            <div class="step-header">
              <h2>🔍 Form Detection</h2>
              <p>Scanning the page for job application forms...</p>
            </div>
            <div class="detection-status">
              <div id="detection-status" class="status-text">Initializing...</div>
              <div class="progress-bar">
                <div id="detection-progress" class="progress-fill"></div>
              </div>
            </div>
            <div id="detection-details" class="detection-details"></div>
            <div class="step-actions">
              <button id="step1-next" class="primary-button" disabled>Next: Map Fields →</button>
            </div>
          </div>

          <!-- Step 2: Field Mapping -->
          <div id="step-2" class="step-content">
            <div class="step-header">
              <h2>🎯 Field Mapping</h2>
              <p>Map your profile data to form fields</p>
            </div>
            <div id="field-mapping" class="field-mapping"></div>
            <div id="mapping-preview" class="mapping-preview"></div>
            <div class="step-actions">
              <button id="step2-back" class="secondary-button">← Back</button>
              <button id="step2-next" class="primary-button" disabled>Next: Fill Form →</button>
            </div>
          </div>

          <!-- Step 3: Auto-Fill Execution -->
          <div id="step-3" class="step-content">
            <div class="step-header">
              <h2>🚀 Auto-Fill</h2>
              <p>Review and execute the form filling</p>
            </div>
            <div id="fill-summary" class="fill-summary"></div>
            <div id="fill-progress" class="fill-progress"></div>
            <div class="step-actions">
              <button id="step3-back" class="secondary-button">← Back</button>
              <button id="execute-fill" class="primary-button">🚀 Start Auto-Fill</button>
            </div>
          </div>
        </main>
      </div>
    `;
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  private async loadUserProfile(): Promise<void> {
    // Mock user profile - in real implementation, load from storage
    this.userProfile = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@email.com',
      phone: '(555) 123-4567',
      address: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      linkedIn: 'https://linkedin.com/in/johndoe',
      portfolio: 'https://johndoe.dev',
      currentRole: 'Senior Software Engineer',
      yearsExperience: '5',
      skills: 'JavaScript, TypeScript, React, Node.js, Python',
      coverLetter: 'I am excited to apply for this position...',
      resumeText: 'Professional summary and experience details...',
    };
  }

  private enableManualMode(): void {
    // Implementation for manual field selection mode
    console.log('Manual mode enabled');
  }

  private openProfileEditor(): void {
    // Implementation for profile editing
    console.log('Opening profile editor');
  }

  private openSettings(): void {
    // Implementation for settings
    console.log('Opening settings');
  }

  private openHelp(): void {
    // Implementation for help/documentation
    console.log('Opening help');
  }

  private showSubmissionWarning(): void {
    // Implementation for submission warning
    alert('Please review the form carefully before submitting your application.');
  }

  private showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =====================================================
// Initialize Enhanced Popup
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  new EnhancedPopupManager();
});

export { EnhancedPopupManager };
