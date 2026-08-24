import { Request, Response } from 'express';
import Category from '../models/Category';
import FoodItem from '../models/FoodItem';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeOnly = req.query.active !== 'false';
    const query: any = {};
    if (activeOnly) query.isActive = true;

    const categories = await Category.find(query).sort({ sortOrder: 1, name: 1 });

    // Get item counts
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const itemCount = await FoodItem.countDocuments({ category: cat._id, isAvailable: true });
        return { ...cat.toObject(), itemCount };
      })
    );

    res.status(200).json({ success: true, data: categoriesWithCounts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }
    res.status(200).json({ success: true, data: category });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }
    res.status(200).json({ success: true, data: category });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if category has food items
    const itemCount = await FoodItem.countDocuments({ category: req.params.id });
    if (itemCount > 0) {
      res.status(400).json({
        success: false,
        error: `Cannot delete category with ${itemCount} food items. Remove or reassign them first.`,
      });
      return;
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
