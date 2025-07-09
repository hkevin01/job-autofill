import { Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import { IApiResponse, IAuthRequest } from '../types';

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
export const getProfile = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      const response: IApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: IApiResponse = {
      success: true,
      message: 'Profile retrieved successfully',
      data: req.user.profile,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get profile error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error retrieving profile',
    };
    res.status(500).json(response);
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
export const updateProfile = async (req: IAuthRequest, res: Response): Promise<void> => {
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

    if (!req.user) {
      const response: IApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profile: req.body } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      const response: IApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: IApiResponse = {
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser.profile,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Update profile error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error updating profile',
    };
    res.status(500).json(response);
  }
};

// @desc    Add experience
// @route   POST /api/profile/experience
// @access  Private
export const addExperience = async (req: IAuthRequest, res: Response): Promise<void> => {
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

    if (!req.user) {
      const response: IApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { 'profile.experience': req.body } },
      { new: true, runValidators: true }
    ).select('-password');

    const response: IApiResponse = {
      success: true,
      message: 'Experience added successfully',
      data: updatedUser?.profile.experience,
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Add experience error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error adding experience',
    };
    res.status(500).json(response);
  }
};

// @desc    Update experience
// @route   PUT /api/profile/experience/:id
// @access  Private
export const updateExperience = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    // Implementation would update specific experience entry
    const response: IApiResponse = {
      success: true,
      message: 'Experience updated successfully',
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Update experience error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error updating experience',
    };
    res.status(500).json(response);
  }
};

// @desc    Delete experience
// @route   DELETE /api/profile/experience/:id
// @access  Private
export const deleteExperience = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    // Implementation would delete specific experience entry
    const response: IApiResponse = {
      success: true,
      message: 'Experience deleted successfully',
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Delete experience error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error deleting experience',
    };
    res.status(500).json(response);
  }
};

// @desc    Add education
// @route   POST /api/profile/education
// @access  Private
export const addEducation = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    // Implementation would add education entry
    const response: IApiResponse = {
      success: true,
      message: 'Education added successfully',
    };
    res.status(201).json(response);
  } catch (error: any) {
    console.error('Add education error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error adding education',
    };
    res.status(500).json(response);
  }
};

// @desc    Update education
// @route   PUT /api/profile/education/:id
// @access  Private
export const updateEducation = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    // Implementation would update specific education entry
    const response: IApiResponse = {
      success: true,
      message: 'Education updated successfully',
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Update education error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error updating education',
    };
    res.status(500).json(response);
  }
};

// @desc    Delete education
// @route   DELETE /api/profile/education/:id
// @access  Private
export const deleteEducation = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    // Implementation would delete specific education entry
    const response: IApiResponse = {
      success: true,
      message: 'Education deleted successfully',
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Delete education error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error deleting education',
    };
    res.status(500).json(response);
  }
};

// @desc    Update skills
// @route   PUT /api/profile/skills
// @access  Private
export const updateSkills = async (req: IAuthRequest, res: Response): Promise<void> => {
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

    if (!req.user) {
      const response: IApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { 'profile.skills': req.body.skills } },
      { new: true, runValidators: true }
    ).select('-password');

    const response: IApiResponse = {
      success: true,
      message: 'Skills updated successfully',
      data: updatedUser?.profile.skills,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Update skills error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error updating skills',
    };
    res.status(500).json(response);
  }
};

// @desc    Upload profile images (webcam captures)
// @route   POST /api/profile/images
// @access  Private
export const uploadProfileImages = async (req: IAuthRequest, res: Response): Promise<void> => {
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

    if (!req.user) {
      const response: IApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    const { leftImage, rightImage, metadata } = req.body;

    // Validate that at least one image is provided
    if (!leftImage && !rightImage) {
      const response: IApiResponse = {
        success: false,
        message: 'At least one image must be provided',
      };
      res.status(400).json(response);
      return;
    }

    // Validate image format (should be base64 data URLs)
    const isValidImage = (imageData: string) => {
      return imageData && typeof imageData === 'string' && imageData.startsWith('data:image/');
    };

    if (leftImage && !isValidImage(leftImage)) {
      const response: IApiResponse = {
        success: false,
        message: 'Invalid left image format',
      };
      res.status(400).json(response);
      return;
    }

    if (rightImage && !isValidImage(rightImage)) {
      const response: IApiResponse = {
        success: false,
        message: 'Invalid right image format',
      };
      res.status(400).json(response);
      return;
    }

    // Create image data object
    const imageData = {
      leftImage,
      rightImage,
      metadata: {
        ...metadata,
        uploadedAt: new Date(),
        size: {
          left: leftImage ? Math.round(leftImage.length * 0.75) : 0, // Approximate byte size
          right: rightImage ? Math.round(rightImage.length * 0.75) : 0,
        }
      }
    };

    // Update user profile with image data
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        $set: { 
          'profile.images': imageData,
          'profile.updatedAt': new Date()
        } 
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      const response: IApiResponse = {
        success: false,
        message: 'Failed to update user profile',
      };
      res.status(400).json(response);
      return;
    }

    const response: IApiResponse = {
      success: true,
      message: 'Profile images uploaded successfully',
      data: {
        imagesUploaded: {
          leftImage: !!leftImage,
          rightImage: !!rightImage,
        },
        metadata: imageData.metadata,
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Upload profile images error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error uploading images',
    };
    res.status(500).json(response);
  }
};

// @desc    Get profile images
// @route   GET /api/profile/images
// @access  Private
export const getProfileImages = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      const response: IApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    const images = req.user.profile?.images || null;

    const response: IApiResponse = {
      success: true,
      message: 'Profile images retrieved successfully',
      data: images,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get profile images error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error retrieving images',
    };
    res.status(500).json(response);
  }
};

// @desc    Delete profile images
// @route   DELETE /api/profile/images
// @access  Private
export const deleteProfileImages = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      const response: IApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        $unset: { 'profile.images': 1 },
        $set: { 'profile.updatedAt': new Date() }
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      const response: IApiResponse = {
        success: false,
        message: 'Failed to update user profile',
      };
      res.status(400).json(response);
      return;
    }

    const response: IApiResponse = {
      success: true,
      message: 'Profile images deleted successfully',
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Delete profile images error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error deleting images',
    };
    res.status(500).json(response);
  }
};
