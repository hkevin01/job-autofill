import express from 'express';
import { body, param } from 'express-validator';
import {
    addEducation,
    addExperience,
    deleteEducation,
    deleteExperience,
    deleteProfileImages,
    getProfile,
    getProfileImages,
    updateEducation,
    updateExperience,
    updateProfile,
    updateSkills,
    uploadProfileImages,
} from '../controllers/profileController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All profile routes require authentication
router.use(authenticate);

// Profile validation
const profileValidation = [
  body('personalInfo.firstName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name cannot be empty'),
  body('personalInfo.lastName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name cannot be empty'),
  body('personalInfo.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('personalInfo.phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
];

// Experience validation
const experienceValidation = [
  body('company')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Company name is required'),
  body('position')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Position is required'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
];

// Education validation
const educationValidation = [
  body('institution')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Institution name is required'),
  body('degree')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Degree is required'),
  body('graduationDate')
    .optional()
    .isISO8601()
    .withMessage('Graduation date must be a valid date'),
];

// Image validation
const imageValidation = [
  body('leftImage')
    .optional()
    .isString()
    .custom((value) => {
      if (value && !value.startsWith('data:image/')) {
        throw new Error('Left image must be a valid base64 image data URL');
      }
      return true;
    }),
  body('rightImage')
    .optional()
    .isString()
    .custom((value) => {
      if (value && !value.startsWith('data:image/')) {
        throw new Error('Right image must be a valid base64 image data URL');
      }
      return true;
    }),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
];

// Routes
router.get('/', getProfile);
router.put('/', profileValidation, updateProfile);

// Experience routes
router.post('/experience', experienceValidation, addExperience);
router.put('/experience/:id', param('id').isMongoId(), experienceValidation, updateExperience);
router.delete('/experience/:id', param('id').isMongoId(), deleteExperience);

// Education routes
router.post('/education', educationValidation, addEducation);
router.put('/education/:id', param('id').isMongoId(), educationValidation, updateEducation);
router.delete('/education/:id', param('id').isMongoId(), deleteEducation);

// Skills routes
router.put('/skills', body('skills').isArray().withMessage('Skills must be an array'), updateSkills);

// Image routes
router.post('/images', imageValidation, uploadProfileImages);
router.get('/images', getProfileImages);
router.delete('/images', deleteProfileImages);

export default router;
