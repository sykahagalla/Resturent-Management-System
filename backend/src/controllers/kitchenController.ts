import { Request, Response } from 'express';
import Order from '../models/Order';
import { AuthRequest, OrderStatus } from '../types';

// @desc    Get kitchen queue (active orders)
// @route   GET /api/kitchen/queue
// @access  Private/Kitchen
export const getKitchenQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activeStatuses: OrderStatus[] = ['pending', 'confirmed', 'accepted', 'preparing', 'ready'];

    const orders = await Order.find({ status: { $in: activeStatuses } })
      .populate('customer', 'firstName lastName phone')
      .populate('items.foodItem', 'name image prepTimeMinutes')
      .sort({ createdAt: 1 }); // FIFO - oldest first

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get kitchen order detail
// @route   GET /api/kitchen/orders/:id
// @access  Private/Kitchen
export const getKitchenOrderDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstName lastName phone')
      .populate('items.foodItem', 'name image prepTimeMinutes allergens');

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get completed orders today (kitchen history)
// @route   GET /api/kitchen/completed
// @access  Private/Kitchen
export const getCompletedToday = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      status: { $in: ['completed', 'cancelled'] },
      createdAt: { $gte: today },
    })
      .populate('customer', 'firstName lastName')
      .sort({ updatedAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
