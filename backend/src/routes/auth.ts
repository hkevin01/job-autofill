import express from 'express';
import { body } from 'express-validator';
import { register, login, getProfile, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  body('profile.personalInfo.firstName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name is required'),
  body('profile.personalInfo.lastName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name is required'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, logout);

export default router;
