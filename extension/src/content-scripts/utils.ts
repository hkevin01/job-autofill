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

// =====================================================
// Resume Parsing for Local Processing
// =====================================================

/**
 * Local resume parsing using basic NLP patterns
 * Fallback when API is unavailable or for privacy
 */
export class LocalResumeParser {
  /**
   * Parse resume from text content
   */
  async parseResumeFromText(text: string): Promise<any> {
    console.log('🔍 Parsing resume from text locally');

    try {
      const sections = this.extractSections(text);
      return {
        personalInfo: this.extractPersonalInfo(text),
        summary: this.extractSummary(sections),
        experience: this.extractExperience(sections),
        education: this.extractEducation(sections),
        skills: this.extractSkills(sections),
        certifications: this.extractCertifications(sections),
        projects: this.extractProjects(sections)
      };
    } catch (error) {
      console.error('Local resume parsing failed:', error);
      throw error;
    }
  }

  private extractSections(text: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    // Common section headers (case-insensitive)
    const sectionPatterns = {
      experience: /^(experience|work\s*experience|professional\s*experience|employment\s*history|career\s*history)$/i,
      education: /^(education|academic\s*background|qualifications)$/i,
      skills: /^(skills|technical\s*skills|core\s*competencies|abilities|proficiencies)$/i,
      summary: /^(summary|professional\s*summary|objective|career\s*objective|profile)$/i,
      projects: /^(projects|personal\s*projects|portfolio|achievements)$/i,
      certifications: /^(certifications|certificates|licenses|credentials)$/i
    };

    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      let foundSection = false;

      // Check if line matches any section header
      for (const [section, pattern] of Object.entries(sectionPatterns)) {
        if (pattern.test(line)) {
          // Save previous section
          if (currentSection && currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n');
          }
          
          currentSection = section;
          currentContent = [];
          foundSection = true;
          break;
        }
      }

      if (!foundSection && currentSection) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n');
    }

    return sections;
  }

  private extractPersonalInfo(text: string): any {
    const personalInfo: any = {};

    // Extract email
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      personalInfo.email = emailMatch[0];
    }

    // Extract phone (various formats)
    const phoneMatch = text.match(/(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
    if (phoneMatch) {
      personalInfo.phone = phoneMatch[0];
    }

    // Extract LinkedIn
    const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9-]+/i);
    if (linkedinMatch) {
      personalInfo.linkedin = 'https://' + linkedinMatch[0];
    }

    // Extract GitHub
    const githubMatch = text.match(/github\.com\/[a-zA-Z0-9-]+/i);
    if (githubMatch) {
      personalInfo.github = 'https://' + githubMatch[0];
    }

    // Extract name (first meaningful line)
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    for (const line of lines) {
      if (line.length > 2 && line.length < 50 && 
          !line.includes('@') && 
          !line.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/) &&
          !line.toLowerCase().includes('linkedin') &&
          !line.toLowerCase().includes('github') &&
          !line.toLowerCase().includes('resume')) {
        personalInfo.fullName = line;
        break;
      }
    }

    return personalInfo;
  }

  private extractSummary(sections: Record<string, string>): string {
    return sections.summary || '';
  }

  private extractExperience(sections: Record<string, string>): any[] {
    if (!sections.experience) return [];

    const experienceText = sections.experience;
    const experiences: any[] = [];

    // Split by company/position blocks (lines starting with capital letters)
    const blocks = experienceText.split(/\n(?=[A-Z][a-zA-Z\s&,.-]+(?:\s+\|\s+|\s+at\s+|\s+-\s+|\n))/);

    for (const block of blocks) {
      if (block.trim().length < 10) continue;

      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length < 2) continue;

      const experience: any = {
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        description: '',
        achievements: [],
        technologies: []
      };

      // Extract dates first
      const datePattern = /(\d{4}|\d{1,2}\/\d{4}|\w+\s+\d{4})/g;
      const dates = block.match(datePattern) || [];

      if (dates.length >= 2) {
        experience.startDate = dates[0];
        experience.endDate = dates[1];
      } else if (dates.length === 1) {
        experience.startDate = dates[0];
        experience.endDate = 'Present';
      }

      // Parse first two lines for company/position
      const firstLine = lines[0];
      const secondLine = lines[1] || '';

      if (firstLine.toLowerCase().includes(' at ') || firstLine.includes(' | ')) {
        const parts = firstLine.split(/\s+at\s+|\s+\|\s+/);
        experience.position = parts[0].trim();
        experience.company = parts[1]?.trim() || '';
      } else {
        experience.position = firstLine;
        if (secondLine && !datePattern.test(secondLine)) {
          experience.company = secondLine;
        }
      }

      // Extract description and achievements
      const descriptionLines = lines.slice(2).filter(line => 
        !datePattern.test(line) && line.length > 10
      );
      
      experience.description = descriptionLines.join(' ');
      experience.achievements = descriptionLines.filter(line => 
        line.startsWith('•') || line.startsWith('-') || line.startsWith('*')
      ).map(line => line.replace(/^[•\-*]\s*/, ''));

      experiences.push(experience);
    }

    return experiences;
  }

  private extractEducation(sections: Record<string, string>): any[] {
    if (!sections.education) return [];

    const educationText = sections.education;
    const education: any[] = [];

    const lines = educationText.split('\n').map(line => line.trim()).filter(line => line);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for degree patterns
      const degreePatterns = [
        /\b(bachelor|master|phd|doctorate|associate|diploma|certificate)\b/i,
        /\b(b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|ph\.?d\.?)\b/i
      ];

      if (degreePatterns.some(pattern => pattern.test(line))) {
        const edu: any = {
          institution: '',
          degree: line,
          field: '',
          graduationDate: ''
        };

        // Look for institution in surrounding lines
        if (i + 1 < lines.length && !degreePatterns.some(p => p.test(lines[i + 1]))) {
          edu.institution = lines[i + 1];
        } else if (i > 0 && !degreePatterns.some(p => p.test(lines[i - 1]))) {
          edu.institution = lines[i - 1];
        }

        // Extract graduation date
        const dateMatch = line.match(/\d{4}/);
        if (dateMatch) {
          edu.graduationDate = dateMatch[0];
        }

        // Extract field from degree
        const fieldMatch = line.match(/in\s+([a-zA-Z\s]+)/i);
        if (fieldMatch) {
          edu.field = fieldMatch[1].trim();
        }

        education.push(edu);
      }
    }

    return education;
  }

  private extractSkills(sections: Record<string, string>): any[] {
    if (!sections.skills) return [];

    const skillsText = sections.skills;
    const skills: any[] = [];

    // Split by categories (lines ending with colon)
    const categories = skillsText.split(/\n(?=[A-Z][a-zA-Z\s]+:)/);

    for (const category of categories) {
      const lines = category.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length === 0) continue;

      const firstLine = lines[0];
      const categoryName = firstLine.includes(':') ? firstLine.replace(':', '').trim() : 'Technical Skills';
      
      const skillItems = lines.slice(firstLine.includes(':') ? 1 : 0)
        .join(' ')
        .split(/[,;•\-]/)
        .map(skill => skill.trim())
        .filter(skill => skill && skill.length > 1);

      if (skillItems.length > 0) {
        skills.push({
          category: categoryName,
          items: skillItems
        });
      }
    }

    // If no categories found, treat as single list
    if (skills.length === 0) {
      const allSkills = skillsText
        .split(/[,;•\-\n]/)
        .map(skill => skill.trim())
        .filter(skill => skill && skill.length > 1);

      if (allSkills.length > 0) {
        skills.push({
          category: 'Technical Skills',
          items: allSkills
        });
      }
    }

    return skills;
  }

  private extractCertifications(sections: Record<string, string>): any[] {
    if (!sections.certifications) return [];

    const certText = sections.certifications;
    const certifications: any[] = [];

    const lines = certText.split('\n').map(line => line.trim()).filter(line => line);

    for (const line of lines) {
      if (line.length < 5) continue;

      const cert: any = {
        name: line,
        issuer: '',
        date: ''
      };

      // Extract date
      const dateMatch = line.match(/\d{4}/);
      if (dateMatch) {
        cert.date = dateMatch[0];
      }

      // Extract issuer (common patterns)
      const issuerPatterns = [
        /by\s+([A-Za-z\s&,.]+)/i,
        /from\s+([A-Za-z\s&,.]+)/i,
        /-\s+([A-Za-z\s&,.]+)/
      ];

      for (const pattern of issuerPatterns) {
        const match = line.match(pattern);
        if (match) {
          cert.issuer = match[1].trim();
          cert.name = line.replace(match[0], '').trim();
          break;
        }
      }

      certifications.push(cert);
    }

    return certifications;
  }

  private extractProjects(sections: Record<string, string>): any[] {
    if (!sections.projects) return [];

    const projectsText = sections.projects;
    const projects: any[] = [];

    // Split by project names (lines with colons or dashes)
    const blocks = projectsText.split(/\n(?=[A-Z][a-zA-Z\s-]+:|\n\s*-\s*[A-Z])/);

    for (const block of blocks) {
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length < 2) continue;

      const project: any = {
        name: lines[0].replace(/^-\s*|:$/, '').trim(),
        description: '',
        technologies: [],
        link: ''
      };

      // Extract description
      const descLines = lines.slice(1).filter(line => 
        !line.toLowerCase().includes('technologies:') &&
        !line.toLowerCase().includes('tech stack:') &&
        !line.includes('http')
      );
      project.description = descLines.join(' ');

      // Extract technologies
      const techLine = lines.find(line => 
        line.toLowerCase().includes('technologies:') ||
        line.toLowerCase().includes('tech stack:')
      );
      
      if (techLine) {
        project.technologies = techLine
          .replace(/technologies:|tech stack:/i, '')
          .split(/[,;]/)
          .map(tech => tech.trim())
          .filter(tech => tech);
      }

      // Extract link
      const linkMatch = block.match(/(https?:\/\/[^\s]+)/);
      if (linkMatch) {
        project.link = linkMatch[0];
      }

      projects.push(project);
    }

    return projects;
  }
}

// =====================================================
// ATS-Specific Form Fillers
// =====================================================

/**
 * Workday-specific form filling logic
 */
export class WorkdayFormFiller {
  fillApplication(resumeData: any): boolean {
    console.log('🏢 Filling Workday application form');

    try {
      // Workday uses specific data-automation-id attributes
      const fieldMappings = {
        'input[data-automation-id="firstName"]': resumeData.personalInfo?.fullName?.split(' ')[0] || '',
        'input[data-automation-id="lastName"]': resumeData.personalInfo?.fullName?.split(' ').slice(1).join(' ') || '',
        'input[data-automation-id="email"]': resumeData.personalInfo?.email || '',
        'input[data-automation-id="phone"]': resumeData.personalInfo?.phone || '',
        'textarea[data-automation-id="coverLetter"]': this.generateCoverLetter(resumeData),
      };

      let filledCount = 0;
      for (const [selector, value] of Object.entries(fieldMappings)) {
        const element = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
        if (element && value) {
          if (setInputValue(element, value)) {
            filledCount++;
          }
        }
      }

      console.log(`✅ Filled ${filledCount} Workday fields`);
      return filledCount > 0;
    } catch (error) {
      console.error('Workday form filling failed:', error);
      return false;
    }
  }

  private generateCoverLetter(resumeData: any): string {
    const name = resumeData.personalInfo?.fullName || 'Applicant';
    const summary = resumeData.summary || 'I am a dedicated professional seeking new opportunities.';
    
    return `Dear Hiring Manager,

${summary}

Based on my experience and skills, I believe I would be a valuable addition to your team. I look forward to discussing how my background aligns with your needs.

Best regards,
${name}`;
  }
}

/**
 * Greenhouse-specific form filling logic
 */
export class GreenhouseFormFiller {
  fillApplication(resumeData: any): boolean {
    console.log('🌱 Filling Greenhouse application form');

    try {
      const fieldMappings = {
        'input[name="job_application[first_name]"]': resumeData.personalInfo?.fullName?.split(' ')[0] || '',
        'input[name="job_application[last_name]"]': resumeData.personalInfo?.fullName?.split(' ').slice(1).join(' ') || '',
        'input[name="job_application[email]"]': resumeData.personalInfo?.email || '',
        'input[name="job_application[phone]"]': resumeData.personalInfo?.phone || '',
        'textarea[name="job_application[cover_letter]"]': this.generateCoverLetter(resumeData),
      };

      let filledCount = 0;
      for (const [selector, value] of Object.entries(fieldMappings)) {
        const element = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
        if (element && value) {
          if (setInputValue(element, value)) {
            filledCount++;
          }
        }
      }

      console.log(`✅ Filled ${filledCount} Greenhouse fields`);
      return filledCount > 0;
    } catch (error) {
      console.error('Greenhouse form filling failed:', error);
      return false;
    }
  }

  private generateCoverLetter(resumeData: any): string {
    const name = resumeData.personalInfo?.fullName || 'Applicant';
    const skills = resumeData.skills?.map((s: any) => s.items).flat().slice(0, 5).join(', ') || 'various technical skills';
    
    return `Dear Hiring Team,

I am excited to apply for this position. With my experience in ${skills}, I am confident I can contribute effectively to your organization.

Thank you for your consideration.

Sincerely,
${name}`;
  }
}

// Export the new classes
export const localResumeParser = new LocalResumeParser();
export const workdayFormFiller = new WorkdayFormFiller();
export const greenhouseFormFiller = new GreenhouseFormFiller();
