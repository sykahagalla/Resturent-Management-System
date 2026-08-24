import { Request, Response } from 'express';
import Order from '../models/Order';
import Payment from '../models/Payment';
import Notification from '../models/Notification';
import { AuthRequest } from '../types';
import { verifyCode, isCodeExpired } from '../utils/helpers';

const MAX_VERIFICATION_ATTEMPTS = 5;

// @desc    Verify order with verification code
// @route   POST /api/orders/:id/verify
// @access  Private/Admin/Kitchen
export const verifyOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { verificationCode } = req.body;
    const orderId = req.params.id;

    // Fetch order with verification code
    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    // Check if already verified
    if (order.isVerified) {
      res.status(400).json({ success: false, error: 'Order has already been verified' });
      return;
    }

    // Check if order is in correct status
    if (order.status !== 'ready') {
      res.status(400).json({
        success: false,
        error: `Order must be ready before it can be verified and delivered (current status: ${order.status})`,
      });
      return;
    }

    // Check verification attempts
    if (order.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      // Auto-cancel after too many failed attempts
      order.status = 'cancelled';
      order.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        updatedBy: req.user!._id,
        note: 'Order cancelled due to too many failed verification attempts',
      });
      await order.save();

      res.status(400).json({
        success: false,
        error: 'Too many failed verification attempts. Order has been cancelled.',
      });
      return;
    }

    // Check if verification code has expired
    if (isCodeExpired(order.verificationCodeExpiry)) {
      order.status = 'cancelled';
      order.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: 'Order cancelled due to expired verification code',
      });
      await order.save();

      res.status(400).json({
        success: false,
        error: 'Verification code has expired. Order has been cancelled.',
      });
      return;
    }

    // Verify the code (server-side bcrypt comparison)
    const isValid = await verifyCode(verificationCode, order.verificationCode);

    if (!isValid) {
      order.verificationAttempts += 1;
      await order.save();

      const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - order.verificationAttempts;
      res.status(400).json({
        success: false,
        error: `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`,
      });
      return;
    }

    // Code is valid — verify the order and complete it
    order.isVerified = true;
    order.status = 'completed';
    order.statusHistory.push({
      status: 'completed',
      timestamp: new Date(),
      updatedBy: req.user!._id,
      note: 'Order verified and delivered',
    });
    
    // Update payment status if completing and it was cash
    if (order.paymentMethod === 'cash') {
      order.paymentStatus = 'paid';
      await Payment.findOneAndUpdate(
        { order: order._id },
        { status: 'completed', paidAt: new Date() }
      );
    }
    
    await order.save();

    // Create notification for customer
    await Notification.create({
      user: order.customer,
      title: `Order ${order.orderNumber} Delivered`,
      message: 'Your order has been verified and successfully delivered!',
      type: 'verification',
      relatedOrder: order._id,
    });

    const updatedOrder = await Order.findById(order._id)
      .populate('customer', 'firstName lastName email phone')
      .populate('items.foodItem', 'name image');

    res.status(200).json({
      success: true,
      message: 'Order verified and completed successfully',
      data: updatedOrder,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Check verification status
// @route   GET /api/orders/:id/verification-status
// @access  Private
export const getVerificationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).select(
      'orderNumber isVerified status verificationCodeExpiry verificationAttempts'
    );

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    const isExpired = isCodeExpired(order.verificationCodeExpiry);

    res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        isVerified: order.isVerified,
        status: order.status,
        isExpired,
        attemptsRemaining: Math.max(0, MAX_VERIFICATION_ATTEMPTS - order.verificationAttempts),
        expiresAt: order.verificationCodeExpiry,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
