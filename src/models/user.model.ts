import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/user.types.js';
import { TimeUtils } from '../utils/time.utils.js';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  managerId?: string;
  managerName?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toJSON(): any;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: [true, 'Role is required'],
      default: UserRole.SALES_REP,
    },
    managerId: {
      type: String,
      ref: 'User',
      default: null,
    },
    managerName: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    collection: 'users', // Use the users collection name
    timestamps: false, // We'll handle timestamps manually with Saudi time
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Add custom timestamps with Saudi time
userSchema.add({
  createdAt: {
    type: Date,
    default: TimeUtils.getSaudiTime,
  },
  updatedAt: {
    type: Date,
    default: TimeUtils.getSaudiTime,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  const user = this as IUserDocument;

  // Update the updatedAt field with Saudi time
  user.updatedAt = TimeUtils.getSaudiTime();

  // Only hash password if it's modified
  if (!user.isModified('password')) return next();

  try {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    user.password = hashedPassword;
    next();
  } catch (error: any) {
    next(error);
  }
});

// Update timestamps before any update operation
userSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  this.set({ updatedAt: TimeUtils.getSaudiTime() });
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create indexes for better performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ managerId: 1 });
userSchema.index({ createdAt: -1 });

export const UserModel = mongoose.model<IUserDocument>('User', userSchema); 