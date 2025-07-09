import express from 'express';
import { body } from 'express-validator';
import {
    analyzeJob,
    generateCoverLetter,
    generateResponse,
    optimizeResponse,
} from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All AI routes require authentication
router.use(authenticate);

// Job analysis validation
const jobAnalysisValidation = [
  body('jobTitle')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Job title is required'),
  body('jobDescription')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Job description must be at least 10 characters'),
  body('companyName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Company name cannot be empty'),
];

// Response generation validation
const responseValidation = [
  body('fieldType')
    .isIn(['coverLetter', 'summary', 'experience', 'skills', 'objective'])
    .withMessage('Invalid field type'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object'),
  body('tone')
    .optional()
    .isIn(['professional', 'casual', 'enthusiastic'])
    .withMessage('Invalid tone'),
  body('length')
    .optional()
    .isIn(['short', 'medium', 'long'])
    .withMessage('Invalid length'),
];

// Cover letter validation
const coverLetterValidation = [
  body('jobDetails')
    .isObject()
    .withMessage('Job details are required'),
  body('jobDetails.title')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Job title is required'),
  body('jobDetails.company')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Company name is required'),
  body('tone')
    .optional()
    .isIn(['professional', 'casual', 'enthusiastic'])
    .withMessage('Invalid tone'),
  body('length')
    .optional()
    .isIn(['short', 'medium', 'long'])
    .withMessage('Invalid length'),
];

// Response optimization validation
const optimizeValidation = [
  body('originalResponse')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Original response must be at least 10 characters'),
  body('improvementType')
    .isIn(['grammar', 'tone', 'length', 'relevance', 'all'])
    .withMessage('Invalid improvement type'),
  body('targetTone')
    .optional()
    .isIn(['professional', 'casual', 'enthusiastic'])
    .withMessage('Invalid target tone'),
];

// Routes
router.post('/analyze-job', jobAnalysisValidation, analyzeJob);
router.post('/generate-response', responseValidation, generateResponse);
router.post('/generate-cover-letter', coverLetterValidation, generateCoverLetter);
router.post('/optimize-response', optimizeValidation, optimizeResponse);

export default router;
