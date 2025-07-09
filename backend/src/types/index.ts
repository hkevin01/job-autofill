import { Request } from 'express';

// User types
export interface IUser {
  _id: string;
  email: string;
  password: string;
  profile: IUserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile {
  personalInfo: IPersonalInfo;
  experience: IExperience[];
  education: IEducation[];
  skills: string[];
  preferences: IPreferences;
}

export interface IPersonalInfo {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: IAddress;
  linkedinUrl?: string;
}

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface IExperience {
  _id?: string;
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  skills: string[];
  isCurrent?: boolean;
}

export interface IEducation {
  _id?: string;
  institution: string;
  degree: string;
  field?: string;
  graduationDate?: Date;
  gpa?: number;
}

export interface IPreferences {
  jobTypes?: string[];
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  locations?: string[];
  remoteWork?: boolean;
  industries?: string[];
}

// Application types
export interface IApplication {
  _id: string;
  userId: string;
  jobDetails: IJobDetails;
  applicationData: Record<string, any>;
  status: ApplicationStatus;
  appliedAt: Date;
  responses: IFieldResponse[];
  analytics?: {
    timeToComplete?: number;
    fieldsAutoFilled?: number;
    totalFields?: number;
    automationScore?: number;
    aiConfidenceAvg?: number;
    revisionCount?: number;
  };
  tracking?: {
    viewedAt?: Date;
    startedAt?: Date;
    submittedAt?: Date;
    lastModifiedAt?: Date;
    source?: string;
    referrer?: string;
  };
  feedback?: {
    userRating?: number;
    userComments?: string;
    aiAccuracy?: number;
    wouldRecommend?: boolean;
  };
  followUp?: {
    reminderDate?: Date;
    nextAction?: string;
    contactPerson?: string;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobDetails {
  title: string;
  company: string;
  url: string;
  description: string;
  requirements: string[];
  location?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  jobType?: string;
  industry?: string;
}

export interface IFieldResponse {
  field: string;
  fieldType: string;
  generatedResponse: string;
  finalResponse: string;
  confidence?: number;
}

export type ApplicationStatus = 'draft' | 'submitted' | 'in_review' | 'interview' | 'rejected' | 'accepted';

// AI types
export interface IJobAnalysis {
  title: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: string;
  jobType: string;
  industry: string;
  keyResponsibilities: string[];
  matchScore?: number;
  recommendations?: string[];
}

export interface IAIResponse {
  content: string;
  confidence: number;
  reasoning?: string;
  suggestions?: string[];
}

export interface ICoverLetterRequest {
  jobDetails: IJobDetails;
  userProfile: IUserProfile;
  tone?: 'professional' | 'casual' | 'enthusiastic';
  length?: 'short' | 'medium' | 'long';
}

// Auth types
export interface IAuthRequest extends Request {
  user?: IUser;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  profile?: Partial<IUserProfile>;
}

export interface IAuthResponse {
  success: boolean;
  message: string;
  user?: Omit<IUser, 'password'>;
  token?: string;
}

// API Response types
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: string[];
}

export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Validation types
export interface IValidationError {
  field: string;
  message: string;
  value?: any;
}

// OpenAI types
export interface IOpenAIRequest {
  prompt: string;
  context?: Record<string, any>;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface IOpenAIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export interface IAdvancedJobAnalysis extends IJobAnalysis {
  skillMatch: {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    recommendedSkills: string[];
  };
  fitScore: number;
  advancedRecommendations: {
    improvementAreas: string[];
    strengthsToHighlight: string[];
    experienceGaps: string[];
  };
}

export interface ISmartSuggestions {
  skillRecommendations: string[];
  careerPaths: string[];
  resumeImprovements: string[];
  marketInsights: string[];
}

// Template types
export interface ITemplate {
  _id?: string;
  userId: any; // mongoose ObjectId
  name: string;
  category: 'cover_letter' | 'personal_statement' | 'why_interested' | 'experience' | 'skills' | 'custom';
  content: string;
  placeholders: {
    name: string;
    description: string;
    required: boolean;
  }[];
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  rating?: number;
  lastUsed?: Date;
  metadata?: {
    industry?: string;
    jobLevel?: 'entry' | 'mid' | 'senior' | 'executive';
    jobType?: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';
  };
  createdAt: Date;
  updatedAt: Date;
}
