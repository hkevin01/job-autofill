import { Response } from 'express';
import { validationResult } from 'express-validator';
import aiService from '../services/aiService';
import { IAuthRequest, IApiResponse, ICoverLetterRequest } from '../types';

// @desc    Analyze job posting
// @route   POST /api/ai/analyze-job
// @access  Private
export const analyzeJob = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: IApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg),
      };
      res.status(400).json(response);
      return;
    }

    const { jobTitle, jobDescription, companyName } = req.body;

    const analysis = await aiService.analyzeJob(jobTitle, jobDescription, companyName);

    // Calculate match score based on user profile
    let matchScore = 0;
    if (req.user?.profile) {
      const userSkills = req.user.profile.skills || [];
      const requiredSkills = analysis.requiredSkills;
      
      if (requiredSkills.length > 0) {
        const matchingSkills = userSkills.filter(skill => 
          requiredSkills.some(reqSkill => 
            reqSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(reqSkill.toLowerCase())
          )
        );
        matchScore = Math.round((matchingSkills.length / requiredSkills.length) * 100);
      }
    }

    const response: IApiResponse = {
      success: true,
      message: 'Job analysis completed successfully',
      data: {
        ...analysis,
        matchScore,
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Analyze job error:', error);
    const response: IApiResponse = {
      success: false,
      message: error.message || 'Server error during job analysis',
    };
    res.status(500).json(response);
  }
};

// @desc    Generate AI response for form fields
// @route   POST /api/ai/generate-response
// @access  Private
export const generateResponse = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: IApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg),
      };
      res.status(400).json(response);
      return;
    }

    if (!req.user?.profile) {
      const response: IApiResponse = {
        success: false,
        message: 'User profile is required for response generation',
      };
      res.status(400).json(response);
      return;
    }

    const { fieldType, context, tone, length } = req.body;

    const aiResponse = await aiService.generateResponse(
      fieldType,
      req.user.profile,
      context,
      { tone, length }
    );

    const response: IApiResponse = {
      success: true,
      message: 'Response generated successfully',
      data: aiResponse,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Generate response error:', error);
    const response: IApiResponse = {
      success: false,
      message: error.message || 'Server error during response generation',
    };
    res.status(500).json(response);
  }
};

// @desc    Generate personalized cover letter
// @route   POST /api/ai/generate-cover-letter
// @access  Private
export const generateCoverLetter = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: IApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg),
      };
      res.status(400).json(response);
      return;
    }

    if (!req.user?.profile) {
      const response: IApiResponse = {
        success: false,
        message: 'User profile is required for cover letter generation',
      };
      res.status(400).json(response);
      return;
    }

    const { jobDetails, tone, length } = req.body;

    const coverLetterRequest: ICoverLetterRequest = {
      jobDetails,
      userProfile: req.user.profile,
      tone,
      length,
    };

    const aiResponse = await aiService.generateCoverLetter(coverLetterRequest);

    const response: IApiResponse = {
      success: true,
      message: 'Cover letter generated successfully',
      data: aiResponse,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Generate cover letter error:', error);
    const response: IApiResponse = {
      success: false,
      message: error.message || 'Server error during cover letter generation',
    };
    res.status(500).json(response);
  }
};

// @desc    Optimize existing response
// @route   POST /api/ai/optimize-response
// @access  Private
export const optimizeResponse = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: IApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg),
      };
      res.status(400).json(response);
      return;
    }

    const { originalResponse, improvementType, targetTone } = req.body;

    const aiResponse = await aiService.optimizeResponse(
      originalResponse,
      improvementType,
      targetTone
    );

    const response: IApiResponse = {
      success: true,
      message: 'Response optimized successfully',
      data: aiResponse,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Optimize response error:', error);
    const response: IApiResponse = {
      success: false,
      message: error.message || 'Server error during response optimization',
    };
    res.status(500).json(response);
  }
};
