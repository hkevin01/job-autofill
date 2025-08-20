/**
 * Job AutoFill - Debug Overlay
 * Visual debugging interface for form detection and field mapping
 */

import { DetectedField, DetectedForm, formDetector } from './form-detector';
import { addTooltip, highlightElement } from './utils';

console.log('Job AutoFill Debug Overlay loaded');

// =====================================================
// Debug Overlay Types and State
// =====================================================

interface DebugOverlayOptions {
  enabled: boolean;
  showConfidence: boolean;
  showFieldTypes: boolean;
  showPlatform: boolean;
  highlightDuration: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface OverlayState {
  isVisible: boolean;
  activeFields: DetectedField[];
  selectedField: DetectedField | null;
  totalForms: number;
}

class DebugOverlay {
  private container: HTMLElement | null = null;
  private panel: HTMLElement | null = null;
  private fieldList: HTMLElement | null = null;
  private state: OverlayState;
  private options: DebugOverlayOptions;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(options: Partial<DebugOverlayOptions> = {}) {
    this.options = {
      enabled: true,
      showConfidence: true,
      showFieldTypes: true,
      showPlatform: true,
      highlightDuration: 3000,
      position: 'top-right',
      ...options,
    };

    this.state = {
      isVisible: false,
      activeFields: [],
      selectedField: null,
      totalForms: 0,
    };

    this.init();
  }

  // =====================================================
  // Initialization and DOM Creation
  // =====================================================

  private init(): void {
    if (!this.options.enabled) return;

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.createOverlay());
    } else {
      this.createOverlay();
    }

    // Listen for form detection updates
    this.startUpdateLoop();

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboard.bind(this));
  }

  private createOverlay(): void {
    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'job-autofill-debug-overlay';
    this.container.style.cssText = this.getContainerStyles();

    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.innerHTML = '🔍';
    toggleBtn.title = 'Toggle Job AutoFill Debug Overlay (Ctrl+Shift+J)';
    toggleBtn.style.cssText = this.getToggleButtonStyles();
    toggleBtn.addEventListener('click', () => this.toggle());

    // Create debug panel
    this.panel = document.createElement('div');
    this.panel.style.cssText = this.getPanelStyles();
    this.panel.innerHTML = this.getPanelHTML();

    // Add event listeners to panel
    this.addPanelEventListeners();

    this.container.appendChild(toggleBtn);
    this.container.appendChild(this.panel);
    document.body.appendChild(this.container);

    // Get field list reference
    this.fieldList = this.panel.querySelector('.field-list');
  }

  // =====================================================
  // UI Styling
  // =====================================================

  private getContainerStyles(): string {
    const positions = {
      'top-left': 'top: 10px; left: 10px;',
      'top-right': 'top: 10px; right: 10px;',
      'bottom-left': 'bottom: 10px; left: 10px;',
      'bottom-right': 'bottom: 10px; right: 10px;',
    };

    return `
      position: fixed;
      ${positions[this.options.position]}
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 12px;
      pointer-events: auto;
    `;
  }

  private getToggleButtonStyles(): string {
    return `
      background: #4CAF50;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      color: white;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: all 0.2s ease;
      margin-bottom: 8px;
      display: block;
    `;
  }

  private getPanelStyles(): string {
    return `
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      width: 350px;
      max-height: 500px;
      overflow-y: auto;
      display: ${this.state.isVisible ? 'block' : 'none'};
    `;
  }

  private getPanelHTML(): string {
    return `
      <div class="debug-header" style="padding: 12px; border-bottom: 1px solid #e0e0e0; background: #f5f5f5;">
        <h3 style="margin: 0; color: #333; font-size: 14px;">🔍 Job AutoFill Debug</h3>
        <div class="stats" style="margin-top: 4px; color: #666; font-size: 11px;">
          <span class="form-count">Forms: 0</span> |
          <span class="field-count">Fields: 0</span> |
          <span class="platform">Platform: Unknown</span>
        </div>
      </div>

      <div class="debug-controls" style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0;">
        <label style="display: flex; align-items: center; margin-bottom: 4px;">
          <input type="checkbox" class="show-confidence" checked style="margin-right: 6px;">
          <span style="font-size: 11px;">Show Confidence</span>
        </label>
        <label style="display: flex; align-items: center; margin-bottom: 4px;">
          <input type="checkbox" class="highlight-fields" style="margin-right: 6px;">
          <span style="font-size: 11px;">Highlight Fields</span>
        </label>
        <button class="rescan-btn" style="
          background: #2196F3; color: white; border: none; padding: 4px 8px;
          border-radius: 4px; font-size: 11px; cursor: pointer; width: 100%;
        ">🔄 Rescan Forms</button>
      </div>

      <div class="field-list" style="max-height: 300px; overflow-y: auto;">
        <!-- Field items will be populated here -->
      </div>

      <div class="debug-footer" style="padding: 8px 12px; border-top: 1px solid #e0e0e0; background: #f9f9f9; font-size: 10px; color: #666;">
        Press Ctrl+Shift+J to toggle | Click fields to highlight
      </div>
    `;
  }

  // =====================================================
  // Event Handlers
  // =====================================================

  private addPanelEventListeners(): void {
    if (!this.panel) return;

    // Rescan button
    const rescanBtn = this.panel.querySelector('.rescan-btn');
    rescanBtn?.addEventListener('click', () => {
      formDetector.rescan();
      this.updateDisplay();
    });

    // Highlight toggle
    const highlightCheckbox = this.panel.querySelector('.highlight-fields') as HTMLInputElement;
    highlightCheckbox?.addEventListener('change', e => {
      const target = e.target as HTMLInputElement;
      formDetector.setOptions({ highlightFields: target.checked });
      if (target.checked) {
        this.highlightAllFields();
      }
    });

    // Confidence toggle
    const confidenceCheckbox = this.panel.querySelector('.show-confidence') as HTMLInputElement;
    confidenceCheckbox?.addEventListener('change', () => {
      this.updateFieldList();
    });
  }

  private handleKeyboard(event: KeyboardEvent): void {
    // Ctrl+Shift+J to toggle overlay
    if (event.ctrlKey && event.shiftKey && event.key === 'J') {
      event.preventDefault();
      this.toggle();
    }
  }

  // =====================================================
  // Display Updates
  // =====================================================

  private startUpdateLoop(): void {
    this.updateInterval = setInterval(() => {
      this.updateDisplay();
    }, 2000);
  }

  private updateDisplay(): void {
    if (!this.state.isVisible || !this.panel) return;

    const forms = formDetector.getDetectedForms();
    const fields = formDetector.getDetectedFields();

    this.state.activeFields = fields;
    this.state.totalForms = forms.length;

    this.updateStats(forms, fields);
    this.updateFieldList();
  }

  private updateStats(forms: DetectedForm[], fields: DetectedField[]): void {
    if (!this.panel) return;

    const formCountEl = this.panel.querySelector('.form-count');
    const fieldCountEl = this.panel.querySelector('.field-count');
    const platformEl = this.panel.querySelector('.platform');

    if (formCountEl) formCountEl.textContent = `Forms: ${forms.length}`;
    if (fieldCountEl) fieldCountEl.textContent = `Fields: ${fields.length}`;

    const platform = forms.length > 0 ? forms[0].platform : 'Unknown';
    if (platformEl) platformEl.textContent = `Platform: ${platform}`;
  }

  private updateFieldList(): void {
    if (!this.fieldList) return;

    const showConfidence =
      (this.panel?.querySelector('.show-confidence') as HTMLInputElement)?.checked ?? true;

    if (this.state.activeFields.length === 0) {
      this.fieldList.innerHTML = `
        <div style="padding: 16px; text-align: center; color: #666; font-style: italic;">
          No form fields detected
        </div>
      `;
      return;
    }

    const fieldsHTML = this.state.activeFields
      .sort((a, b) => b.confidence - a.confidence)
      .map(field => this.createFieldItemHTML(field, showConfidence))
      .join('');

    this.fieldList.innerHTML = fieldsHTML;

    // Add click handlers to field items
    this.fieldList.querySelectorAll('.field-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.selectField(this.state.activeFields[index]);
      });
    });
  }

  private createFieldItemHTML(field: DetectedField, showConfidence: boolean): string {
    const confidenceColor =
      field.confidence >= 0.7 ? '#4CAF50' : field.confidence >= 0.5 ? '#FF9800' : '#f44336';

    const confidenceDisplay = showConfidence
      ? `<span style="color: ${confidenceColor}; font-weight: bold;">${Math.round(
          field.confidence * 100
        )}%</span>`
      : '';

    const methodBadges = field.detectionMethod
      .map(
        method => `<span style="
        background: #e3f2fd; color: #1976d2; padding: 1px 4px;
        border-radius: 2px; font-size: 9px; margin-right: 2px;
      ">${method}</span>`
      )
      .join('');

    return `
      <div class="field-item" style="
        padding: 8px 12px; border-bottom: 1px solid #f0f0f0;
        cursor: pointer; transition: background-color 0.2s;
      " onmouseover="this.style.backgroundColor='#f5f5f5'"
         onmouseout="this.style.backgroundColor='transparent'">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #333; font-size: 12px;">${field.fieldType}</strong>
          ${confidenceDisplay}
        </div>
        ${
          field.label
            ? `<div style="color: #666; font-size: 10px; margin-top: 2px;">${field.label}</div>`
            : ''
        }
        <div style="margin-top: 4px;">${methodBadges}</div>
        ${
          field.platform
            ? `<div style="color: #888; font-size: 9px; margin-top: 2px;">Platform: ${field.platform}</div>`
            : ''
        }
      </div>
    `;
  }

  // =====================================================
  // Field Interaction
  // =====================================================

  private selectField(field: DetectedField): void {
    this.state.selectedField = field;

    // Highlight the selected field
    highlightElement(field.element, 'success', this.options.highlightDuration);

    // Show tooltip with detailed info
    const tooltip = `
      Field: ${field.fieldType}
      Confidence: ${Math.round(field.confidence * 100)}%
      Methods: ${field.detectionMethod.join(', ')}
      ${field.platform ? `Platform: ${field.platform}` : ''}
      ${field.selector ? `Selector: ${field.selector}` : ''}
    `;

    addTooltip(field.element, tooltip, this.options.highlightDuration);

    // Scroll element into view
    field.element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }

  private highlightAllFields(): void {
    this.state.activeFields.forEach(field => {
      const confidenceLevel =
        field.confidence >= 0.7 ? 'success' : field.confidence >= 0.5 ? 'warning' : 'error';
      highlightElement(field.element, confidenceLevel, this.options.highlightDuration);
    });
  }

  // =====================================================
  // Public API
  // =====================================================

  public toggle(): void {
    this.state.isVisible = !this.state.isVisible;
    if (this.panel) {
      this.panel.style.display = this.state.isVisible ? 'block' : 'none';
    }

    if (this.state.isVisible) {
      this.updateDisplay();
    }
  }

  public show(): void {
    this.state.isVisible = true;
    if (this.panel) {
      this.panel.style.display = 'block';
    }
    this.updateDisplay();
  }

  public hide(): void {
    this.state.isVisible = false;
    if (this.panel) {
      this.panel.style.display = 'none';
    }
  }

  public setOptions(newOptions: Partial<DebugOverlayOptions>): void {
    this.options = { ...this.options, ...newOptions };

    if (!this.options.enabled && this.container) {
      this.container.style.display = 'none';
    } else if (this.options.enabled && this.container) {
      this.container.style.display = 'block';
    }
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    if (this.container) {
      this.container.remove();
    }

    document.removeEventListener('keydown', this.handleKeyboard.bind(this));
  }
}

// =====================================================
// Initialize and Export
// =====================================================

// Create debug overlay instance
export const debugOverlay = new DebugOverlay({
  enabled: true,
  showConfidence: true,
  showFieldTypes: true,
  position: 'top-right',
});

// Make available for debugging
if (typeof window !== 'undefined') {
  (window as any).__JOB_AUTOFILL_DEBUG_OVERLAY__ = debugOverlay;
}

export { DebugOverlay };
