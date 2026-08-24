import { Request, Response } from 'express';
import Payment from '../models/Payment';
import Order from '../models/Order';
import { AuthRequest } from '../types';
import { generateTransactionId } from '../utils/helpers';

// @desc    Get payment by order ID
// @route   GET /api/payments/order/:orderId
// @access  Private
export const getPaymentByOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payment = await Payment.findOne({ order: req.params.orderId }).populate('order', 'orderNumber total status');

    if (!payment) {
      res.status(404).json({ success: false, error: 'Payment not found' });
      return;
    }
    res.status(200).json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update payment status (mock payment processing)
// @route   PUT /api/payments/:id
// @access  Private/Admin
export const updatePaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      res.status(404).json({ success: false, error: 'Payment not found' });
      return;
    }

    payment.status = status;
    if (status === 'completed') {
      payment.paidAt = new Date();
      payment.transactionId = payment.transactionId || generateTransactionId();

      // Update order payment status
      await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'paid' });
    } else if (status === 'refunded') {
      await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'refunded' });
    }

    await payment.save();

    res.status(200).json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all payments (admin)
// @route   GET /api/payments
// @access  Private/Admin
export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const total = await Payment.countDocuments();
    const payments = await Payment.find()
      .populate('order', 'orderNumber total status customer')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
