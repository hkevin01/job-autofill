import OpenAI from 'openai';
import { IAdvancedJobAnalysis, IAIResponse, ICoverLetterRequest, IJobAnalysis, ISmartSuggestions, IUserProfile } from '../types';

class AIService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not defined');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Analyze job posting and extract key information
  async analyzeJob(jobTitle: string, jobDescription: string, companyName?: string): Promise<IJobAnalysis> {
    try {
      const prompt = `
Analyze the following job posting and extract key information:

Job Title: ${jobTitle}
Company: ${companyName || 'Not specified'}
Job Description:
${jobDescription}

Please provide a structured analysis in the following JSON format:
{
  "title": "extracted job title",
  "company": "company name",
  "requiredSkills": ["skill1", "skill2", ...],
  "preferredSkills": ["skill1", "skill2", ...],
  "experienceLevel": "entry/mid/senior/executive",
  "jobType": "full-time/part-time/contract/freelance",
  "industry": "industry name",
  "keyResponsibilities": ["responsibility1", "responsibility2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...]
}

Focus on technical skills, soft skills, years of experience required, and key qualifications.
`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert job market analyst. Analyze job postings and extract key information in a structured format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        title: analysis.title || jobTitle,
        company: analysis.company || companyName || 'Unknown',
        requiredSkills: analysis.requiredSkills || [],
        preferredSkills: analysis.preferredSkills || [],
        experienceLevel: analysis.experienceLevel || 'mid',
        jobType: analysis.jobType || 'full-time',
        industry: analysis.industry || 'Unknown',
        keyResponsibilities: analysis.keyResponsibilities || [],
        recommendations: analysis.recommendations || [],
      };
    } catch (error) {
      console.error('Error analyzing job:', error);
      throw new Error('Failed to analyze job posting');
    }
  }

  // Advanced job analysis with skill matching
  async analyzeJobAdvanced(
    jobTitle: string, 
    jobDescription: string, 
    userProfile: IUserProfile,
    companyName?: string
  ): Promise<IAdvancedJobAnalysis> {
    try {
      const prompt = `
Analyze this job posting and provide detailed analysis including skill matching:

Job Title: ${jobTitle}
Company: ${companyName || 'Not specified'}
Job Description:
${jobDescription}

User Profile Skills: ${userProfile.skills?.join(', ') || 'None specified'}
User Experience Level: ${this.getExperienceLevel(userProfile)}
User Industry Background: ${this.getUserIndustries(userProfile)}

Provide analysis in this JSON format:
{
  "title": "extracted job title",
  "company": "company name",
  "requiredSkills": ["skill1", "skill2", ...],
  "preferredSkills": ["skill1", "skill2", ...],
  "experienceLevel": "entry/mid/senior/executive",
  "jobType": "full-time/part-time/contract/freelance",
  "industry": "industry name",
  "keyResponsibilities": ["responsibility1", "responsibility2", ...],
  "skillMatch": {
    "score": 85,
    "matchedSkills": ["skills user has that match"],
    "missingSkills": ["required skills user lacks"],
    "recommendedSkills": ["skills to learn for this role"]
  },
  "fitScore": 75,
  "recommendations": {
    "improvementAreas": ["areas user should improve"],
    "strengthsToHighlight": ["user's strengths relevant to this job"],
    "experienceGaps": ["experience gaps to address"]
  }
}

Provide numerical scores (0-100) for skillMatch.score and fitScore.
`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert career analyst with deep knowledge of job market trends, skill requirements, and career development. Provide detailed, actionable analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        title: analysis.title || jobTitle,
        company: analysis.company || companyName || 'Unknown',
        requiredSkills: analysis.requiredSkills || [],
        preferredSkills: analysis.preferredSkills || [],
        experienceLevel: analysis.experienceLevel || 'mid',
        jobType: analysis.jobType || 'full-time',
        industry: analysis.industry || 'Unknown',
        keyResponsibilities: analysis.keyResponsibilities || [],
        recommendations: analysis.basicRecommendations || [],
        skillMatch: analysis.skillMatch || {
          score: 0,
          matchedSkills: [],
          missingSkills: [],
          recommendedSkills: []
        },
        fitScore: analysis.fitScore || 0,
        advancedRecommendations: analysis.recommendations || {
          improvementAreas: [],
          strengthsToHighlight: [],
          experienceGaps: []
        }
      };
    } catch (error) {
      console.error('Error in advanced job analysis:', error);
      throw new Error('Failed to perform advanced job analysis');
    }
  }

  // Generate AI response for specific field types
  async generateResponse(
    fieldType: string,
    userProfile: IUserProfile,
    context?: any,
    options?: {
      tone?: 'professional' | 'casual' | 'enthusiastic';
      length?: 'short' | 'medium' | 'long';
    }
  ): Promise<IAIResponse> {
    try {
      const { tone = 'professional', length = 'medium' } = options || {};
      
      let prompt = this.buildPromptForFieldType(fieldType, userProfile, context, tone, length);

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert career counselor and professional writer. Generate high-quality, personalized responses for job applications.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: this.getMaxTokensForLength(length),
      });

      const content = response.choices[0].message.content || '';
      
      return {
        content: content.trim(),
        confidence: 0.85, // Could be calculated based on various factors
        reasoning: `Generated ${fieldType} response with ${tone} tone`,
        suggestions: this.generateSuggestions(fieldType),
      };
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  // Generate personalized cover letter
  async generateCoverLetter(request: ICoverLetterRequest): Promise<IAIResponse> {
    try {
      const { jobDetails, userProfile, tone = 'professional', length = 'medium' } = request;
      
      const prompt = `
Write a personalized cover letter for the following job application:

Job Details:
- Title: ${jobDetails.title}
- Company: ${jobDetails.company}
- Description: ${jobDetails.description}

Applicant Profile:
- Name: ${userProfile.personalInfo.firstName} ${userProfile.personalInfo.lastName}
- Experience: ${userProfile.experience.map(exp => `${exp.position} at ${exp.company}`).join(', ')}
- Skills: ${userProfile.skills.join(', ')}
- Education: ${userProfile.education.map(edu => `${edu.degree} from ${edu.institution}`).join(', ')}

Requirements:
- Tone: ${tone}
- Length: ${length}
- Personalize based on the job requirements and applicant's background
- Highlight relevant experience and skills
- Show enthusiasm for the role and company
- Professional formatting

Write a compelling cover letter that would make this candidate stand out.
`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert career counselor specializing in writing compelling cover letters that get results.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: this.getMaxTokensForLength(length),
      });

      const content = response.choices[0].message.content || '';
      
      return {
        content: content.trim(),
        confidence: 0.9,
        reasoning: 'Generated personalized cover letter based on job requirements and user profile',
        suggestions: [
          'Review and customize the opening paragraph',
          'Add specific examples of achievements',
          'Tailor the closing to the company culture',
        ],
      };
    } catch (error) {
      console.error('Error generating cover letter:', error);
      throw new Error('Failed to generate cover letter');
    }
  }

  // Optimize existing response
  async optimizeResponse(
    originalResponse: string,
    improvementType: 'grammar' | 'tone' | 'length' | 'relevance' | 'all',
    targetTone?: 'professional' | 'casual' | 'enthusiastic'
  ): Promise<IAIResponse> {
    try {
      let prompt = `
Improve the following response for a job application:

Original Response:
${originalResponse}

Improvement Type: ${improvementType}
`;

      if (targetTone) {
        prompt += `Target Tone: ${targetTone}\n`;
      }

      prompt += `
Please provide an improved version that addresses the specified improvement type while maintaining the core message and intent.
`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert editor and career counselor. Improve job application responses while maintaining authenticity.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 800,
      });

      const content = response.choices[0].message.content || '';
      
      return {
        content: content.trim(),
        confidence: 0.88,
        reasoning: `Optimized response for ${improvementType}`,
        suggestions: this.generateOptimizationSuggestions(improvementType),
      };
    } catch (error) {
      console.error('Error optimizing response:', error);
      throw new Error('Failed to optimize response');
    }
  }

  // Generate smart suggestions based on application history and job market trends
  async generateSmartSuggestions(
    userProfile: IUserProfile,
    recentApplications: any[] = [],
    targetIndustry?: string
  ): Promise<ISmartSuggestions> {
    try {
      const prompt = `
Based on the user's profile and application history, provide smart career suggestions:

User Profile:
- Skills: ${userProfile.skills?.join(', ') || 'None specified'}
- Experience: ${this.getFormattedExperience(userProfile)}
- Education: ${this.getFormattedEducation(userProfile)}
- Target Industry: ${targetIndustry || 'Not specified'}

Recent Applications: ${recentApplications.length} applications submitted
Application Success Rate: ${this.calculateSuccessRate(recentApplications)}%

Provide recommendations in this JSON format:
{
  "skillRecommendations": ["specific skills to learn based on market demand"],
  "careerPaths": ["potential career progression paths"],
  "resumeImprovements": ["specific improvements for resume/profile"],
  "marketInsights": ["current job market trends relevant to user"]
}

Focus on actionable, specific recommendations.
`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a senior career counselor with expertise in market trends, skill development, and career progression. Provide strategic, actionable advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const suggestions = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        skillRecommendations: suggestions.skillRecommendations || [],
        careerPaths: suggestions.careerPaths || [],
        resumeImprovements: suggestions.resumeImprovements || [],
        marketInsights: suggestions.marketInsights || []
      };
    } catch (error) {
      console.error('Error generating smart suggestions:', error);
      throw new Error('Failed to generate smart suggestions');
    }
  }

  // Private helper methods
  private buildPromptForFieldType(
    fieldType: string,
    userProfile: IUserProfile,
    context: any,
    tone: string,
    length: string
  ): string {
    const baseProfile = `
User Profile:
- Name: ${userProfile.personalInfo.firstName} ${userProfile.personalInfo.lastName}
- Experience: ${userProfile.experience.map(exp => `${exp.position} at ${exp.company}`).join(', ')}
- Skills: ${userProfile.skills.join(', ')}
- Education: ${userProfile.education.map(edu => `${edu.degree} from ${edu.institution}`).join(', ')}
`;

    switch (fieldType) {
      case 'summary':
        return `${baseProfile}
Write a professional summary for a job application with ${tone} tone and ${length} length.
Focus on key achievements, skills, and career highlights.`;

      case 'objective':
        return `${baseProfile}
Write a career objective statement with ${tone} tone and ${length} length.
Align with the job context: ${JSON.stringify(context)}`;

      case 'skills':
        return `${baseProfile}
Generate a skills summary with ${tone} tone and ${length} length.
Focus on technical and soft skills relevant to: ${JSON.stringify(context)}`;

      case 'experience':
        return `${baseProfile}
Write an experience description with ${tone} tone and ${length} length.
Context: ${JSON.stringify(context)}`;

      default:
        return `${baseProfile}
Generate content for ${fieldType} with ${tone} tone and ${length} length.
Context: ${JSON.stringify(context)}`;
    }
  }

  private getMaxTokensForLength(length: string): number {
    switch (length) {
      case 'short': return 200;
      case 'medium': return 500;
      case 'long': return 800;
      default: return 500;
    }
  }

  private generateSuggestions(fieldType: string): string[] {
    const suggestions: Record<string, string[]> = {
      summary: [
        'Include specific achievements with numbers',
        'Mention relevant technologies or tools',
        'Highlight leadership experience if applicable',
      ],
      objective: [
        'Align with company goals and values',
        'Mention specific role requirements',
        'Keep it concise and impactful',
      ],
      skills: [
        'Prioritize skills mentioned in job posting',
        'Include both technical and soft skills',
        'Provide proficiency levels if relevant',
      ],
      coverLetter: [
        'Research the company culture',
        'Include specific examples',
        'Show enthusiasm for the role',
      ],
    };

    return suggestions[fieldType] || ['Review for relevance', 'Check grammar and spelling', 'Ensure proper tone'];
  }

  private generateOptimizationSuggestions(improvementType: string): string[] {
    const suggestions: Record<string, string[]> = {
      grammar: [
        'Review punctuation and spelling',
        'Check sentence structure',
        'Ensure consistent tense usage',
      ],
      tone: [
        'Adjust formality level',
        'Enhance enthusiasm where appropriate',
        'Maintain professional standards',
      ],
      length: [
        'Balance detail with brevity',
        'Include most relevant information',
        'Remove redundant phrases',
      ],
      relevance: [
        'Align with job requirements',
        'Highlight matching skills',
        'Focus on applicable experience',
      ],
      all: [
        'Comprehensive review completed',
        'Check final version carefully',
        'Consider company-specific customization',
      ],
    };

    return suggestions[improvementType] || ['Review and refine as needed'];
  }

  // Helper methods for user profile analysis
  private getExperienceLevel(userProfile: IUserProfile): string {
    const experience = userProfile.experience || [];
    const totalYears = experience.reduce((total, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return total + years;
    }, 0);

    if (totalYears < 2) return 'entry';
    if (totalYears < 5) return 'mid';
    if (totalYears < 10) return 'senior';
    return 'executive';
  }

  private getUserIndustries(userProfile: IUserProfile): string {
    const experience = userProfile.experience || [];
    const industries = [...new Set(experience.map(exp => exp.company))];
    return industries.join(', ') || 'Various';
  }

  private getFormattedExperience(userProfile: IUserProfile): string {
    const experience = userProfile.experience || [];
    return experience.map(exp => 
      `${exp.position} at ${exp.company} (${this.formatDateRange(exp.startDate, exp.endDate)})`
    ).join('; ') || 'No experience specified';
  }

  private getFormattedEducation(userProfile: IUserProfile): string {
    const education = userProfile.education || [];
    return education.map(edu => 
      `${edu.degree} in ${edu.field} from ${edu.institution}`
    ).join('; ') || 'No education specified';
  }

  private formatDateRange(startDate: Date, endDate?: Date): string {
    const start = new Date(startDate).getFullYear();
    const end = endDate ? new Date(endDate).getFullYear() : 'Present';
    return `${start}-${end}`;
  }

  private calculateSuccessRate(applications: any[]): number {
    if (applications.length === 0) return 0;
    const successful = applications.filter(app => 
      app.status === 'interview' || app.status === 'offer' || app.status === 'hired'
    ).length;
    return Math.round((successful / applications.length) * 100);
  }
}

export default new AIService();
