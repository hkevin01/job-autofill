import mongoose, { Document, Model, Schema } from 'mongoose';
import { ITemplate } from '../types';

// Interface for Template document (without _id conflict)
interface ITemplateDoc extends Omit<ITemplate, '_id'>, Document {
  incrementUsage(): Promise<ITemplateDoc>;
  updateRating(rating: number): Promise<ITemplateDoc>;
}

// Interface for Template model static methods
interface ITemplateModel extends Model<ITemplateDoc> {
  findByCategory(userId: string, category: string): Promise<ITemplateDoc[]>;
  findPopular(category?: string): Promise<ITemplateDoc[]>;
  searchTemplates(userId: string, searchTerm: string): Promise<ITemplateDoc[]>;
}

const TemplateSchema = new Schema<ITemplateDoc>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  category: {
    type: String,
    required: true,
    enum: ['cover_letter', 'personal_statement', 'why_interested', 'experience', 'skills', 'custom'],
    index: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000,
  },
  placeholders: [{
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  isPublic: {
    type: Boolean,
    default: false,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  lastUsed: {
    type: Date,
    default: null,
  },
  metadata: {
    industry: String,
    jobLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'executive'],
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'],
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
TemplateSchema.index({ userId: 1, category: 1 });
TemplateSchema.index({ tags: 1 });
TemplateSchema.index({ isPublic: 1, rating: -1 });
TemplateSchema.index({ usageCount: -1 });

// Instance methods
TemplateSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

TemplateSchema.methods.updateRating = function(newRating: number) {
  this.rating = newRating;
  return this.save();
};

// Static methods
TemplateSchema.statics.findByCategory = function(userId: string, category: string) {
  return this.find({ 
    $or: [
      { userId, category },
      { isPublic: true, category }
    ]
  }).sort({ usageCount: -1, updatedAt: -1 });
};

TemplateSchema.statics.findPopular = function(category?: string) {
  const query: any = { isPublic: true };
  if (category) {
    query.category = category;
  }
  
  return this.find(query)
    .sort({ usageCount: -1, rating: -1 })
    .limit(20);
};

TemplateSchema.statics.searchTemplates = function(userId: string, searchTerm: string) {
  return this.find({
    $or: [
      { userId },
      { isPublic: true }
    ],
    $and: [
      {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { content: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      }
    ]
  }).sort({ usageCount: -1, updatedAt: -1 });
};

export default mongoose.model<ITemplateDoc, ITemplateModel>('Template', TemplateSchema);
