// Options page functionality

console.log('Job AutoFill options page loaded');

// DOM elements
let navButtons: NodeListOf<HTMLButtonElement>;
let tabContents: NodeListOf<HTMLElement>;
let saveBtn: HTMLButtonElement;
let resetBtn: HTMLButtonElement;
let saveStatus: HTMLElement;

// Current editing item (for modals)
let currentEditingIndex = -1;
let currentEditingType = '';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeElements();
  loadUserData();
  setupEventListeners();
});

function initializeElements() {
  navButtons = document.querySelectorAll('.nav-btn');
  tabContents = document.querySelectorAll('.tab-content');
  saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
  resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
  saveStatus = document.getElementById('save-status')!;
}

function setupEventListeners() {
  // Navigation tabs
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab!));
  });

  // Save and reset buttons
  saveBtn.addEventListener('click', saveAllData);
  resetBtn.addEventListener('click', resetAllData);

  // Profile form auto-save
  const profileInputs = document.querySelectorAll('#profile-tab input');
  profileInputs.forEach(input => {
    input.addEventListener('change', autoSave);
  });

  // Settings toggles
  const settingsInputs = document.querySelectorAll('#settings-tab input[type="checkbox"]');
  settingsInputs.forEach(input => {
    input.addEventListener('change', autoSave);
  });

  // Experience and education buttons
  document.getElementById('add-experience')?.addEventListener('click', () => openModal('experience'));
  document.getElementById('add-education')?.addEventListener('click', () => openModal('education'));

  // Modal event listeners
  setupModalListeners();

  // Data management buttons
  document.getElementById('export-data')?.addEventListener('click', exportData);
  document.getElementById('import-data')?.addEventListener('click', () => {
    document.getElementById('import-file')?.click();
  });
  document.getElementById('import-file')?.addEventListener('change', importData);
  document.getElementById('clear-data')?.addEventListener('click', clearAllData);
}

function setupModalListeners() {
  // Experience modal
  const expModal = document.getElementById('experience-modal')!;
  const expClose = expModal.querySelector('.modal-close')!;
  const expCancel = document.getElementById('modal-cancel')!;
  const expSave = document.getElementById('modal-save')!;

  expClose.addEventListener('click', () => closeModal('experience'));
  expCancel.addEventListener('click', () => closeModal('experience'));
  expSave.addEventListener('click', saveExperience);

  // Education modal
  const eduModal = document.getElementById('education-modal')!;
  const eduClose = eduModal.querySelector('.modal-close')!;
  const eduCancel = document.getElementById('modal-cancel-edu')!;
  const eduSave = document.getElementById('modal-save-edu')!;

  eduClose.addEventListener('click', () => closeModal('education'));
  eduCancel.addEventListener('click', () => closeModal('education'));
  eduSave.addEventListener('click', saveEducation);

  // Current position checkbox
  const currentCheckbox = document.getElementById('exp-current') as HTMLInputElement;
  currentCheckbox.addEventListener('change', (e) => {
    const endDateInput = document.getElementById('exp-end') as HTMLInputElement;
    endDateInput.disabled = (e.target as HTMLInputElement).checked;
    if ((e.target as HTMLInputElement).checked) {
      endDateInput.value = '';
    }
  });
}

function switchTab(tabName: string) {
  // Update navigation
  navButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update content
  tabContents.forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
  });
}

async function loadUserData() {
  try {
    const result = await chrome.storage.sync.get(['userProfile', 'settings']);
    
    // Load profile data
    if (result.userProfile) {
      loadProfileData(result.userProfile);
      loadExperienceData(result.userProfile.experience || []);
      loadEducationData(result.userProfile.education || []);
    }

    // Load settings
    if (result.settings) {
      loadSettingsData(result.settings);
    }
    
    showStatus('Data loaded successfully', 'success');
  } catch (error) {
    console.error('Error loading user data:', error);
    showStatus('Error loading data', 'error');
  }
}

function loadProfileData(profile: any) {
  const personalInfo = profile.personalInfo || {};
  
  Object.keys(personalInfo).forEach(key => {
    const input = document.getElementById(key) as HTMLInputElement;
    if (input) {
      input.value = personalInfo[key] || '';
    }
  });
}

function loadExperienceData(experience: any[]) {
  const container = document.getElementById('experience-list')!;
  container.innerHTML = '';

  experience.forEach((exp, index) => {
    const expElement = createExperienceElement(exp, index);
    container.appendChild(expElement);
  });
}

function loadEducationData(education: any[]) {
  const container = document.getElementById('education-list')!;
  container.innerHTML = '';

  education.forEach((edu, index) => {
    const eduElement = createEducationElement(edu, index);
    container.appendChild(eduElement);
  });
}

function loadSettingsData(settings: any) {
  Object.keys(settings).forEach(key => {
    const input = document.getElementById(key) as HTMLInputElement;
    if (input && input.type === 'checkbox') {
      input.checked = settings[key] || false;
    }
  });
}

function createExperienceElement(exp: any, index: number): HTMLElement {
  const div = document.createElement('div');
  div.className = 'experience-item';
  
  const skills = exp.skills ? exp.skills.map((skill: string) => 
    `<span class="skill-tag">${skill}</span>`
  ).join('') : '';

  div.innerHTML = `
    <div class="item-header">
      <div>
        <div class="item-title">${exp.position}</div>
        <div class="item-subtitle">${exp.company}</div>
        <div class="item-date">${exp.startDate} - ${exp.endDate || 'Present'}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-secondary btn-small" onclick="editExperience(${index})">Edit</button>
        <button class="btn btn-danger btn-small" onclick="deleteExperience(${index})">Delete</button>
      </div>
    </div>
    ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
    ${skills ? `<div class="item-skills">${skills}</div>` : ''}
  `;

  return div;
}

function createEducationElement(edu: any, index: number): HTMLElement {
  const div = document.createElement('div');
  div.className = 'education-item';
  
  div.innerHTML = `
    <div class="item-header">
      <div>
        <div class="item-title">${edu.degree}${edu.field ? ` in ${edu.field}` : ''}</div>
        <div class="item-subtitle">${edu.institution}</div>
        <div class="item-date">${edu.graduationDate || 'Date not specified'}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-secondary btn-small" onclick="editEducation(${index})">Edit</button>
        <button class="btn btn-danger btn-small" onclick="deleteEducation(${index})">Delete</button>
      </div>
    </div>
  `;

  return div;
}

async function autoSave() {
  showStatus('Saving...', 'saving');
  
  try {
    await saveAllData();
    showStatus('All changes saved', 'success');
  } catch (error) {
    console.error('Auto-save error:', error);
    showStatus('Error saving changes', 'error');
  }
}

async function saveAllData() {
  try {
    const profileData = collectProfileData();
    const settingsData = collectSettingsData();
    
    await chrome.storage.sync.set({
      userProfile: profileData,
      settings: settingsData
    });
    
    showStatus('All changes saved', 'success');
  } catch (error) {
    console.error('Error saving data:', error);
    showStatus('Error saving changes', 'error');
  }
}

function collectProfileData(): any {
  const personalInfo: any = {};
  const profileInputs = document.querySelectorAll('#profile-tab input');
  
  profileInputs.forEach(input => {
    const inputEl = input as HTMLInputElement;
    personalInfo[inputEl.name] = inputEl.value;
  });

  // Get experience and education from current data
  const experienceData = Array.from(document.querySelectorAll('.experience-item')).map((item, index) => {
    // This would need to be stored in data attributes or a separate structure
    // For now, we'll maintain this in memory
    return getCurrentExperience()[index] || {};
  });

  const educationData = Array.from(document.querySelectorAll('.education-item')).map((item, index) => {
    return getCurrentEducation()[index] || {};
  });

  return {
    personalInfo,
    experience: experienceData,
    education: educationData,
    skills: [] // This could be derived from experience
  };
}

function collectSettingsData(): any {
  const settings: any = {};
  const settingsInputs = document.querySelectorAll('#settings-tab input[type="checkbox"]');
  
  settingsInputs.forEach(input => {
    const inputEl = input as HTMLInputElement;
    settings[inputEl.id] = inputEl.checked;
  });

  return settings;
}

// Global functions for inline event handlers
(window as any).editExperience = (index: number) => {
  currentEditingIndex = index;
  currentEditingType = 'experience';
  openModal('experience', getCurrentExperience()[index]);
};

(window as any).deleteExperience = async (index: number) => {
  if (confirm('Are you sure you want to delete this experience?')) {
    const current = getCurrentExperience();
    current.splice(index, 1);
    loadExperienceData(current);
    await autoSave();
  }
};

(window as any).editEducation = (index: number) => {
  currentEditingIndex = index;
  currentEditingType = 'education';
  openModal('education', getCurrentEducation()[index]);
};

(window as any).deleteEducation = async (index: number) => {
  if (confirm('Are you sure you want to delete this education entry?')) {
    const current = getCurrentEducation();
    current.splice(index, 1);
    loadEducationData(current);
    await autoSave();
  }
};

// Helper functions to get current data (simplified for Phase 1)
let experienceStore: any[] = [];
let educationStore: any[] = [];

function getCurrentExperience() {
  return experienceStore;
}

function getCurrentEducation() {
  return educationStore;
}

function openModal(type: string, data?: any) {
  const modal = document.getElementById(`${type}-modal`)!;
  modal.classList.add('active');
  
  if (data && type === 'experience') {
    fillExperienceForm(data);
  } else if (data && type === 'education') {
    fillEducationForm(data);
  } else {
    clearModalForm(type);
  }
}

function closeModal(type: string) {
  const modal = document.getElementById(`${type}-modal`)!;
  modal.classList.remove('active');
  currentEditingIndex = -1;
  currentEditingType = '';
}

function fillExperienceForm(data: any) {
  (document.getElementById('exp-company') as HTMLInputElement).value = data.company || '';
  (document.getElementById('exp-position') as HTMLInputElement).value = data.position || '';
  (document.getElementById('exp-start') as HTMLInputElement).value = data.startDate || '';
  (document.getElementById('exp-end') as HTMLInputElement).value = data.endDate || '';
  (document.getElementById('exp-description') as HTMLTextAreaElement).value = data.description || '';
  (document.getElementById('exp-skills') as HTMLInputElement).value = data.skills?.join(', ') || '';
  
  const currentCheckbox = document.getElementById('exp-current') as HTMLInputElement;
  currentCheckbox.checked = !data.endDate;
  (document.getElementById('exp-end') as HTMLInputElement).disabled = !data.endDate;
}

function fillEducationForm(data: any) {
  (document.getElementById('edu-institution') as HTMLInputElement).value = data.institution || '';
  (document.getElementById('edu-degree') as HTMLInputElement).value = data.degree || '';
  (document.getElementById('edu-field') as HTMLInputElement).value = data.field || '';
  (document.getElementById('edu-graduation') as HTMLInputElement).value = data.graduationDate || '';
}

function clearModalForm(type: string) {
  const form = document.getElementById(`${type}-form`) as HTMLFormElement;
  form.reset();
  
  if (type === 'experience') {
    (document.getElementById('exp-end') as HTMLInputElement).disabled = false;
  }
}

async function saveExperience() {
  const form = document.getElementById('experience-form') as HTMLFormElement;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const data = {
    company: (document.getElementById('exp-company') as HTMLInputElement).value,
    position: (document.getElementById('exp-position') as HTMLInputElement).value,
    startDate: (document.getElementById('exp-start') as HTMLInputElement).value,
    endDate: (document.getElementById('exp-current') as HTMLInputElement).checked ? 
      '' : (document.getElementById('exp-end') as HTMLInputElement).value,
    description: (document.getElementById('exp-description') as HTMLTextAreaElement).value,
    skills: (document.getElementById('exp-skills') as HTMLInputElement).value
      .split(',').map(s => s.trim()).filter(s => s)
  };

  if (currentEditingIndex >= 0) {
    experienceStore[currentEditingIndex] = data;
  } else {
    experienceStore.push(data);
  }

  loadExperienceData(experienceStore);
  closeModal('experience');
  await autoSave();
}

async function saveEducation() {
  const form = document.getElementById('education-form') as HTMLFormElement;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const data = {
    institution: (document.getElementById('edu-institution') as HTMLInputElement).value,
    degree: (document.getElementById('edu-degree') as HTMLInputElement).value,
    field: (document.getElementById('edu-field') as HTMLInputElement).value,
    graduationDate: (document.getElementById('edu-graduation') as HTMLInputElement).value
  };

  if (currentEditingIndex >= 0) {
    educationStore[currentEditingIndex] = data;
  } else {
    educationStore.push(data);
  }

  loadEducationData(educationStore);
  closeModal('education');
  await autoSave();
}

async function resetAllData() {
  if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
    await chrome.storage.sync.clear();
    location.reload();
  }
}

async function exportData() {
  try {
    const data = await chrome.storage.sync.get(['userProfile', 'settings']);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'job-autofill-data.json';
    a.click();
    
    URL.revokeObjectURL(url);
    showStatus('Data exported successfully', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showStatus('Error exporting data', 'error');
  }
}

async function importData(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    await chrome.storage.sync.set(data);
    showStatus('Data imported successfully', 'success');
    
    // Reload the page to show imported data
    setTimeout(() => location.reload(), 1000);
  } catch (error) {
    console.error('Import error:', error);
    showStatus('Error importing data', 'error');
  }
}

async function clearAllData() {
  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    try {
      await chrome.storage.sync.clear();
      await chrome.storage.local.clear();
      showStatus('All data cleared', 'success');
      setTimeout(() => location.reload(), 1000);
    } catch (error) {
      console.error('Clear data error:', error);
      showStatus('Error clearing data', 'error');
    }
  }
}

function showStatus(message: string, type: 'success' | 'error' | 'saving') {
  saveStatus.textContent = message;
  saveStatus.className = `save-status status-${type}`;
  
  if (type !== 'saving') {
    setTimeout(() => {
      saveStatus.textContent = 'All changes saved';
      saveStatus.className = 'save-status status-success';
    }, 3000);
  }
}
