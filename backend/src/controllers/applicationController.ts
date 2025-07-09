import { Response } from 'express';
import { validationResult } from 'express-validator';
import Application from '../models/Application';
import { IAuthRequest, IApiResponse, IPaginatedResponse } from '../types';

// @desc    Get user applications
// @route   GET /api/applications
// @access  Private
export const getApplications = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      const response: IApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const company = req.query.company as string;

    const query: any = { userId: req.user._id };
    if (status) query.status = status;
    if (company) query['jobDetails.company'] = new RegExp(company, 'i');

    const total = await Application.countDocuments(query);
    const applications = await Application.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const response: IPaginatedResponse<any> = {
      success: true,
      message: 'Applications retrieved successfully',
      data: applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get applications error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error retrieving applications',
    };
    res.status(500).json(response);
  }
};

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private
export const getApplication = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      const response: IApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!application) {
      const response: IApiResponse = {
        success: false,
        message: 'Application not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: IApiResponse = {
      success: true,
      message: 'Application retrieved successfully',
      data: application,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get application error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error retrieving application',
    };
    res.status(500).json(response);
  }
};

// @desc    Create new application
// @route   POST /api/applications
// @access  Private
export const createApplication = async (req: IAuthRequest, res: Response): Promise<void> => {
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

    const application = new Application({
      userId: req.user._id,
      ...req.body,
    });

    await application.save();

    const response: IApiResponse = {
      success: true,
      message: 'Application created successfully',
      data: application,
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Create application error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error creating application',
    };
    res.status(500).json(response);
  }
};

// @desc    Update application
// @route   PUT /api/applications/:id
// @access  Private
export const updateApplication = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      const response: IApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!application) {
      const response: IApiResponse = {
        success: false,
        message: 'Application not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: IApiResponse = {
      success: true,
      message: 'Application updated successfully',
      data: application,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Update application error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error updating application',
    };
    res.status(500).json(response);
  }
};

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private
export const deleteApplication = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      const response: IApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!application) {
      const response: IApiResponse = {
        success: false,
        message: 'Application not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: IApiResponse = {
      success: true,
      message: 'Application deleted successfully',
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Delete application error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error deleting application',
    };
    res.status(500).json(response);
  }
};

// @desc    Get application statistics
// @route   GET /api/applications/stats
// @access  Private
export const getApplicationStats = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      const response: IApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    const stats = await Application.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const response: IApiResponse = {
      success: true,
      message: 'Application stats retrieved successfully',
      data: stats,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get application stats error:', error);
    const response: IApiResponse = {
      success: false,
      message: 'Server error retrieving application stats',
    };
    res.status(500).json(response);
  }
};
