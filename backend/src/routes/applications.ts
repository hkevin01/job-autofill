import express from 'express';
import { body, param, query } from 'express-validator';
import {
    createApplication,
    deleteApplication,
    getApplication,
    getApplicationAnalytics,
    getApplications,
    getApplicationStats,
    updateApplication,
    updateApplicationFeedback,
} from '../controllers/applicationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All application routes require authentication
router.use(authenticate);

// Application validation
const applicationValidation = [
  body('jobDetails.title')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Job title is required'),
  body('jobDetails.company')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Company name is required'),
  body('jobDetails.url')
    .isURL()
    .withMessage('Valid job URL is required'),
  body('jobDetails.description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Job description must be at least 10 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'submitted', 'in_review', 'interview', 'rejected', 'accepted'])
    .withMessage('Invalid status'),
];

// Query validation
const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['draft', 'submitted', 'in_review', 'interview', 'rejected', 'accepted'])
    .withMessage('Invalid status filter'),
  query('company')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Company filter cannot be empty'),
];

// Routes
router.get('/', queryValidation, getApplications);
router.get('/stats', getApplicationStats);
router.get('/:id', param('id').isMongoId(), getApplication);
router.post('/', applicationValidation, createApplication);
router.put('/:id', param('id').isMongoId(), applicationValidation, updateApplication);
router.delete('/:id', param('id').isMongoId(), deleteApplication);
router.get('/:id/analytics', param('id').isMongoId(), getApplicationAnalytics);
router.put('/:id/feedback', param('id').isMongoId(), updateApplicationFeedback);

export default router;
