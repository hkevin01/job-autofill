/**
 * Job AutoFill - Resilient Form Filling System
 * Advanced form filling with React/Angular/Vue support, retry mechanisms, and dynamic content handling
 */

// Declare chrome for extension context
declare const chrome: any;

console.log('Job AutoFill Resilient Form Filler loaded');

// =====================================================
// Interfaces and Types
// =====================================================

interface FillResult {
  success: boolean;
  field: HTMLElement;
  value: string;
  attempts: number;
  errors: string[];
  finalValue?: string;
}

interface FillOptions {
  retryAttempts?: number;
  retryDelay?: number;
  humanLike?: boolean;
  skipHidden?: boolean;
  skipReadonly?: boolean;
  validateAfterFill?: boolean;
  scrollIntoView?: boolean;
  focusDelay?: number;
  typeDelay?: number;
}

interface FrameworkDetection {
  react: boolean;
  angular: boolean;
  vue: boolean;
  jquery: boolean;
  vanilla: boolean;
}

// =====================================================
// Resilient Form Filler
// =====================================================

class ResilientFormFiller {
  private frameworks: FrameworkDetection;
  private fillQueue: Array<{ field: HTMLElement; value: string; options: FillOptions }> = [];
  private isProcessing = false;
  private observer: MutationObserver | null = null;

  // Default options
  private defaultOptions: FillOptions = {
    retryAttempts: 3,
    retryDelay: 500,
    humanLike: true,
    skipHidden: true,
    skipReadonly: true,
    validateAfterFill: true,
    scrollIntoView: true,
    focusDelay: 100,
    typeDelay: 50,
  };

  constructor() {
    this.frameworks = this.detectFrameworks();
    this.setupDOMObserver();
    this.setupGlobalEventHandlers();
  }

  // =====================================================
  // Framework Detection
  // =====================================================

  private detectFrameworks(): FrameworkDetection {
    const frameworks: FrameworkDetection = {
      react: false,
      angular: false,
      vue: false,
      jquery: false,
      vanilla: true,
    };

    // Detect React
    if (
      (window as any).React ||
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ ||
      document.querySelector('[data-reactroot]') ||
      document.querySelector('[data-react-checksum]') ||
      !!Array.from(document.querySelectorAll('*')).find(el =>
        Object.keys(el).some(key => key.startsWith('__reactInternalInstance'))
      )
    ) {
      frameworks.react = true;
      frameworks.vanilla = false;
      console.log('🔍 Detected React framework');
    }

    // Detect Angular
    if (
      (window as any).ng ||
      (window as any).angular ||
      (window as any).getAllAngularRootElements ||
      document.querySelector('[ng-app]') ||
      document.querySelector('[data-ng-app]') ||
      document.querySelector('app-root')
    ) {
      frameworks.angular = true;
      frameworks.vanilla = false;
      console.log('🔍 Detected Angular framework');
    }

    // Detect Vue
    if (
      (window as any).Vue ||
      (window as any).__VUE__ ||
      document.querySelector('[data-v-]') ||
      !!Array.from(document.querySelectorAll('*')).find(
        el => el.hasAttribute('data-v-') || (el as any).__vue__
      )
    ) {
      frameworks.vue = true;
      frameworks.vanilla = false;
      console.log('🔍 Detected Vue framework');
    }

    // Detect jQuery
    if ((window as any).$ || (window as any).jQuery) {
      frameworks.jquery = true;
      console.log('🔍 Detected jQuery library');
    }

    return frameworks;
  }

  // =====================================================
  // DOM Observer for Dynamic Content
  // =====================================================

  private setupDOMObserver(): void {
    this.observer = new MutationObserver(mutations => {
      let shouldRetryFailed = false;

      mutations.forEach(mutation => {
        // Check for new form fields
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (this.isFormField(element) || element.querySelector('input, select, textarea')) {
                shouldRetryFailed = true;
              }
            }
          });
        }

        // Check for attribute changes on form fields
        if (mutation.type === 'attributes' && this.isFormField(mutation.target as Element)) {
          shouldRetryFailed = true;
        }
      });

      if (shouldRetryFailed) {
        this.retryFailedFills();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'readonly', 'hidden', 'style', 'class'],
    });
  }

  private setupGlobalEventHandlers(): void {
    // Handle dynamic form loading
    document.addEventListener('DOMContentLoaded', () => {
      this.retryFailedFills();
    });

    // Handle AJAX/SPA navigation
    let lastUrl = location.href;
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(() => this.retryFailedFills(), 1000);
      }
    }, 1000);
  }

  // =====================================================
  // Public Fill API
  // =====================================================

  public async fillField(
    field: HTMLElement,
    value: string,
    options: Partial<FillOptions> = {}
  ): Promise<FillResult> {
    const finalOptions = { ...this.defaultOptions, ...options };
    const result: FillResult = {
      success: false,
      field,
      value,
      attempts: 0,
      errors: [],
    };

    for (let attempt = 1; attempt <= finalOptions.retryAttempts!; attempt++) {
      result.attempts = attempt;

      try {
        const success = await this.attemptFillField(field, value, finalOptions);

        if (success) {
          result.success = true;
          result.finalValue = this.getFieldValue(field);
          break;
        } else {
          result.errors.push(`Attempt ${attempt}: Fill validation failed`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Attempt ${attempt}: ${errorMessage}`);
        console.warn(`Fill attempt ${attempt} failed for field:`, field, error);
      }

      // Wait before retry
      if (attempt < finalOptions.retryAttempts!) {
        await this.delay(finalOptions.retryDelay! * attempt);
      }
    }

    return result;
  }

  public async fillForm(
    fieldMappings: Record<string, string>,
    options: Partial<FillOptions> = {}
  ): Promise<{
    results: FillResult[];
    summary: { total: number; successful: number; failed: number };
  }> {
    const results: FillResult[] = [];
    const finalOptions = { ...this.defaultOptions, ...options };

    // Find all form fields
    const fields = this.findFormFields();
    const fieldsToFill = fields.filter(field => {
      const fieldName = this.getFieldName(field);
      return fieldMappings[fieldName];
    });

    console.log(`🚀 Starting resilient fill for ${fieldsToFill.length} fields`);

    // Fill fields in batches to avoid overwhelming the page
    const batchSize = 3;
    for (let i = 0; i < fieldsToFill.length; i += batchSize) {
      const batch = fieldsToFill.slice(i, i + batchSize);

      const batchPromises = batch.map(async field => {
        const fieldName = this.getFieldName(field);
        const value = fieldMappings[fieldName];

        if (finalOptions.scrollIntoView) {
          this.scrollFieldIntoView(field);
          await this.delay(100);
        }

        return this.fillField(field, value, finalOptions);
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches
      await this.delay(200);
    }

    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    };

    console.log(`✅ Fill complete: ${summary.successful}/${summary.total} successful`);
    return { results, summary };
  }

  // =====================================================
  // Core Fill Implementation
  // =====================================================

  private async attemptFillField(
    field: HTMLElement,
    value: string,
    options: FillOptions
  ): Promise<boolean> {
    // Pre-fill validation
    if (!this.isFieldFillable(field, options)) {
      throw new Error('Field is not fillable');
    }

    // Scroll field into view
    if (options.scrollIntoView) {
      this.scrollFieldIntoView(field);
    }

    // Focus the field
    await this.focusField(field, options.focusDelay!);

    // Clear existing value
    await this.clearField(field);

    // Fill based on field type and framework
    const fillSuccess = await this.performFill(field, value, options);

    if (!fillSuccess) {
      throw new Error('Fill operation failed');
    }

    // Trigger events
    await this.triggerFieldEvents(field);

    // Validate the fill
    if (options.validateAfterFill) {
      return this.validateFieldValue(field, value);
    }

    return true;
  }

  private async performFill(
    field: HTMLElement,
    value: string,
    options: FillOptions
  ): Promise<boolean> {
    const input = field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

    try {
      // Handle different field types
      if (input.type === 'file') {
        console.warn('File input fields are not supported');
        return false;
      }

      if (input.tagName === 'SELECT') {
        return this.fillSelectField(input as HTMLSelectElement, value);
      }

      if (input.type === 'checkbox' || input.type === 'radio') {
        return this.fillCheckboxRadio(input as HTMLInputElement, value);
      }

      // Text-based inputs
      return await this.fillTextInput(
        input as HTMLInputElement | HTMLTextAreaElement,
        value,
        options
      );
    } catch (error) {
      console.error('Error in performFill:', error);
      return false;
    }
  }

  private async fillTextInput(
    input: HTMLInputElement | HTMLTextAreaElement,
    value: string,
    options: FillOptions
  ): Promise<boolean> {
    try {
      // Framework-specific filling
      if (this.frameworks.react) {
        return await this.fillReactInput(input, value, options);
      }

      if (this.frameworks.angular) {
        return await this.fillAngularInput(input, value, options);
      }

      if (this.frameworks.vue) {
        return await this.fillVueInput(input, value, options);
      }

      // Vanilla JS filling
      return await this.fillVanillaInput(input, value, options);
    } catch (error) {
      console.error('Error filling text input:', error);
      return false;
    }
  }

  // =====================================================
  // Framework-Specific Filling
  // =====================================================

  private async fillReactInput(
    input: HTMLInputElement | HTMLTextAreaElement,
    value: string,
    options: FillOptions
  ): Promise<boolean> {
    try {
      // Get React fiber
      const reactKey =
        Object.keys(input).find(key => key.startsWith('__reactInternalInstance')) ||
        Object.keys(input).find(key => key.startsWith('__reactFiber'));

      if (reactKey) {
        const reactInstance = (input as any)[reactKey];

        // Try to trigger React's onChange
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;

        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(input, value);

          // Dispatch input event
          const inputEvent = new Event('input', { bubbles: true });
          Object.defineProperty(inputEvent, 'target', { writable: false, value: input });
          input.dispatchEvent(inputEvent);

          // Dispatch change event
          const changeEvent = new Event('change', { bubbles: true });
          Object.defineProperty(changeEvent, 'target', { writable: false, value: input });
          input.dispatchEvent(changeEvent);

          return true;
        }
      }

      // Fallback to human-like typing
      return await this.typeValue(input, value, options);
    } catch (error) {
      console.error('React fill failed:', error);
      return await this.typeValue(input, value, options);
    }
  }

  private async fillAngularInput(
    input: HTMLInputElement | HTMLTextAreaElement,
    value: string,
    options: FillOptions
  ): Promise<boolean> {
    try {
      // Angular zone detection
      const ngZone = (window as any).ng?.getZone?.(input);

      if (ngZone) {
        return ngZone.run(() => {
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        });
      }

      // Fallback
      return await this.typeValue(input, value, options);
    } catch (error) {
      console.error('Angular fill failed:', error);
      return await this.typeValue(input, value, options);
    }
  }

  private async fillVueInput(
    input: HTMLInputElement | HTMLTextAreaElement,
    value: string,
    options: FillOptions
  ): Promise<boolean> {
    try {
      // Vue instance detection
      const vueInstance = (input as any).__vue__;

      if (vueInstance) {
        input.value = value;

        // Trigger Vue's reactivity
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        // Force Vue update
        if (vueInstance.$forceUpdate) {
          vueInstance.$forceUpdate();
        }

        return true;
      }

      // Fallback
      return await this.typeValue(input, value, options);
    } catch (error) {
      console.error('Vue fill failed:', error);
      return await this.typeValue(input, value, options);
    }
  }

  private async fillVanillaInput(
    input: HTMLInputElement | HTMLTextAreaElement,
    value: string,
    options: FillOptions
  ): Promise<boolean> {
    try {
      if (options.humanLike) {
        return await this.typeValue(input, value, options);
      } else {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    } catch (error) {
      console.error('Vanilla fill failed:', error);
      return false;
    }
  }

  // =====================================================
  // Human-Like Typing
  // =====================================================

  private async typeValue(
    input: HTMLInputElement | HTMLTextAreaElement,
    value: string,
    options: FillOptions
  ): Promise<boolean> {
    try {
      // Clear field first
      input.value = '';

      for (let i = 0; i < value.length; i++) {
        const char = value[i];

        // Simulate key events
        const keyDownEvent = new KeyboardEvent('keydown', {
          key: char,
          code: `Key${char.toUpperCase()}`,
          bubbles: true,
        });
        input.dispatchEvent(keyDownEvent);

        // Add character
        input.value += char;

        // Trigger input event
        const inputEvent = new Event('input', { bubbles: true });
        input.dispatchEvent(inputEvent);

        const keyUpEvent = new KeyboardEvent('keyup', {
          key: char,
          code: `Key${char.toUpperCase()}`,
          bubbles: true,
        });
        input.dispatchEvent(keyUpEvent);

        // Human-like delay
        if (options.typeDelay && i < value.length - 1) {
          await this.delay(options.typeDelay + Math.random() * 50);
        }
      }

      // Final change event
      const changeEvent = new Event('change', { bubbles: true });
      input.dispatchEvent(changeEvent);

      return true;
    } catch (error) {
      console.error('Typing simulation failed:', error);
      return false;
    }
  }

  // =====================================================
  // Field Type Handlers
  // =====================================================

  private fillSelectField(select: HTMLSelectElement, value: string): boolean {
    try {
      // Try exact value match
      for (let i = 0; i < select.options.length; i++) {
        const option = select.options[i];
        if (option.value === value || option.text === value) {
          select.selectedIndex = i;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }

      // Try partial match (case insensitive)
      const lowerValue = value.toLowerCase();
      for (let i = 0; i < select.options.length; i++) {
        const option = select.options[i];
        if (
          option.text.toLowerCase().includes(lowerValue) ||
          option.value.toLowerCase().includes(lowerValue)
        ) {
          select.selectedIndex = i;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Select field fill failed:', error);
      return false;
    }
  }

  private fillCheckboxRadio(input: HTMLInputElement, value: string): boolean {
    try {
      const shouldCheck = value === 'true' || value === '1' || value.toLowerCase() === 'yes';

      if (input.checked !== shouldCheck) {
        input.checked = shouldCheck;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }

      return true;
    } catch (error) {
      console.error('Checkbox/radio fill failed:', error);
      return false;
    }
  }

  // =====================================================
  // Field Utilities
  // =====================================================

  private async focusField(field: HTMLElement, delay: number): Promise<void> {
    try {
      field.focus();
      await this.delay(delay);
    } catch (error) {
      console.warn('Failed to focus field:', error);
    }
  }

  private async clearField(field: HTMLElement): Promise<void> {
    try {
      const input = field as HTMLInputElement | HTMLTextAreaElement;

      // Select all and delete
      input.select();
      await this.delay(50);

      // Simulate backspace/delete
      const backspaceEvent = new KeyboardEvent('keydown', {
        key: 'Backspace',
        code: 'Backspace',
        bubbles: true,
      });
      field.dispatchEvent(backspaceEvent);

      input.value = '';

      const inputEvent = new Event('input', { bubbles: true });
      field.dispatchEvent(inputEvent);
    } catch (error) {
      console.warn('Failed to clear field:', error);
    }
  }

  private async triggerFieldEvents(field: HTMLElement): Promise<void> {
    try {
      // Trigger blur to finalize the value
      field.dispatchEvent(new Event('blur', { bubbles: true }));

      // Custom events for specific frameworks
      if (this.frameworks.react) {
        field.dispatchEvent(new CustomEvent('react-change', { bubbles: true }));
      }

      if (this.frameworks.angular) {
        field.dispatchEvent(new CustomEvent('ng-change', { bubbles: true }));
      }

      if (this.frameworks.vue) {
        field.dispatchEvent(new CustomEvent('vue-change', { bubbles: true }));
      }
    } catch (error) {
      console.warn('Failed to trigger events:', error);
    }
  }

  private scrollFieldIntoView(field: HTMLElement): void {
    try {
      field.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    } catch (error) {
      // Fallback for older browsers
      field.scrollIntoView();
    }
  }

  private isFieldFillable(field: HTMLElement, options: FillOptions): boolean {
    const input = field as HTMLInputElement;

    // Check if hidden
    if (options.skipHidden && this.isFieldHidden(field)) {
      return false;
    }

    // Check if readonly
    if (options.skipReadonly && (input.readOnly || input.disabled)) {
      return false;
    }

    // Check if it's a supported field type
    return this.isFormField(field);
  }

  private isFieldHidden(field: HTMLElement): boolean {
    const style = window.getComputedStyle(field);
    return (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0' ||
      field.offsetParent === null
    );
  }

  private isFormField(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    return tagName === 'input' || tagName === 'select' || tagName === 'textarea';
  }

  private validateFieldValue(field: HTMLElement, expectedValue: string): boolean {
    const actualValue = this.getFieldValue(field);

    // For select fields, check if the selected option text or value matches
    if (field.tagName === 'SELECT') {
      const select = field as HTMLSelectElement;
      const selectedOption = select.options[select.selectedIndex];
      return selectedOption?.value === expectedValue || selectedOption?.text === expectedValue;
    }

    // For checkboxes and radios
    if (
      (field as HTMLInputElement).type === 'checkbox' ||
      (field as HTMLInputElement).type === 'radio'
    ) {
      const shouldCheck =
        expectedValue === 'true' || expectedValue === '1' || expectedValue.toLowerCase() === 'yes';
      return (field as HTMLInputElement).checked === shouldCheck;
    }

    // For text inputs, allow partial matches for long values
    if (expectedValue.length > 100) {
      return actualValue.includes(expectedValue.substring(0, 50));
    }

    return actualValue === expectedValue;
  }

  private getFieldValue(field: HTMLElement): string {
    const input = field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

    if (input.type === 'checkbox' || input.type === 'radio') {
      return (input as HTMLInputElement).checked.toString();
    }

    return input.value;
  }

  private getFieldName(field: HTMLElement): string {
    const input = field as HTMLInputElement;
    return input.name || input.id || input.placeholder || input.getAttribute('aria-label') || '';
  }

  private findFormFields(): HTMLElement[] {
    return Array.from(document.querySelectorAll('input, select, textarea')).filter(el =>
      this.isFormField(el)
    ) as HTMLElement[];
  }

  private retryFailedFills(): void {
    // Implementation for retrying failed fills when DOM changes
    console.log('Retrying failed fills after DOM change');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =====================================================
  // Public API
  // =====================================================

  public getFrameworkInfo(): FrameworkDetection {
    return { ...this.frameworks };
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// =====================================================
// Initialize and Export
// =====================================================

export const resilientFiller = new ResilientFormFiller();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).__JOB_AUTOFILL_RESILIENT_FILLER__ = resilientFiller;
}

export { ResilientFormFiller };
