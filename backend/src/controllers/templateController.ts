import { Response } from 'express';
import { validationResult } from 'express-validator';
import Template from '../models/Template';
import { IApiResponse, IAuthRequest } from '../types';

// @desc    Get all user templates
// @route   GET /api/templates
// @access  Private
export const getTemplates = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { category, search, includePublic = 'true' } = req.query;
    
    let query: any = {};
    
    if (search) {
      const templates = await Template.searchTemplates(req.user!._id, search as string);
      const response: IApiResponse = {
        success: true,
        message: 'Templates retrieved successfully',
        data: {
          templates,
          total: templates.length,
        },
      };
      res.json(response);
      return;
    }

    if (category) {
      const templates = await Template.findByCategory(req.user!._id, category as string);
      const response: IApiResponse = {
        success: true,
        message: 'Templates retrieved successfully',
        data: {
          templates,
          total: templates.length,
        },
      };
      res.json(response);
      return;
    }

    // Default: get user's templates and optionally include public ones
    if (includePublic === 'true') {
      query = {
        $or: [
          { userId: req.user!._id },
          { isPublic: true }
        ]
      };
    } else {
      query = { userId: req.user!._id };
    }

    const templates = await Template.find(query)
      .sort({ usageCount: -1, updatedAt: -1 })
      .populate('userId', 'profile.personalInfo.firstName profile.personalInfo.lastName');

    const response: IApiResponse = {
      success: true,
      message: 'Templates retrieved successfully',
      data: {
        templates,
        total: templates.length,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching templates:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Failed to fetch templates',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
    res.status(500).json(response);
  }
};

// @desc    Get popular public templates
// @route   GET /api/templates/popular
// @access  Private
export const getPopularTemplates = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { category } = req.query;
    
    const templates = await Template.findPopular(category as string);

    const response: IApiResponse = {
      success: true,
      message: 'Popular templates retrieved successfully',
      data: {
        templates,
        total: templates.length,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching popular templates:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Failed to fetch popular templates',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
    res.status(500).json(response);
  }
};

// @desc    Get single template
// @route   GET /api/templates/:id
// @access  Private
export const getTemplate = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user!._id },
        { isPublic: true }
      ]
    }).populate('userId', 'profile.personalInfo.firstName profile.personalInfo.lastName');

    if (!template) {
      const response: IApiResponse = {
        success: false,
        message: 'Template not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: IApiResponse = {
      success: true,
      message: 'Template retrieved successfully',
      data: template,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching template:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Failed to fetch template',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
    res.status(500).json(response);
  }
};

// @desc    Create new template
// @route   POST /api/templates
// @access  Private
export const createTemplate = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
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

    const templateData = {
      ...req.body,
      userId: req.user!._id,
    };

    const template = new Template(templateData);
    await template.save();

    const response: IApiResponse = {
      success: true,
      message: 'Template created successfully',
      data: template,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating template:', error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      const response: IApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: [error.message],
      };
      res.status(400).json(response);
      return;
    }

    const response: IApiResponse = {
      success: false,
      message: 'Failed to create template',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
    res.status(500).json(response);
  }
};

// @desc    Update template
// @route   PUT /api/templates/:id
// @access  Private
export const updateTemplate = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
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

    const template = await Template.findOne({
      _id: req.params.id,
      userId: req.user!._id,
    });

    if (!template) {
      const response: IApiResponse = {
        success: false,
        message: 'Template not found or you do not have permission to update it',
      };
      res.status(404).json(response);
      return;
    }

    Object.assign(template, req.body);
    await template.save();

    const response: IApiResponse = {
      success: true,
      message: 'Template updated successfully',
      data: template,
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating template:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Failed to update template',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
    res.status(500).json(response);
  }
};

// @desc    Delete template
// @route   DELETE /api/templates/:id
// @access  Private
export const deleteTemplate = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      userId: req.user!._id,
    });

    if (!template) {
      const response: IApiResponse = {
        success: false,
        message: 'Template not found or you do not have permission to delete it',
      };
      res.status(404).json(response);
      return;
    }

    await Template.findByIdAndDelete(req.params.id);

    const response: IApiResponse = {
      success: true,
      message: 'Template deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting template:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Failed to delete template',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
    res.status(500).json(response);
  }
};

// @desc    Use template (increment usage count)
// @route   POST /api/templates/:id/use
// @access  Private
export const useTemplate = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user!._id },
        { isPublic: true }
      ]
    });

    if (!template) {
      const response: IApiResponse = {
        success: false,
        message: 'Template not found',
      };
      res.status(404).json(response);
      return;
    }

    await template.incrementUsage();

    const response: IApiResponse = {
      success: true,
      message: 'Template usage recorded successfully',
      data: template,
    };

    res.json(response);
  } catch (error) {
    console.error('Error recording template usage:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Failed to record template usage',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
    res.status(500).json(response);
  }
};

// @desc    Rate template
// @route   POST /api/templates/:id/rate
// @access  Private
export const rateTemplate = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
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

    const { rating } = req.body;
    
    const template = await Template.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user!._id },
        { isPublic: true }
      ]
    });

    if (!template) {
      const response: IApiResponse = {
        success: false,
        message: 'Template not found',
      };
      res.status(404).json(response);
      return;
    }

    await template.updateRating(rating);

    const response: IApiResponse = {
      success: true,
      message: 'Template rated successfully',
      data: template,
    };

    res.json(response);
  } catch (error) {
    console.error('Error rating template:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Failed to rate template',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
    res.status(500).json(response);
  }
};
