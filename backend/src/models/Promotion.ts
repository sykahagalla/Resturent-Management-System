import mongoose, { Schema } from 'mongoose';
import { IPromotion } from '../types';

const promotionSchema = new Schema<IPromotion>(
  {
    code: {
      type: String,
      required: [true, 'Promotion code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'Code cannot exceed 20 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Promotion type is required'],
    },
    value: {
      type: Number,
      required: [true, 'Promotion value is required'],
      min: [0, 'Value cannot be negative'],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order amount cannot be negative'],
    },
    maxDiscount: {
      type: Number,
      min: [0, 'Max discount cannot be negative'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageLimit: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

promotionSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// Virtual to check if promotion is currently valid
promotionSchema.virtual('isValid').get(function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (this.usageLimit === 0 || this.usedCount < this.usageLimit)
  );
});

const Promotion = mongoose.model<IPromotion>('Promotion', promotionSchema);
export default Promotion;
