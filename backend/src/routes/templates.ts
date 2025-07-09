import express from 'express';
import { body, param } from 'express-validator';
import {
    createTemplate,
    deleteTemplate,
    getPopularTemplates,
    getTemplate,
    getTemplates,
    rateTemplate,
    updateTemplate,
    useTemplate,
} from '../controllers/templateController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All template routes require authentication
router.use(authenticate);

// Template validation
const templateValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Template name must be between 1 and 100 characters'),
  body('category')
    .isIn(['cover_letter', 'personal_statement', 'why_interested', 'experience', 'skills', 'custom'])
    .withMessage('Invalid template category'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Template content must be between 1 and 5000 characters'),
  body('placeholders')
    .optional()
    .isArray()
    .withMessage('Placeholders must be an array'),
  body('placeholders.*.name')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Placeholder name is required'),
  body('placeholders.*.description')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Placeholder description is required'),
  body('placeholders.*.required')
    .optional()
    .isBoolean()
    .withMessage('Placeholder required must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Tag cannot be empty'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('metadata.industry')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Industry cannot be empty'),
  body('metadata.jobLevel')
    .optional()
    .isIn(['entry', 'mid', 'senior', 'executive'])
    .withMessage('Invalid job level'),
  body('metadata.jobType')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'freelance', 'internship'])
    .withMessage('Invalid job type'),
];

const ratingValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid template ID'),
];

// Routes
router.get('/', getTemplates);
router.get('/popular', getPopularTemplates);
router.get('/:id', idValidation, getTemplate);
router.post('/', templateValidation, createTemplate);
router.put('/:id', [...idValidation, ...templateValidation], updateTemplate);
router.delete('/:id', idValidation, deleteTemplate);
router.post('/:id/use', idValidation, useTemplate);
router.post('/:id/rate', [...idValidation, ...ratingValidation], rateTemplate);

export default router;
