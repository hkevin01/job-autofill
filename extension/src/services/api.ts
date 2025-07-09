// API service for backend communication

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface UserProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
    gpa?: string;
  }>;
  skills: string[];
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
  }>;
  preferences: {
    jobTypes: string[];
    industries: string[];
    locations: string[];
    salaryRange: {
      min: number;
      max: number;
    };
    remote: boolean;
  };
}

class ApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.jobautofill.com/api' 
      : 'http://localhost:3000/api';
    this.loadAuthToken();
  }

  private async loadAuthToken(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(['authToken']);
      this.authToken = result.authToken || null;
    } catch (error) {
      console.warn('Failed to load auth token:', error);
    }
  }

  private async saveAuthToken(token: string): Promise<void> {
    this.authToken = token;
    try {
      await chrome.storage.sync.set({ authToken: token });
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  private async removeAuthToken(): Promise<void> {
    this.authToken = null;
    try {
      await chrome.storage.sync.remove(['authToken']);
    } catch (error) {
      console.error('Failed to remove auth token:', error);
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.removeAuthToken();
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Authentication methods
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<ApiResponse<{ token: string; user: any }>> {
    const response = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data?.token) {
      await this.saveAuthToken(response.data.token);
    }

    return response;
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ token: string; user: any }>> {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data?.token) {
      await this.saveAuthToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    await this.removeAuthToken();
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await this.request<{ token: string }>('/auth/refresh', {
      method: 'POST',
    });

    if (response.success && response.data?.token) {
      await this.saveAuthToken(response.data.token);
    }

    return response;
  }

  // Profile methods
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/profile');
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  // AI methods
  async analyzeJob(jobDescription: string): Promise<ApiResponse<any>> {
    return this.request('/ai/analyze-job', {
      method: 'POST',
      body: JSON.stringify({ jobDescription }),
    });
  }

  async analyzeJobAdvanced(jobDescription: string): Promise<ApiResponse<any>> {
    return this.request('/ai/analyze-job-advanced', {
      method: 'POST',
      body: JSON.stringify({ jobDescription }),
    });
  }

  async generateResponse(prompt: string, context?: any): Promise<ApiResponse<{ response: string }>> {
    return this.request('/ai/generate-response', {
      method: 'POST',
      body: JSON.stringify({ prompt, context }),
    });
  }

  async getSmartSuggestions(): Promise<ApiResponse<any>> {
    return this.request('/ai/smart-suggestions', {
      method: 'POST',
    });
  }

  // Template methods
  async getTemplates(filters?: {
    category?: string;
    search?: string;
    isPublic?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/templates${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getTemplate(id: string): Promise<ApiResponse<any>> {
    return this.request(`/templates/${id}`);
  }

  async createTemplate(template: {
    name: string;
    content: string;
    category: string;
    placeholders?: any[];
    tags?: string[];
    isPublic?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.request('/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  async updateTemplate(id: string, updates: any): Promise<ApiResponse<any>> {
    return this.request(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTemplate(id: string): Promise<ApiResponse<any>> {
    return this.request(`/templates/${id}`, {
      method: 'DELETE',
    });
  }

  async useTemplate(id: string): Promise<ApiResponse<any>> {
    return this.request(`/templates/${id}/use`, {
      method: 'POST',
    });
  }

  async rateTemplate(id: string, rating: number): Promise<ApiResponse<any>> {
    return this.request(`/templates/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  }

  async getPopularTemplates(): Promise<ApiResponse<any>> {
    return this.request('/templates/popular');
  }

  // Application methods
  async getApplications(filters?: {
    status?: string;
    company?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/applications${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async createApplication(application: {
    jobTitle: string;
    company: string;
    jobDescription?: string;
    applicationUrl?: string;
    status?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/applications', {
      method: 'POST',
      body: JSON.stringify(application),
    });
  }

  async updateApplication(id: string, updates: any): Promise<ApiResponse<any>> {
    return this.request(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getApplicationAnalytics(timeRange?: string): Promise<ApiResponse<any>> {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    return this.request(`/applications/analytics${params}`);
  }

  async submitApplicationFeedback(id: string, feedback: {
    satisfaction: number;
    aiAccuracy: number;
    timeEfficiency: number;
    wouldRecommend: boolean;
    comments?: string;
  }): Promise<ApiResponse<any>> {
    return this.request(`/applications/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  // Utility methods
  isAuthenticated(): boolean {
    return this.authToken !== null;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
