import mongoose, { Document, Schema } from 'mongoose';
import { ApplicationStatus, IApplication, IFieldResponse, IJobDetails } from '../types';

// Job Details schema
const JobDetailsSchema = new Schema<IJobDetails>({
  title: { type: String, required: true },
  company: { type: String, required: true },
  url: { type: String, required: true },
  description: { type: String, required: true },
  requirements: [{ type: String }],
  location: { type: String },
  salary: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'USD' },
  },
  jobType: { type: String },
  industry: { type: String },
});

// Field Response schema
const FieldResponseSchema = new Schema<IFieldResponse>({
  field: { type: String, required: true },
  fieldType: { type: String, required: true },
  generatedResponse: { type: String, required: true },
  finalResponse: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 1 },
});

// Application schema
const ApplicationSchema = new Schema<IApplication & Document>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobDetails: {
    type: JobDetailsSchema,
    required: true,
  },
  applicationData: {
    type: Schema.Types.Mixed,
    default: {},
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'in_review', 'interview', 'rejected', 'accepted'],
    default: 'draft',
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  responses: [FieldResponseSchema],
}, {
  timestamps: true,
});

// Index for efficient queries
ApplicationSchema.index({ userId: 1, createdAt: -1 });
ApplicationSchema.index({ userId: 1, status: 1 });
ApplicationSchema.index({ 'jobDetails.company': 1 });

// Static method to get applications by user
ApplicationSchema.statics.findByUser = function (userId: string, status?: ApplicationStatus) {
  const query: any = { userId };
  if (status) {
    query.status = status;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to get application stats
ApplicationSchema.statics.getStats = function (userId: string) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);
};

export default mongoose.model<IApplication & Document>('Application', ApplicationSchema);
