import { Request, Response } from 'express';
import FoodItem from '../models/FoodItem';

// @desc    Get all food items
// @route   GET /api/food-items
// @access  Public
export const getFoodItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const popular = req.query.popular as string;
    const available = req.query.available as string;

    const query: any = {};

    if (category) query.category = category;
    if (popular === 'true') query.isPopular = true;
    if (available !== 'false') query.isAvailable = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await FoodItem.countDocuments(query);
    const foodItems = await FoodItem.find(query)
      .populate('category', 'name slug')
      .skip(skip)
      .limit(limit)
      .sort({ isPopular: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: foodItems,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get food item by ID
// @route   GET /api/food-items/:id
// @access  Public
export const getFoodItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const foodItem = await FoodItem.findById(req.params.id).populate('category', 'name slug');
    if (!foodItem) {
      res.status(404).json({ success: false, error: 'Food item not found' });
      return;
    }
    res.status(200).json({ success: true, data: foodItem });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get food item by slug
// @route   GET /api/food-items/slug/:slug
// @access  Public
export const getFoodItemBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const foodItem = await FoodItem.findOne({ slug: req.params.slug }).populate('category', 'name slug');
    if (!foodItem) {
      res.status(404).json({ success: false, error: 'Food item not found' });
      return;
    }
    res.status(200).json({ success: true, data: foodItem });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create food item
// @route   POST /api/food-items
// @access  Private/Admin
export const createFoodItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const foodItem = await FoodItem.create(req.body);
    const populated = await foodItem.populate('category', 'name slug');
    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update food item
// @route   PUT /api/food-items/:id
// @access  Private/Admin
export const updateFoodItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const foodItem = await FoodItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug');

    if (!foodItem) {
      res.status(404).json({ success: false, error: 'Food item not found' });
      return;
    }
    res.status(200).json({ success: true, data: foodItem });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete food item
// @route   DELETE /api/food-items/:id
// @access  Private/Admin
export const deleteFoodItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const foodItem = await FoodItem.findByIdAndDelete(req.params.id);
    if (!foodItem) {
      res.status(404).json({ success: false, error: 'Food item not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Food item deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Toggle food item availability
// @route   PATCH /api/food-items/:id/availability
// @access  Private/Admin
export const toggleAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);
    if (!foodItem) {
      res.status(404).json({ success: false, error: 'Food item not found' });
      return;
    }

    foodItem.isAvailable = !foodItem.isAvailable;
    await foodItem.save();

    res.status(200).json({ success: true, data: foodItem });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
