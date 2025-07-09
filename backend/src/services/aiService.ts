import OpenAI from 'openai';
import { IAIResponse, ICoverLetterRequest, IJobAnalysis, IUserProfile } from '../types';

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
}

export default new AIService();
