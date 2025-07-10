import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';

export interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    // Validate URL parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
      return;
    }

    next();
  };
};

// Common validation schemas
export const schemas = {
  // User authentication schemas
  register: {
    body: Joi.object({
      email: Joi.string().email().required().max(255),
      password: Joi.string().min(8).max(128).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required()
        .messages({
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }),
      firstName: Joi.string().min(1).max(50).required(),
      lastName: Joi.string().min(1).max(50).required()
    })
  },

  login: {
    body: Joi.object({
      email: Joi.string().email().required().max(255),
      password: Joi.string().required().max(128)
    })
  },

  // Profile schemas
  updateProfile: {
    body: Joi.object({
      firstName: Joi.string().min(1).max(50).optional(),
      lastName: Joi.string().min(1).max(50).optional(),
      email: Joi.string().email().max(255).optional(),
      phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).max(20).optional(),
      location: Joi.string().max(100).optional(),
      title: Joi.string().max(100).optional(),
      summary: Joi.string().max(2000).optional(),
      experience: Joi.array().items(
        Joi.object({
          company: Joi.string().max(100).required(),
          position: Joi.string().max(100).required(),
          startDate: Joi.date().required(),
          endDate: Joi.date().optional().allow(null),
          description: Joi.string().max(1000).optional(),
          current: Joi.boolean().optional()
        })
      ).max(20).optional(),
      education: Joi.array().items(
        Joi.object({
          institution: Joi.string().max(100).required(),
          degree: Joi.string().max(100).required(),
          field: Joi.string().max(100).optional(),
          startDate: Joi.date().required(),
          endDate: Joi.date().optional().allow(null),
          gpa: Joi.number().min(0).max(4).optional(),
          current: Joi.boolean().optional()
        })
      ).max(10).optional(),
      skills: Joi.array().items(Joi.string().max(50)).max(50).optional(),
      certifications: Joi.array().items(
        Joi.object({
          name: Joi.string().max(100).required(),
          issuer: Joi.string().max(100).required(),
          date: Joi.date().required(),
          expiryDate: Joi.date().optional().allow(null),
          credentialId: Joi.string().max(100).optional()
        })
      ).max(20).optional()
    })
  },

  // AI service schemas
  analyzeJob: {
    body: Joi.object({
      jobDescription: Joi.string().min(10).max(10000).required(),
      jobTitle: Joi.string().min(1).max(200).required(),
      company: Joi.string().min(1).max(100).required(),
      location: Joi.string().max(100).optional(),
      requirements: Joi.array().items(Joi.string().max(200)).max(50).optional(),
      benefits: Joi.array().items(Joi.string().max(200)).max(20).optional()
    })
  },

  generateResponse: {
    body: Joi.object({
      prompt: Joi.string().min(10).max(1000).required(),
      jobDescription: Joi.string().min(10).max(10000).required(),
      responseType: Joi.string().valid('cover_letter', 'personal_statement', 'why_interested', 'experience', 'skills', 'custom').required(),
      templateId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
      tone: Joi.string().valid('professional', 'casual', 'enthusiastic', 'formal').default('professional').optional(),
      length: Joi.string().valid('short', 'medium', 'long').default('medium').optional()
    })
  },

  // Template schemas
  createTemplate: {
    body: Joi.object({
      name: Joi.string().min(1).max(100).required(),
      description: Joi.string().max(500).optional(),
      content: Joi.string().min(10).max(5000).required(),
      category: Joi.string().valid('cover_letter', 'personal_statement', 'why_interested', 'experience', 'skills', 'custom').required(),
      placeholders: Joi.array().items(
        Joi.object({
          key: Joi.string().pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/).required(),
          description: Joi.string().max(200).required(),
          type: Joi.string().valid('text', 'number', 'date', 'email', 'url').default('text').optional(),
          required: Joi.boolean().default(false).optional()
        })
      ).max(20).optional(),
      tags: Joi.array().items(Joi.string().max(30)).max(10).optional(),
      isPublic: Joi.boolean().default(false).optional(),
      industry: Joi.string().max(50).optional(),
      jobLevel: Joi.string().valid('entry', 'mid', 'senior', 'executive').optional()
    })
  },

  updateTemplate: {
    body: Joi.object({
      name: Joi.string().min(1).max(100).optional(),
      description: Joi.string().max(500).optional(),
      content: Joi.string().min(10).max(5000).optional(),
      category: Joi.string().valid('cover_letter', 'personal_statement', 'why_interested', 'experience', 'skills', 'custom').optional(),
      placeholders: Joi.array().items(
        Joi.object({
          key: Joi.string().pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/).required(),
          description: Joi.string().max(200).required(),
          type: Joi.string().valid('text', 'number', 'date', 'email', 'url').default('text').optional(),
          required: Joi.boolean().default(false).optional()
        })
      ).max(20).optional(),
      tags: Joi.array().items(Joi.string().max(30)).max(10).optional(),
      isPublic: Joi.boolean().optional(),
      industry: Joi.string().max(50).optional(),
      jobLevel: Joi.string().valid('entry', 'mid', 'senior', 'executive').optional()
    })
  },

  // Application schemas
  createApplication: {
    body: Joi.object({
      jobTitle: Joi.string().min(1).max(200).required(),
      company: Joi.string().min(1).max(100).required(),
      jobUrl: Joi.string().uri().max(500).optional(),
      location: Joi.string().max(100).optional(),
      jobDescription: Joi.string().max(10000).optional(),
      status: Joi.string().valid('applied', 'interview', 'rejected', 'offer', 'withdrawn').default('applied').optional(),
      appliedDate: Joi.date().default(Date.now).optional(),
      notes: Joi.string().max(2000).optional(),
      salary: Joi.object({
        min: Joi.number().min(0).optional(),
        max: Joi.number().min(0).optional(),
        currency: Joi.string().valid('USD', 'EUR', 'GBP', 'CAD', 'AUD').default('USD').optional()
      }).optional(),
      responses: Joi.object({
        coverLetter: Joi.string().max(5000).optional(),
        personalStatement: Joi.string().max(2000).optional(),
        whyInterested: Joi.string().max(1000).optional(),
        customQuestions: Joi.array().items(
          Joi.object({
            question: Joi.string().max(500).required(),
            answer: Joi.string().max(2000).required()
          })
        ).max(10).optional()
      }).optional()
    })
  },

  // Common parameter schemas
  mongoId: {
    params: Joi.object({
      id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
        .messages({
          'string.pattern.base': 'Invalid ID format'
        })
    })
  },

  pagination: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1).optional(),
      limit: Joi.number().integer().min(1).max(100).default(10).optional(),
      sort: Joi.string().max(50).optional(),
      search: Joi.string().max(100).optional()
    })
  }
};

// Sanitization helpers
export const sanitize = {
  html: (input: string): string => {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  sql: (input: string): string => {
    return input.replace(/['";\\]/g, '');
  },

  nosql: (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const sanitized: any = {};
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        continue; // Skip potentially dangerous keys
      }
      sanitized[key] = typeof obj[key] === 'object' ? sanitize.nosql(obj[key]) : obj[key];
    }
    return sanitized;
  }
};

export default { validate, schemas, sanitize };
