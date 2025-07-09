import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IUserProfile, IPersonalInfo, IAddress, IExperience, IEducation, IPreferences } from '../types';

// Address schema
const AddressSchema = new Schema<IAddress>({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String, default: 'United States' },
});

// Personal Info schema
const PersonalInfoSchema = new Schema<IPersonalInfo>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  address: { type: AddressSchema },
  linkedinUrl: { type: String },
});

// Experience schema
const ExperienceSchema = new Schema<IExperience>({
  company: { type: String, required: true },
  position: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  description: { type: String },
  skills: [{ type: String }],
  isCurrent: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// Education schema
const EducationSchema = new Schema<IEducation>({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  field: { type: String },
  graduationDate: { type: Date },
  gpa: { type: Number },
}, {
  timestamps: true,
});

// Preferences schema
const PreferencesSchema = new Schema<IPreferences>({
  jobTypes: [{ type: String }],
  salaryRange: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'USD' },
  },
  locations: [{ type: String }],
  remoteWork: { type: Boolean, default: false },
  industries: [{ type: String }],
});

// User Profile schema
const UserProfileSchema = new Schema<IUserProfile>({
  personalInfo: { type: PersonalInfoSchema, required: true },
  experience: [ExperienceSchema],
  education: [EducationSchema],
  skills: [{ type: String }],
  preferences: { type: PreferencesSchema },
});

// User schema
const UserSchema = new Schema<IUser & Document>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  profile: {
    type: UserProfileSchema,
    required: true,
  },
}, {
  timestamps: true,
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Instance method to check password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile
UserSchema.methods.toPublicJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Static method to find by email
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

export default mongoose.model<IUser & Document>('User', UserSchema);
