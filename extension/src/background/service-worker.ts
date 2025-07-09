// Background service worker for Job AutoFill extension

// Declare chrome types for service worker
declare const chrome: any;

console.log('Job AutoFill service worker loaded');

// Storage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'userProfile',
  SETTINGS: 'settings',
  APPLICATIONS: 'applications'
};

// Initialize extension
chrome.runtime.onInstalled.addListener((details: any) => {
  console.log('Extension installed:', details);
  
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      [STORAGE_KEYS.SETTINGS]: {
        autoFillEnabled: true,
        aiAssistanceEnabled: true,
        showNotifications: true,
        autoSave: true
      }
    });
    
    // Open options page on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL('options/options.html')
    });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
  console.log('Message received:', message);
  
  switch (message.type) {
    case 'FORM_DETECTED':
      handleFormDetected(message.data, sender.tab);
      break;
    
    case 'FILL_FORM':
      handleFillForm(message.data, sender.tab);
      break;
    
    case 'SAVE_APPLICATION':
      handleSaveApplication(message.data);
      break;
    
    case 'GET_USER_PROFILE':
      getUserProfile(sendResponse);
      return true; // Keep message channel open for async response
    
    case 'UPDATE_USER_PROFILE':
      updateUserProfile(message.data, sendResponse);
      return true;
    
    default:
      console.warn('Unknown message type:', message.type);
  }
});

// Handle form detection
async function handleFormDetected(formData: any, tab?: any) {
  try {
    console.log('Form detected on tab:', tab?.url, formData);
    
    // Store form data for analysis
    const applications = await getStorageData(STORAGE_KEYS.APPLICATIONS) || [];
    applications.push({
      url: tab?.url,
      formData,
      detectedAt: new Date().toISOString()
    });
    
    await setStorageData(STORAGE_KEYS.APPLICATIONS, applications);
    
    // Show notification if enabled
    const settings = await getStorageData(STORAGE_KEYS.SETTINGS);
    if (settings?.showNotifications) {
      showNotification('Job application form detected!', 'Click to auto-fill');
    }
  } catch (error) {
    console.error('Error handling form detection:', error);
  }
}

// Handle form filling request
async function handleFillForm(formData: any, tab?: any) {
  try {
    console.log('Filling form on tab:', tab?.url);
    
    // Get user profile
    const userProfile = await getStorageData(STORAGE_KEYS.USER_PROFILE);
    if (!userProfile) {
      showNotification('Profile not found', 'Please set up your profile first');
      return;
    }
    
    // Send fill command to content script
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'FILL_FORM_DATA',
        data: {
          profile: userProfile,
          formData
        }
      });
    }
  } catch (error) {
    console.error('Error filling form:', error);
  }
}

// Handle application saving
async function handleSaveApplication(applicationData: any) {
  try {
    const applications = await getStorageData(STORAGE_KEYS.APPLICATIONS) || [];
    applications.push({
      ...applicationData,
      savedAt: new Date().toISOString(),
      id: generateId()
    });
    
    await setStorageData(STORAGE_KEYS.APPLICATIONS, applications);
    console.log('Application saved successfully');
  } catch (error) {
    console.error('Error saving application:', error);
  }
}

// Get user profile
async function getUserProfile(sendResponse: (response: any) => void) {
  try {
    const profile = await getStorageData(STORAGE_KEYS.USER_PROFILE);
    sendResponse({ success: true, data: profile });
  } catch (error) {
    console.error('Error getting user profile:', error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

// Update user profile
async function updateUserProfile(profileData: any, sendResponse: (response: any) => void) {
  try {
    await setStorageData(STORAGE_KEYS.USER_PROFILE, profileData);
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

// Utility functions
function getStorageData(key: string): Promise<any> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], (result: any) => {
      resolve(result[key]);
    });
  });
}

function setStorageData(key: string, data: any): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [key]: data }, () => {
      resolve();
    });
  });
}

function showNotification(title: string, message: string) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'assets/icons/icon48.png',
    title,
    message
  });
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Export for testing
export { STORAGE_KEYS };
