import { Request, Response } from 'express';
import Promotion from '../models/Promotion';

// @desc    Get all promotions
// @route   GET /api/promotions
// @access  Private/Admin
export const getPromotions = async (req: Request, res: Response): Promise<void> => {
  try {
    const promotions = await Promotion.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: promotions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get active promotions (for customers)
// @route   GET /api/promotions/active
// @access  Public
export const getActivePromotions = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const promotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ endDate: 1 });

    // Filter out usage-exceeded promotions
    const valid = promotions.filter(
      (p) => p.usageLimit === 0 || p.usedCount < p.usageLimit
    );

    res.status(200).json({ success: true, data: valid });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get promotion by ID
// @route   GET /api/promotions/:id
// @access  Private/Admin
export const getPromotionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      res.status(404).json({ success: false, error: 'Promotion not found' });
      return;
    }
    res.status(200).json({ success: true, data: promotion });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create promotion
// @route   POST /api/promotions
// @access  Private/Admin
export const createPromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const promotion = await Promotion.create(req.body);
    res.status(201).json({ success: true, data: promotion });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update promotion
// @route   PUT /api/promotions/:id
// @access  Private/Admin
export const updatePromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!promotion) {
      res.status(404).json({ success: false, error: 'Promotion not found' });
      return;
    }
    res.status(200).json({ success: true, data: promotion });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete promotion
// @route   DELETE /api/promotions/:id
// @access  Private/Admin
export const deletePromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);
    if (!promotion) {
      res.status(404).json({ success: false, error: 'Promotion not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Promotion deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Validate promotion code
// @route   POST /api/promotions/validate
// @access  Private
export const validatePromoCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, orderAmount } = req.body;
    const now = new Date();

    const promotion = await Promotion.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (!promotion) {
      res.status(400).json({ success: false, error: 'Invalid or expired promotion code' });
      return;
    }

    if (promotion.usageLimit > 0 && promotion.usedCount >= promotion.usageLimit) {
      res.status(400).json({ success: false, error: 'Promotion code usage limit reached' });
      return;
    }

    if (orderAmount < promotion.minOrderAmount) {
      res.status(400).json({
        success: false,
        error: `Minimum order amount is LKR ${promotion.minOrderAmount}`,
      });
      return;
    }

    let discount = 0;
    if (promotion.type === 'percentage') {
      discount = (orderAmount * promotion.value) / 100;
      if (promotion.maxDiscount) {
        discount = Math.min(discount, promotion.maxDiscount);
      }
    } else {
      discount = promotion.value;
    }

    res.status(200).json({
      success: true,
      data: {
        code: promotion.code,
        description: promotion.description,
        type: promotion.type,
        value: promotion.value,
        discount: Math.round(discount * 100) / 100,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
