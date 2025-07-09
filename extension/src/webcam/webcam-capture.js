// Webcam Capture JavaScript

class WebcamCapture {
  constructor() {
    this.video = document.getElementById('webcam-video');
    this.canvas = document.getElementById('capture-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.stream = null;
    this.devices = [];
    this.currentDeviceId = null;
    this.capturedImages = {
      left: null,
      right: null
    };
    
    this.initializeElements();
    this.setupEventListeners();
    this.loadCameraDevices();
  }

  initializeElements() {
    this.elements = {
      startCameraBtn: document.getElementById('start-camera-btn'),
      stopCameraBtn: document.getElementById('stop-camera-btn'),
      cameraSelect: document.getElementById('camera-select'),
      resolutionSelect: document.getElementById('resolution-select'),
      captureLeftBtn: document.getElementById('capture-left-btn'),
      captureRightBtn: document.getElementById('capture-right-btn'),
      countdownDisplay: document.getElementById('countdown-display'),
      countdownNumber: document.getElementById('countdown-number'),
      leftPreview: document.getElementById('left-preview'),
      rightPreview: document.getElementById('right-preview'),
      leftPreviewContainer: document.getElementById('left-preview-container'),
      rightPreviewContainer: document.getElementById('right-preview-container'),
      retakeLeftBtn: document.getElementById('retake-left-btn'),
      retakeRightBtn: document.getElementById('retake-right-btn'),
      deleteLeftBtn: document.getElementById('delete-left-btn'),
      deleteRightBtn: document.getElementById('delete-right-btn'),
      saveImagesBtn: document.getElementById('save-images-btn'),
      clearAllBtn: document.getElementById('clear-all-btn'),
      saveToProfile: document.getElementById('save-to-profile'),
      autoUseProfile: document.getElementById('auto-use-profile'),
      statusMessages: document.getElementById('status-messages'),
      backBtn: document.getElementById('back-btn')
    };
  }

  setupEventListeners() {
    this.elements.startCameraBtn.addEventListener('click', () => this.startCamera());
    this.elements.stopCameraBtn.addEventListener('click', () => this.stopCamera());
    this.elements.cameraSelect.addEventListener('change', () => this.switchCamera());
    this.elements.resolutionSelect.addEventListener('change', () => this.changeResolution());
    
    this.elements.captureLeftBtn.addEventListener('click', () => this.captureImage('left'));
    this.elements.captureRightBtn.addEventListener('click', () => this.captureImage('right'));
    
    this.elements.retakeLeftBtn.addEventListener('click', () => this.retakeImage('left'));
    this.elements.retakeRightBtn.addEventListener('click', () => this.retakeImage('right'));
    this.elements.deleteLeftBtn.addEventListener('click', () => this.deleteImage('left'));
    this.elements.deleteRightBtn.addEventListener('click', () => this.deleteImage('right'));
    
    this.elements.saveImagesBtn.addEventListener('click', () => this.saveImages());
    this.elements.clearAllBtn.addEventListener('click', () => this.clearAllImages());
    
    this.elements.backBtn.addEventListener('click', () => this.goBack());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        if (!this.capturedImages.left) {
          this.captureImage('left');
        } else if (!this.capturedImages.right) {
          this.captureImage('right');
        }
      }
    });
  }

  async loadCameraDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.devices = devices.filter(device => device.kind === 'videoinput');
      
      this.elements.cameraSelect.innerHTML = '<option value="">Select Camera...</option>';
      this.devices.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `Camera ${index + 1}`;
        this.elements.cameraSelect.appendChild(option);
      });
      
      if (this.devices.length > 0) {
        this.currentDeviceId = this.devices[0].deviceId;
        this.elements.cameraSelect.value = this.currentDeviceId;
      }
    } catch (error) {
      console.error('Error loading camera devices:', error);
      this.showMessage('Failed to load camera devices', 'error');
    }
  }

  async startCamera() {
    try {
      const resolution = this.elements.resolutionSelect.value.split('x');
      const constraints = {
        video: {
          deviceId: this.currentDeviceId ? { exact: this.currentDeviceId } : undefined,
          width: { ideal: parseInt(resolution[0]) },
          height: { ideal: parseInt(resolution[1]) }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      
      // Wait for video to load
      await new Promise(resolve => {
        this.video.onloadedmetadata = resolve;
      });
      
      // Setup canvas with video dimensions
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      
      this.elements.startCameraBtn.style.display = 'none';
      this.elements.stopCameraBtn.style.display = 'block';
      this.elements.captureLeftBtn.disabled = false;
      this.elements.captureRightBtn.disabled = false;
      
      this.showMessage('Camera started successfully', 'success');
    } catch (error) {
      console.error('Error starting camera:', error);
      this.showMessage('Failed to start camera. Please check permissions.', 'error');
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      this.video.srcObject = null;
    }
    
    this.elements.startCameraBtn.style.display = 'block';
    this.elements.stopCameraBtn.style.display = 'none';
    this.elements.captureLeftBtn.disabled = true;
    this.elements.captureRightBtn.disabled = true;
    
    this.showMessage('Camera stopped', 'success');
  }

  async switchCamera() {
    this.currentDeviceId = this.elements.cameraSelect.value;
    if (this.stream && this.currentDeviceId) {
      this.stopCamera();
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay
      this.startCamera();
    }
  }

  async changeResolution() {
    if (this.stream) {
      this.stopCamera();
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay
      this.startCamera();
    }
  }

  async captureImage(side) {
    if (!this.stream) {
      this.showMessage('Please start the camera first', 'warning');
      return;
    }

    // Show countdown
    await this.showCountdown();
    
    // Capture the image
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    const imageData = this.canvas.toDataURL('image/jpeg', 0.9);
    
    // Store the captured image
    this.capturedImages[side] = imageData;
    
    // Update preview
    this.updateImagePreview(side, imageData);
    
    // Update button states
    this.updateButtonStates();
    
    this.showMessage(`${side.charAt(0).toUpperCase() + side.slice(1)} image captured!`, 'success');
  }

  async showCountdown() {
    return new Promise(resolve => {
      this.elements.countdownDisplay.style.display = 'block';
      let count = 3;
      
      const countdownInterval = setInterval(() => {
        this.elements.countdownNumber.textContent = count;
        count--;
        
        if (count < 0) {
          clearInterval(countdownInterval);
          this.elements.countdownDisplay.style.display = 'none';
          resolve();
        }
      }, 1000);
    });
  }

  updateImagePreview(side, imageData) {
    const preview = this.elements[`${side}Preview`];
    const container = this.elements[`${side}PreviewContainer`];
    const placeholder = container.querySelector('.preview-placeholder');
    const actions = container.querySelector('.preview-actions');
    
    preview.src = imageData;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
    actions.style.display = 'flex';
    
    container.style.borderStyle = 'solid';
    container.style.borderColor = '#48bb78';
    container.style.backgroundColor = '#f0fff4';
  }

  retakeImage(side) {
    this.captureImage(side);
  }

  deleteImage(side) {
    this.capturedImages[side] = null;
    
    const preview = this.elements[`${side}Preview`];
    const container = this.elements[`${side}PreviewContainer`];
    const placeholder = container.querySelector('.preview-placeholder');
    const actions = container.querySelector('.preview-actions');
    
    preview.style.display = 'none';
    preview.src = '';
    placeholder.style.display = 'flex';
    actions.style.display = 'none';
    
    container.style.borderStyle = 'dashed';
    container.style.borderColor = '#e2e8f0';
    container.style.backgroundColor = 'transparent';
    
    this.updateButtonStates();
    this.showMessage(`${side.charAt(0).toUpperCase() + side.slice(1)} image deleted`, 'success');
  }

  clearAllImages() {
    this.deleteImage('left');
    this.deleteImage('right');
    this.showMessage('All images cleared', 'success');
  }

  updateButtonStates() {
    const hasLeftImage = this.capturedImages.left !== null;
    const hasRightImage = this.capturedImages.right !== null;
    const hasAnyImage = hasLeftImage || hasRightImage;
    
    this.elements.saveImagesBtn.disabled = !hasAnyImage;
    
    // Update capture button text based on what's already captured
    if (!hasLeftImage) {
      this.elements.captureLeftBtn.innerHTML = '<span class="icon">📸</span>Capture Left Image';
    } else {
      this.elements.captureLeftBtn.innerHTML = '<span class="icon">🔄</span>Retake Left Image';
    }
    
    if (!hasRightImage) {
      this.elements.captureRightBtn.innerHTML = '<span class="icon">📸</span>Capture Right Image';
    } else {
      this.elements.captureRightBtn.innerHTML = '<span class="icon">🔄</span>Retake Right Image';
    }
  }

  async saveImages() {
    const hasLeftImage = this.capturedImages.left !== null;
    const hasRightImage = this.capturedImages.right !== null;
    
    if (!hasLeftImage && !hasRightImage) {
      this.showMessage('No images to save', 'warning');
      return;
    }

    try {
      // Prepare image data for saving
      const imageData = {
        leftImage: this.capturedImages.left,
        rightImage: this.capturedImages.right,
        timestamp: new Date().toISOString(),
        metadata: {
          resolution: this.elements.resolutionSelect.value,
          deviceId: this.currentDeviceId,
          saveToProfile: this.elements.saveToProfile.checked,
          autoUseProfile: this.elements.autoUseProfile.checked
        }
      };

      // Save to local storage
      await this.saveToLocalStorage(imageData);
      
      // Save to backend if authenticated
      if (this.elements.saveToProfile.checked) {
        await this.saveToBackend(imageData);
      }
      
      this.showMessage('Images saved successfully!', 'success');
      
      // Option to clear after saving
      setTimeout(() => {
        if (confirm('Images saved! Would you like to clear the captured images?')) {
          this.clearAllImages();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error saving images:', error);
      this.showMessage('Failed to save images', 'error');
    }
  }

  async saveToLocalStorage(imageData) {
    try {
      // Get existing saved images
      const result = await chrome.storage.local.get(['capturedImages']);
      const existingImages = result.capturedImages || [];
      
      // Add new images
      existingImages.push(imageData);
      
      // Keep only last 10 image sets to avoid storage issues
      const limitedImages = existingImages.slice(-10);
      
      await chrome.storage.local.set({ capturedImages: limitedImages });
      console.log('Images saved to local storage');
    } catch (error) {
      console.error('Failed to save to local storage:', error);
      throw error;
    }
  }

  async saveToBackend(imageData) {
    try {
      // Check if user is authenticated
      const authResult = await chrome.storage.sync.get(['authToken']);
      if (!authResult.authToken) {
        console.log('Not authenticated, skipping backend save');
        return;
      }

      // Send to backend API
      const response = await fetch('http://localhost:3000/api/profile/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authResult.authToken}`
        },
        body: JSON.stringify({
          leftImage: imageData.leftImage,
          rightImage: imageData.rightImage,
          metadata: imageData.metadata
        })
      });

      if (!response.ok) {
        throw new Error(`Backend save failed: ${response.statusText}`);
      }

      console.log('Images saved to backend');
    } catch (error) {
      console.error('Failed to save to backend:', error);
      // Don't throw - local save is still successful
    }
  }

  showMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.className = `status-message ${type}`;
    messageElement.textContent = message;
    
    this.elements.statusMessages.appendChild(messageElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
      }
    }, 5000);
  }

  goBack() {
    // Return to main popup or close window
    if (window.opener) {
      window.close();
    } else {
      // Navigate back to popup
      window.location.href = '../popup/popup.html';
    }
  }

  // Cleanup when page unloads
  cleanup() {
    this.stopCamera();
  }
}

// Initialize webcam capture when page loads
document.addEventListener('DOMContentLoaded', () => {
  const webcamCapture = new WebcamCapture();
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    webcamCapture.cleanup();
  });
  
  // Make globally accessible for debugging
  window.webcamCapture = webcamCapture;
});

// Request camera permissions on page load
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    // Stop the stream immediately - we just wanted to trigger permission
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(error => {
    console.warn('Camera permission not granted:', error);
  });
