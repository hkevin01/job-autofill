/**
 * Job AutoFill - Utility Functions
 * Safe, resilient utilities for form detection and filling
 */

// =====================================================
// Safe Value Setting with React/Angular/Vue Support
// =====================================================

/**
 * Safely sets input value to work with React controlled components
 * Uses native property setters and dispatches proper events
 */
export function setInputValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): boolean {
  try {
    const proto =
      el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;

    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) {
      setter.call(el, value);
    } else {
      (el as any).value = value;
    }

    // Dispatch events that React/Angular/Vue listen for
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));

    // Some frameworks also listen for keyup/keydown
    el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

    return true;
  } catch (error) {
    console.warn('Failed to set input value:', error);
    return false;
  }
}

/**
 * Safely sets select value and triggers change events
 */
export function setSelectValue(el: HTMLSelectElement, value: string): boolean {
  try {
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    return true;
  } catch (error) {
    console.warn('Failed to set select value:', error);
    return false;
  }
}

// =====================================================
// Text Processing and Truncation
// =====================================================

/**
 * Soft truncation that preserves word boundaries
 */
export function softTruncate(text: string, maxLength: number): string {
  if (!maxLength || text.length <= maxLength) return text;

  const slice = text.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');

  // If the last space is too far back, just hard truncate
  if (lastSpace < maxLength * 0.5) {
    return slice.trim() + '…';
  }

  return slice.slice(0, lastSpace).trim() + '…';
}

/**
 * Smart text truncation for different field types
 */
export function truncateForField(text: string, fieldType: string, maxLength?: number): string {
  // Default max lengths by field type
  const defaultLimits: Record<string, number> = {
    firstName: 50,
    lastName: 50,
    email: 100,
    phone: 20,
    city: 50,
    state: 50,
    zipCode: 10,
    summary: 2000,
    coverLetter: 4000,
    experience: 1500,
    skills: 500,
    whyInterested: 1000,
  };

  const limit = maxLength || defaultLimits[fieldType] || 200;
  return softTruncate(text, limit);
}

/**
 * Normalize URLs for consistent format
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';

  // Add protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch {
    return url; // Return original if invalid
  }
}

/**
 * Split location string into components
 */
export function parseLocation(location: string): {
  city?: string;
  state?: string;
  country?: string;
} {
  if (!location) return {};

  const parts = location.split(',').map(part => part.trim());

  if (parts.length >= 3) {
    return {
      city: parts[0],
      state: parts[1],
      country: parts[2],
    };
  } else if (parts.length === 2) {
    return {
      city: parts[0],
      state: parts[1],
    };
  } else {
    return {
      city: parts[0],
    };
  }
}

// =====================================================
// Iframe and Document Traversal
// =====================================================

/**
 * Generator that yields all same-origin documents (including iframes)
 */
export function* allDocuments(): Generator<Document> {
  const stack: Document[] = [document];

  while (stack.length) {
    const doc = stack.pop()!;
    yield doc;

    // Find all iframes in this document
    for (const frame of Array.from(doc.querySelectorAll('iframe'))) {
      try {
        if (frame.contentDocument) {
          stack.push(frame.contentDocument);
        }
      } catch {
        // Cross-origin iframe, skip silently
      }
    }
  }
}

/**
 * Find elements across all same-origin documents
 */
export function findElementsAcrossFrames(selector: string): Element[] {
  const elements: Element[] = [];

  for (const doc of allDocuments()) {
    elements.push(...Array.from(doc.querySelectorAll(selector)));
  }

  return elements;
}

// =====================================================
// Element Visibility and Interaction Checks
// =====================================================

/**
 * Check if element is visible and interactable
 */
export function isElementInteractable(el: Element): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;

  // Basic visibility checks
  if (el.hidden || el.offsetParent === null) return false;
  if (el.style.display === 'none' || el.style.visibility === 'hidden') return false;

  // Check if disabled
  if ('disabled' in el && (el as any).disabled) return false;
  if (el.getAttribute('disabled') !== null) return false;
  if (el.getAttribute('readonly') !== null) return false;

  // Check computed styles
  const styles = window.getComputedStyle(el);
  if (styles.display === 'none' || styles.visibility === 'hidden') return false;
  if (styles.opacity === '0') return false;

  // Check if element is off-screen
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  if (rect.top < -100 || rect.left < -100) return false;
  if (rect.top > window.innerHeight + 100 || rect.left > window.innerWidth + 100) return false;

  return true;
}

/**
 * Check if element is likely a form field
 */
export function isFormField(
  el: Element
): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  );
}

/**
 * Get element's label text from various sources
 */
export function getElementLabel(el: Element): string {
  const labels: string[] = [];

  // Direct label element
  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`);
    if (label && label.textContent) {
      labels.push(label.textContent.trim());
    }
  }

  // Parent label
  const parentLabel = el.closest('label');
  if (parentLabel && parentLabel.textContent) {
    labels.push(parentLabel.textContent.trim());
  }

  // Aria-label
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) {
    labels.push(ariaLabel.trim());
  }

  // Aria-labelledby
  const ariaLabelledBy = el.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement && labelElement.textContent) {
      labels.push(labelElement.textContent.trim());
    }
  }

  // Placeholder
  const placeholder = el.getAttribute('placeholder');
  if (placeholder) {
    labels.push(placeholder.trim());
  }

  // Title
  const title = el.getAttribute('title');
  if (title) {
    labels.push(title.trim());
  }

  return labels.join(' | ');
}

// =====================================================
// Visual Feedback and Highlighting
// =====================================================

/**
 * Highlight element with feedback
 */
export function highlightElement(
  el: Element,
  type: 'success' | 'warning' | 'error' = 'success',
  duration: number = 3000
): void {
  const className = `job-autofill-highlight-${type}`;
  el.classList.add(className);

  setTimeout(() => {
    el.classList.remove(className);
  }, duration);
}

/**
 * Add tooltip to element
 */
export function addTooltip(el: Element, text: string, duration: number = 2000): void {
  const tooltip = document.createElement('div');
  tooltip.className = 'job-autofill-tooltip';
  tooltip.textContent = text;
  tooltip.style.cssText = `
    position: absolute;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 10001;
    pointer-events: none;
    white-space: nowrap;
  `;

  const rect = el.getBoundingClientRect();
  tooltip.style.top = rect.top - 30 + 'px';
  tooltip.style.left = rect.left + 'px';

  document.body.appendChild(tooltip);

  setTimeout(() => {
    if (tooltip.parentNode) {
      tooltip.parentNode.removeChild(tooltip);
    }
  }, duration);
}

// =====================================================
// Confidence Scoring for Field Detection
// =====================================================

/**
 * Calculate confidence score for field detection
 */
export function calculateFieldConfidence(
  el: Element,
  fieldType: string,
  detectionReason: string[]
): number {
  let confidence = 0;

  // Base confidence by detection method
  const methodScores: Record<string, number> = {
    'name-exact': 0.9,
    'name-contains': 0.7,
    'id-exact': 0.8,
    'id-contains': 0.6,
    placeholder: 0.5,
    'aria-label': 0.8,
    'label-text': 0.7,
    'input-type': 0.6,
    autocomplete: 0.9,
  };

  // Calculate base confidence from detection reasons
  for (const reason of detectionReason) {
    confidence = Math.max(confidence, methodScores[reason] || 0.3);
  }

  // Boost confidence for specific patterns
  if (isElementInteractable(el)) {
    confidence += 0.1;
  }

  if (el.hasAttribute('required')) {
    confidence += 0.05;
  }

  const label = getElementLabel(el).toLowerCase();
  if (label.includes(fieldType.toLowerCase())) {
    confidence += 0.1;
  }

  // Penalize if element seems wrong
  if (el.getAttribute('type') === 'hidden') {
    confidence *= 0.1;
  }

  if (!isElementInteractable(el)) {
    confidence *= 0.5;
  }

  return Math.min(1, Math.max(0, confidence));
}

// =====================================================
// Debugging and Development Helpers
// =====================================================

/**
 * Create debug info object for field detection
 */
export function createDebugInfo(
  el: Element,
  fieldType: string,
  confidence: number,
  detectionReason: string[]
): any {
  return {
    element: el,
    tagName: el.tagName.toLowerCase(),
    fieldType,
    confidence,
    detectionReason,
    attributes: {
      id: el.id,
      name: el.getAttribute('name'),
      class: el.className,
      placeholder: el.getAttribute('placeholder'),
      type: el.getAttribute('type'),
      'aria-label': el.getAttribute('aria-label'),
    },
    label: getElementLabel(el),
    visible: isElementInteractable(el),
    selector: generateSelector(el),
  };
}

/**
 * Generate unique CSS selector for element
 */
export function generateSelector(el: Element): string {
  if (el.id) {
    return `#${el.id}`;
  }

  const path: string[] = [];
  let current: Element | null = el;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.tagName.toLowerCase();

    if (current.className) {
      selector += '.' + current.className.split(' ').join('.');
    }

    path.unshift(selector);
    current = current.parentElement;

    // Limit depth to avoid overly long selectors
    if (path.length > 5) break;
  }

  return path.join(' > ');
}

// =====================================================
// Rate Limiting and Performance
// =====================================================

/**
 * Simple debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Simple throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Random delay for anti-bot detection
 */
export function randomDelay(min: number = 50, max: number = 150): Promise<void> {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// =====================================================
// Data Validation and Sanitization
// =====================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Sanitize text input
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/\r\n/g, '\n') // Normalize line endings
    .trim();
}

// Export debugging interface for window object
export interface JobAutoFillDebugInfo {
  detectedFields: any[];
  lastRun: any[];
  version: string;
  utils: typeof import('./utils');
}

// Make utilities available for debugging
if (typeof window !== 'undefined') {
  (window as any).__JOB_AUTOFILL_UTILS__ = {
    setInputValue,
    setSelectValue,
    softTruncate,
    truncateForField,
    normalizeUrl,
    parseLocation,
    allDocuments,
    findElementsAcrossFrames,
    isElementInteractable,
    isFormField,
    getElementLabel,
    highlightElement,
    addTooltip,
    calculateFieldConfidence,
    createDebugInfo,
    generateSelector,
    debounce,
    throttle,
    randomDelay,
    isValidEmail,
    isValidPhone,
    sanitizeText,
  };
}
