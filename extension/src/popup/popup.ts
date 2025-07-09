// Popup JavaScript functionality
import apiService from '../services/api.js';

console.log('Job AutoFill popup loaded');

// DOM elements
let statusIndicator: HTMLElement;
let analysisResult: HTMLElement;
let loadingAnalysis: HTMLElement;
let noForms: HTMLElement;
let formsDetected: HTMLElement;
let formCount: HTMLElement;
let autoFillBtn: HTMLButtonElement;
let scanPageBtn: HTMLElement;
let saveApplicationBtn: HTMLElement;
let autoFillToggle: HTMLInputElement;
let aiAssistToggle: HTMLInputElement;
let profileIncomplete: HTMLElement;
let profileComplete: HTMLElement;
let optionsBtn: HTMLElement;
let helpBtn: HTMLElement;
let loginSection: HTMLElement;
let authenticatedSection: HTMLElement;
let loginBtn: HTMLElement;
let logoutBtn: HTMLElement;
let analyticsBtn: HTMLElement;
let templatesBtn: HTMLElement;

// State management
let currentJobAnalysis: any = null;
let isAuthenticated = false;
let userProfile: any = null;

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeElements();
  checkAuthenticationStatus();
  loadSettings();
  analyzeCurrentPage();
  setupEventListeners();
});

function initializeElements() {
  statusIndicator = document.getElementById('status-indicator')!;
  analysisResult = document.getElementById('analysis-result')!;
  loadingAnalysis = document.getElementById('loading-analysis')!;
  noForms = document.getElementById('no-forms')!;
  formsDetected = document.getElementById('forms-detected')!;
  formCount = document.getElementById('form-count')!;
  autoFillBtn = document.getElementById('auto-fill-btn') as HTMLButtonElement;
  scanPageBtn = document.getElementById('scan-page-btn')!;
  saveApplicationBtn = document.getElementById('save-application-btn')!;
  autoFillToggle = document.getElementById('auto-fill-toggle') as HTMLInputElement;
  aiAssistToggle = document.getElementById('ai-assist-toggle') as HTMLInputElement;
  profileIncomplete = document.getElementById('profile-incomplete')!;
  profileComplete = document.getElementById('profile-complete')!;
  optionsBtn = document.getElementById('options-btn')!;
  helpBtn = document.getElementById('help-btn')!;
  
  // New authentication and feature elements
  loginSection = document.getElementById('login-section')!;
  authenticatedSection = document.getElementById('authenticated-section')!;
  loginBtn = document.getElementById('login-btn')!;
  logoutBtn = document.getElementById('logout-btn')!;
  analyticsBtn = document.getElementById('analytics-btn')!;
  templatesBtn = document.getElementById('templates-btn')!;
}

async function checkAuthenticationStatus() {
  try {
    isAuthenticated = apiService.isAuthenticated();
    
    if (isAuthenticated) {
      const profileResponse = await apiService.getProfile();
      if (profileResponse.success) {
        userProfile = profileResponse.data;
        showAuthenticatedUI();
      } else {
        showUnauthenticatedUI();
      }
    } else {
      showUnauthenticatedUI();
    }
  } catch (error) {
    console.error('Authentication check failed:', error);
    showUnauthenticatedUI();
  }
}

function showAuthenticatedUI() {
  if (loginSection) loginSection.style.display = 'none';
  if (authenticatedSection) authenticatedSection.style.display = 'block';
  updateProfileStatus();
  loadAnalyticsPreview();
}

function showUnauthenticatedUI() {
  if (loginSection) loginSection.style.display = 'block';
  if (authenticatedSection) authenticatedSection.style.display = 'none';
}

function updateProfileStatus() {
  if (userProfile && profileComplete && profileIncomplete) {
    const hasBasicInfo = userProfile.personalInfo?.firstName && 
                        userProfile.personalInfo?.lastName && 
                        userProfile.personalInfo?.email;
    const hasExperience = userProfile.experience?.length > 0;
    const hasSkills = userProfile.skills?.length > 0;
    
    if (hasBasicInfo && hasExperience && hasSkills) {
      profileComplete.style.display = 'block';
      profileIncomplete.style.display = 'none';
    } else {
      profileComplete.style.display = 'none';
      profileIncomplete.style.display = 'block';
    }
  }
}

async function loadAnalyticsPreview() {
  try {
    const analyticsResponse = await apiService.getApplicationAnalytics('7');
    if (analyticsResponse.success && analyticsResponse.data) {
      const analytics = analyticsResponse.data;
      updateAnalyticsDisplay(analytics);
    }
  } catch (error) {
    console.warn('Failed to load analytics preview:', error);
  }
}

function updateAnalyticsDisplay(analytics: any) {
  // Update analytics display in the popup
  const analyticsPreview = document.getElementById('analytics-preview');
  if (analyticsPreview) {
    analyticsPreview.innerHTML = `
      <div class="analytics-summary">
        <div class="metric">
          <span class="metric-value">${analytics.totalApplications || 0}</span>
          <span class="metric-label">Applications</span>
        </div>
        <div class="metric">
          <span class="metric-value">${Math.round(analytics.successRate || 0)}%</span>
          <span class="metric-label">Success Rate</span>
        </div>
        <div class="metric">
          <span class="metric-value">${Math.round(analytics.aiAccuracy || 0)}%</span>
          <span class="metric-label">AI Accuracy</span>
        </div>
      </div>
    `;
  }
}

function setupEventListeners() {
  // Auto-fill button
  autoFillBtn.addEventListener('click', handleAutoFill);
  
  // Scan page button
  scanPageBtn.addEventListener('click', handleScanPage);
  
  // Save application button
  saveApplicationBtn.addEventListener('click', handleSaveApplication);
  
  // Webcam capture button
  const webcamCaptureBtn = document.getElementById('webcam-capture-btn');
  webcamCaptureBtn?.addEventListener('click', handleWebcamCapture);
  
  // Settings toggles
  autoFillToggle.addEventListener('change', handleAutoFillToggle);
  aiAssistToggle.addEventListener('change', handleAiAssistToggle);
  
  // Setup profile button
  const setupProfileBtn = document.getElementById('setup-profile-btn');
  setupProfileBtn?.addEventListener('click', handleSetupProfile);
  
  // Options and help buttons
  optionsBtn.addEventListener('click', handleOpenOptions);
  helpBtn.addEventListener('click', handleOpenHelp);
}

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['settings', 'userProfile']);
    
    if (result.settings) {
      autoFillToggle.checked = result.settings.autoFillEnabled ?? true;
      aiAssistToggle.checked = result.settings.aiAssistanceEnabled ?? true;
    }
    
    // Check profile status
    if (result.userProfile && isProfileComplete(result.userProfile)) {
      profileIncomplete.style.display = 'none';
      profileComplete.style.display = 'block';
    } else {
      profileIncomplete.style.display = 'block';
      profileComplete.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

function isProfileComplete(profile: any): boolean {
  return profile && 
         profile.personalInfo?.firstName && 
         profile.personalInfo?.lastName && 
         profile.personalInfo?.email &&
         profile.experience?.length > 0;
}

async function analyzeCurrentPage() {
  try {
    showLoading();
    
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showError('Unable to access current tab');
      return;
    }
    
    // Send message to content script to analyze page
    const response = await chrome.tabs.sendMessage(tab.id, { 
      type: 'ANALYZE_PAGE' 
    });
    
    if (response && response.success) {
      displayAnalysisResult(response.data);
    } else {
      showNoForms();
    }
  } catch (error) {
    console.error('Error analyzing page:', error);
    showError('Error analyzing page');
  }
}

function showLoading() {
  loadingAnalysis.style.display = 'block';
  noForms.style.display = 'none';
  formsDetected.style.display = 'none';
  updateStatus('Analyzing...', 'warning');
}

function displayAnalysisResult(data: any) {
  loadingAnalysis.style.display = 'none';
  
  if (data.formsFound > 0) {
    formCount.textContent = data.formsFound.toString();
    formsDetected.style.display = 'block';
    noForms.style.display = 'none';
    updateStatus('Forms detected', 'success');
  } else {
    showNoForms();
  }
}

function showNoForms() {
  loadingAnalysis.style.display = 'none';
  formsDetected.style.display = 'none';
  noForms.style.display = 'block';
  updateStatus('No forms found', 'warning');
}

function showError(message: string) {
  loadingAnalysis.style.display = 'none';
  formsDetected.style.display = 'none';
  noForms.style.display = 'block';
  noForms.querySelector('p')!.textContent = message;
  updateStatus('Error', 'error');
}

function updateStatus(text: string, type: 'success' | 'warning' | 'error') {
  const statusText = statusIndicator.querySelector('.status-text')!;
  statusText.textContent = text;
  
  // Update status indicator class
  statusIndicator.className = 'status-indicator';
  statusIndicator.classList.add(`status-${type}`);
}

async function handleAutoFill() {
  try {
    updateStatus('Filling forms...', 'warning');
    autoFillBtn.textContent = 'Filling...';
    autoFillBtn.disabled = true;
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const response = await chrome.tabs.sendMessage(tab.id, { 
      type: 'AUTO_FILL_FORMS' 
    });
    
    if (response && response.success) {
      updateStatus('Forms filled', 'success');
      autoFillBtn.innerHTML = '<span class="icon">✅</span>Forms Filled';
    } else {
      throw new Error(response?.error || 'Failed to fill forms');
    }
  } catch (error) {
    console.error('Error auto-filling:', error);
    updateStatus('Fill failed', 'error');
    autoFillBtn.innerHTML = '<span class="icon">🤖</span>Auto Fill Forms';
  } finally {
    autoFillBtn.disabled = false;
    
    // Reset button after 3 seconds
    setTimeout(() => {
      autoFillBtn.innerHTML = '<span class="icon">🤖</span>Auto Fill Forms';
    }, 3000);
  }
}

async function handleScanPage() {
  await analyzeCurrentPage();
}

async function handleSaveApplication() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const response = await chrome.tabs.sendMessage(tab.id, { 
      type: 'SAVE_APPLICATION' 
    });
    
    if (response && response.success) {
      updateStatus('Application saved', 'success');
    } else {
      throw new Error('Failed to save application');
    }
  } catch (error) {
    console.error('Error saving application:', error);
    updateStatus('Save failed', 'error');
  }
}

async function handleAutoFillToggle() {
  try {
    const settings = await chrome.storage.sync.get('settings');
    const newSettings = {
      ...settings.settings,
      autoFillEnabled: autoFillToggle.checked
    };
    
    await chrome.storage.sync.set({ settings: newSettings });
    
    // Send message to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { 
      type: 'SETTINGS_UPDATED',
      data: newSettings
    });
  } catch (error) {
    console.error('Error updating auto-fill setting:', error);
  }
}

async function handleAiAssistToggle() {
  try {
    const settings = await chrome.storage.sync.get('settings');
    const newSettings = {
      ...settings.settings,
      aiAssistanceEnabled: aiAssistToggle.checked
    };
    
    await chrome.storage.sync.set({ settings: newSettings });
  } catch (error) {
    console.error('Error updating AI assist setting:', error);
  }
}

function handleSetupProfile() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('options/options.html')
  });
  window.close();
}

function handleOpenOptions() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('options/options.html')
  });
  window.close();
}

function handleOpenHelp() {
  chrome.tabs.create({
    url: 'https://github.com/your-username/job-autofill/wiki'
  });
  window.close();
}

function handleWebcamCapture() {
  // Open webcam capture in a new tab
  chrome.tabs.create({
    url: chrome.runtime.getURL('webcam/webcam-capture.html')
  });
  window.close();
}
