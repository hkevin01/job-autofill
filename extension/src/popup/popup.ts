// Popup JavaScript functionality

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

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeElements();
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
}

function setupEventListeners() {
  // Auto-fill button
  autoFillBtn.addEventListener('click', handleAutoFill);
  
  // Scan page button
  scanPageBtn.addEventListener('click', handleScanPage);
  
  // Save application button
  saveApplicationBtn.addEventListener('click', handleSaveApplication);
  
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
