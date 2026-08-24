import mongoose, { Schema } from 'mongoose';
import { IFoodItem } from '../types';

const foodItemSchema = new Schema<IFoodItem>(
  {
    name: {
      type: String,
      required: [true, 'Food item name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    image: {
      type: String,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    allergens: [{
      type: String,
      enum: ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'fish', 'shellfish', 'sesame'],
    }],
    prepTimeMinutes: {
      type: Number,
      default: 15,
      min: [1, 'Prep time must be at least 1 minute'],
    },
    calories: {
      type: Number,
      min: [0, 'Calories cannot be negative'],
    },
    tags: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
foodItemSchema.index({ category: 1 });
foodItemSchema.index({ isAvailable: 1 });
foodItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Auto-generate slug from name
foodItemSchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

const FoodItem = mongoose.model<IFoodItem>('FoodItem', foodItemSchema);
export default FoodItem;
