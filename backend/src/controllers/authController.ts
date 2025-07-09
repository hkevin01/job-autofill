import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { IAuthRequest, ILoginRequest, IRegisterRequest, IAuthResponse, IApiResponse } from '../types';

// Generate JWT token
const generateToken = (userId: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<void> => {
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

    const { email, password, profile }: IRegisterRequest = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      const response: IAuthResponse = {
        success: false,
        message: 'User already exists with this email',
      };
      res.status(400).json(response);
      return;
    }

    // Create new user
    const user = new User({
      email,
      password,
      profile: profile || {
        personalInfo: {
          firstName: '',
          lastName: '',
        },
        experience: [],
        education: [],
        skills: [],
        preferences: {},
      },
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    const response: IAuthResponse = {
      success: true,
      message: 'User registered successfully',
      user: user.toPublicJSON(),
      token,
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Register error:', error);
    const response: IAuthResponse = {
      success: false,
      message: 'Server error during registration',
    };
    res.status(500).json(response);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
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

    const { email, password }: ILoginRequest = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      const response: IAuthResponse = {
        success: false,
        message: 'Invalid credentials',
      };
      res.status(401).json(response);
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      const response: IAuthResponse = {
        success: false,
        message: 'Invalid credentials',
      };
      res.status(401).json(response);
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString());

    const response: IAuthResponse = {
      success: true,
      message: 'Login successful',
      user: user.toPublicJSON(),
      token,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Login error:', error);
    const response: IAuthResponse = {
      success: false,
      message: 'Server error during login',
    };
    res.status(500).json(response);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      const response: IAuthResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: IAuthResponse = {
      success: true,
      message: 'Profile retrieved successfully',
      user: req.user,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get profile error:', error);
    const response: IAuthResponse = {
      success: false,
      message: 'Server error retrieving profile',
    };
    res.status(500).json(response);
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    // In a stateless JWT setup, logout is handled client-side by removing the token
    // This endpoint exists for consistency and potential future token blacklisting
    
    const response: IApiResponse = {
      success: true,
      message: 'Logout successful',
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Logout error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error during logout',
    };
    res.status(500).json(response);
  }
};
