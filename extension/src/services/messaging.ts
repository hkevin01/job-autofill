/**
 * Job AutoFill - Enhanced Message Passing System
 * Robust communication between popup, content scripts, and background service worker
 */

// Declare chrome for extension context
declare const chrome: any;

console.log('Job AutoFill Message System loaded');

// =====================================================
// Message Types and Interfaces
// =====================================================

export interface BaseMessage {
  type: string;
  timestamp: number;
  requestId: string;
  source: 'popup' | 'content' | 'background';
  target?: 'popup' | 'content' | 'background' | 'all';
}

export interface FormDetectionMessage extends BaseMessage {
  type: 'FORM_DETECTION_REQUEST' | 'FORM_DETECTION_RESPONSE';
  data?: {
    forms: any[];
    fields: any[];
    platform: string;
    confidence: number;
  };
  error?: string;
}

export interface AutoFillMessage extends BaseMessage {
  type: 'AUTO_FILL_REQUEST' | 'AUTO_FILL_RESPONSE' | 'AUTO_FILL_STATUS';
  data?: {
    fieldMappings: Record<string, string>;
    status: 'started' | 'completed' | 'error';
    progress: number;
    filledFields: number;
    totalFields: number;
  };
  error?: string;
}

export interface DebugMessage extends BaseMessage {
  type: 'DEBUG_TOGGLE' | 'DEBUG_HIGHLIGHT' | 'DEBUG_EXPORT';
  data?: {
    enabled: boolean;
    highlightFields: boolean;
    exportData?: any;
  };
}

export interface StatusMessage extends BaseMessage {
  type: 'STATUS_UPDATE' | 'STATUS_REQUEST';
  data?: {
    isActive: boolean;
    formsDetected: number;
    currentPlatform: string;
    lastScan: string;
  };
}

export type Message = FormDetectionMessage | AutoFillMessage | DebugMessage | StatusMessage;

// =====================================================
// Enhanced Message Handler
// =====================================================

class MessageHandler {
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (error: any) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  private messageListeners = new Map<string, ((message: Message) => void | Promise<any>)[]>();
  private isContentScript: boolean;
  private retryAttempts = 3;
  private timeout = 10000; // 10 seconds

  constructor() {
    this.isContentScript = typeof window !== 'undefined' && !!window.location;
    this.init();
  }

  private init(): void {
    // Listen for messages
    if (chrome?.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    }

    // Handle connection errors
    if (chrome?.runtime?.onConnect) {
      chrome.runtime.onConnect.addListener((port: any) => {
        port.onDisconnect.addListener(() => {
          if (chrome.runtime.lastError) {
            console.warn('Chrome extension context invalidated:', chrome.runtime.lastError);
          }
        });
      });
    }
  }

  // =====================================================
  // Message Sending with Retry Logic
  // =====================================================

  public async sendMessage<T = any>(
    message: Omit<Message, 'timestamp' | 'requestId' | 'source'>,
    tabId?: number
  ): Promise<T> {
    const fullMessage: Message = {
      ...message,
      timestamp: Date.now(),
      requestId: this.generateRequestId(),
      source: this.isContentScript ? 'content' : 'popup',
    } as Message;

    return this.sendWithRetry(fullMessage, tabId);
  }

  private async sendWithRetry<T>(message: Message, tabId?: number): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.attemptSend<T>(message, tabId);
      } catch (error) {
        lastError = error;
        console.warn(`Message send attempt ${attempt} failed:`, error);

        // Wait before retry (exponential backoff)
        if (attempt < this.retryAttempts) {
          await this.delay(Math.pow(2, attempt) * 500);
        }
      }
    }

    throw new Error(`Failed to send message after ${this.retryAttempts} attempts: ${lastError}`);
  }

  private async attemptSend<T>(message: Message, tabId?: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(message.requestId);
        reject(new Error('Message timeout'));
      }, this.timeout);

      // Store pending request
      this.pendingRequests.set(message.requestId, {
        resolve: response => {
          clearTimeout(timeoutId);
          resolve(response);
        },
        reject: error => {
          clearTimeout(timeoutId);
          reject(error);
        },
        timeout: timeoutId,
      });

      try {
        if (tabId) {
          // Send to specific tab
          chrome.tabs.sendMessage(
            tabId,
            message,
            this.handleResponse.bind(this, message.requestId)
          );
        } else if (this.isContentScript) {
          // Send from content script to background/popup
          chrome.runtime.sendMessage(message, this.handleResponse.bind(this, message.requestId));
        } else {
          // Send from popup/background to active tab
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(
                tabs[0].id,
                message,
                this.handleResponse.bind(this, message.requestId)
              );
            } else {
              this.pendingRequests.get(message.requestId)?.reject(new Error('No active tab found'));
            }
          });
        }
      } catch (error) {
        this.pendingRequests.get(message.requestId)?.reject(error);
      }
    });
  }

  private handleResponse(requestId: string, response: any): void {
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      this.pendingRequests.delete(requestId);

      if (chrome.runtime.lastError) {
        pending.reject(chrome.runtime.lastError);
      } else if (response?.error) {
        pending.reject(new Error(response.error));
      } else {
        pending.resolve(response);
      }
    }
  }

  // =====================================================
  // Message Receiving and Handling
  // =====================================================

  private async handleMessage(
    message: Message,
    sender: any,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      // Handle responses to pending requests
      if (this.pendingRequests.has(message.requestId)) {
        this.handleResponse(message.requestId, message);
        return;
      }

      // Handle new messages
      const listeners = this.messageListeners.get(message.type) || [];

      if (listeners.length === 0) {
        console.warn(`No listeners for message type: ${message.type}`);
        sendResponse({ error: `No handler for message type: ${message.type}` });
        return;
      }

      // Execute all listeners
      const responses = await Promise.all(
        listeners.map(async listener => {
          try {
            return await listener(message);
          } catch (error) {
            console.error(`Error in message listener for ${message.type}:`, error);
            return { error: error instanceof Error ? error.message : String(error) };
          }
        })
      );

      // Send back the first non-undefined response
      const response = responses.find(r => r !== undefined);
      sendResponse(response || { success: true });
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error instanceof Error ? error.message : String(error) });
    }
  }

  // =====================================================
  // Event Registration
  // =====================================================

  public onMessage<T extends Message>(
    type: T['type'],
    handler: (message: T) => void | Promise<any>
  ): void {
    if (!this.messageListeners.has(type)) {
      this.messageListeners.set(type, []);
    }
    this.messageListeners.get(type)!.push(handler as any);
  }

  public offMessage(type: string, handler?: Function): void {
    if (!handler) {
      this.messageListeners.delete(type);
    } else {
      const listeners = this.messageListeners.get(type) || [];
      const index = listeners.indexOf(handler as any);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // =====================================================
  // Utility Methods
  // =====================================================

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getStats(): {
    pendingRequests: number;
    registeredListeners: number;
    messageTypes: string[];
  } {
    return {
      pendingRequests: this.pendingRequests.size,
      registeredListeners: Array.from(this.messageListeners.values()).reduce(
        (sum, arr) => sum + arr.length,
        0
      ),
      messageTypes: Array.from(this.messageListeners.keys()),
    };
  }

  public clearPendingRequests(): void {
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('Cleared pending requests'));
    });
    this.pendingRequests.clear();
  }
}

// =====================================================
// High-Level Message API
// =====================================================

class JobAutoFillMessenger {
  private handler: MessageHandler;

  constructor() {
    this.handler = new MessageHandler();
    this.setupCommonHandlers();
  }

  private setupCommonHandlers(): void {
    // Status updates
    this.handler.onMessage('STATUS_REQUEST', async () => {
      if (typeof window !== 'undefined' && (window as any).__JOB_AUTOFILL_FORM_DETECTOR__) {
        const detector = (window as any).__JOB_AUTOFILL_FORM_DETECTOR__;
        const forms = detector.getDetectedForms();

        return {
          type: 'STATUS_UPDATE',
          data: {
            isActive: forms.length > 0,
            formsDetected: forms.length,
            currentPlatform: forms[0]?.platform || 'Unknown',
            lastScan: new Date().toISOString(),
          },
        };
      }

      return {
        type: 'STATUS_UPDATE',
        data: {
          isActive: false,
          formsDetected: 0,
          currentPlatform: 'Unknown',
          lastScan: new Date().toISOString(),
        },
      };
    });
  }

  // =====================================================
  // Form Detection API
  // =====================================================

  public async requestFormDetection(tabId?: number): Promise<any> {
    return this.handler.sendMessage(
      {
        type: 'FORM_DETECTION_REQUEST',
        target: 'content',
      },
      tabId
    );
  }

  public onFormDetectionRequest(handler: (message: FormDetectionMessage) => any): void {
    this.handler.onMessage('FORM_DETECTION_REQUEST', async (message: FormDetectionMessage) => {
      try {
        const result = await handler(message);
        return {
          type: 'FORM_DETECTION_RESPONSE',
          data: result,
          requestId: message.requestId,
        };
      } catch (error) {
        return {
          type: 'FORM_DETECTION_RESPONSE',
          error: error instanceof Error ? error.message : String(error),
          requestId: message.requestId,
        };
      }
    });
  }

  // =====================================================
  // Auto-Fill API
  // =====================================================

  public async requestAutoFill(
    fieldMappings: Record<string, string>,
    tabId?: number
  ): Promise<any> {
    return this.handler.sendMessage(
      {
        type: 'AUTO_FILL_REQUEST',
        target: 'content',
        data: { fieldMappings, status: 'started', progress: 0, filledFields: 0, totalFields: 0 },
      },
      tabId
    );
  }

  public onAutoFillRequest(handler: (message: AutoFillMessage) => any): void {
    this.handler.onMessage('AUTO_FILL_REQUEST', handler);
  }

  public sendAutoFillStatus(
    status: 'started' | 'completed' | 'error',
    progress: number,
    filledFields: number,
    totalFields: number
  ): void {
    this.handler
      .sendMessage({
        type: 'AUTO_FILL_STATUS',
        target: 'popup',
        data: { fieldMappings: {}, status, progress, filledFields, totalFields },
      })
      .catch(console.warn);
  }

  // =====================================================
  // Debug API
  // =====================================================

  public async toggleDebug(enabled: boolean, tabId?: number): Promise<any> {
    return this.handler.sendMessage(
      {
        type: 'DEBUG_TOGGLE',
        target: 'content',
        data: { enabled, highlightFields: enabled },
      },
      tabId
    );
  }

  public onDebugToggle(handler: (message: DebugMessage) => any): void {
    this.handler.onMessage('DEBUG_TOGGLE', handler);
  }

  // =====================================================
  // Status API
  // =====================================================

  public async getStatus(tabId?: number): Promise<any> {
    return this.handler.sendMessage(
      {
        type: 'STATUS_REQUEST',
        target: 'content',
      },
      tabId
    );
  }

  public onStatusRequest(handler: (message: StatusMessage) => any): void {
    this.handler.onMessage('STATUS_REQUEST', handler);
  }

  // =====================================================
  // Utility Methods
  // =====================================================

  public getMessageStats(): any {
    return this.handler.getStats();
  }

  public clearPendingRequests(): void {
    this.handler.clearPendingRequests();
  }
}

// =====================================================
// Initialize and Export
// =====================================================

// Create singleton instance
export const messenger = new JobAutoFillMessenger();

// Make available for debugging
if (typeof window !== 'undefined') {
  (window as any).__JOB_AUTOFILL_MESSENGER__ = messenger;
}

export { JobAutoFillMessenger, MessageHandler };
