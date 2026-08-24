import { Request, Response } from 'express';
import Review from '../models/Review';
import Order from '../models/Order';
import { AuthRequest } from '../types';

// @desc    Create review
// @route   POST /api/reviews
// @access  Private/Customer
export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { order, foodItem, rating, comment } = req.body;

    // Check for duplicate review for this food item
    const existing = await Review.findOne({ customer: req.user!._id, foodItem });
    if (existing) {
      res.status(400).json({ success: false, error: 'You have already reviewed this product' });
      return;
    }

    const review = await Review.create({
      customer: req.user!._id,
      order,
      foodItem,
      rating,
      comment,
    });

    // Populate customer to return immediately for UI
    await review.populate('customer', 'firstName lastName');

    res.status(201).json({ success: true, data: review });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get reviews for a food item
// @route   GET /api/reviews/food/:foodItemId
// @access  Public
export const getFoodItemReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await Review.find({ foodItem: req.params.foodItemId })
      .populate('customer', 'firstName lastName')
      .sort({ createdAt: -1 });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.status(200).json({
      success: true,
      data: { reviews, averageRating: Math.round(avgRating * 10) / 10, totalReviews: reviews.length },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all reviews (admin)
// @route   GET /api/reviews
// @access  Private/Admin
export const getAllReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const total = await Review.countDocuments();
    const reviews = await Review.find()
      .populate('customer', 'firstName lastName')
      .populate('order', 'orderNumber')
      .populate('foodItem', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get logged in user reviews
// @route   GET /api/reviews/mine
// @access  Private/Customer
export const getMyReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviews = await Review.find({ customer: req.user!._id })
      .populate('foodItem', 'name image price')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private/Customer
export const updateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404).json({ success: false, error: 'Review not found' });
      return;
    }

    // Make sure user owns review
    if (review.customer.toString() !== req.user!._id.toString()) {
      res.status(401).json({ success: false, error: 'Not authorized to update this review' });
      return;
    }

    review.rating = rating || review.rating;
    review.comment = comment;

    await review.save();
    
    // Populate customer to return immediately for UI
    await review.populate('customer', 'firstName lastName');

    res.status(200).json({ success: true, data: review });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404).json({ success: false, error: 'Review not found' });
      return;
    }

    // Make sure user owns review or is admin
    if (review.customer.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      res.status(401).json({ success: false, error: 'Not authorized to delete this review' });
      return;
    }

    await review.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
