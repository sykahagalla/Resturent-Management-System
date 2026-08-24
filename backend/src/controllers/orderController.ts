import { Request, Response } from 'express';
import Order from '../models/Order';
import FoodItem from '../models/FoodItem';
import Payment from '../models/Payment';
import Promotion from '../models/Promotion';
import Notification from '../models/Notification';
import { AuthRequest, OrderStatus } from '../types';
import {
  generateOrderNumber,
  generateVerificationCode,
  getVerificationExpiry,
  calculateOrderTotals,
  generateTransactionId,
} from '../utils/helpers';
import { config } from '../config';

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private/Customer
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, orderType, paymentMethod, deliveryAddress, specialInstructions, promotionCode } = req.body;

    // Validate delivery address for delivery orders
    if (orderType === 'delivery' && !deliveryAddress) {
      res.status(400).json({ success: false, error: 'Delivery address is required for delivery orders' });
      return;
    }

    // Fetch and validate food items
    const orderItems = [];
    for (const item of items) {
      const foodItem = await FoodItem.findById(item.foodItem);
      if (!foodItem) {
        res.status(400).json({ success: false, error: `Food item not found: ${item.foodItem}` });
        return;
      }
      if (!foodItem.isAvailable) {
        res.status(400).json({ success: false, error: `${foodItem.name} is currently unavailable` });
        return;
      }

      orderItems.push({
        foodItem: foodItem._id,
        name: foodItem.name,
        quantity: item.quantity,
        price: foodItem.price,
        subtotal: foodItem.price * item.quantity,
        specialInstructions: item.specialInstructions,
      });
    }

    // Calculate totals
    let discountAmount = 0;
    let promotionId = undefined;

    // Apply promotion if provided
    if (promotionCode) {
      const promotion = await Promotion.findOne({
        code: promotionCode.toUpperCase(),
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      });

      if (promotion) {
        const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
        if (subtotal >= promotion.minOrderAmount) {
          if (promotion.type === 'percentage') {
            discountAmount = (subtotal * promotion.value) / 100;
            if (promotion.maxDiscount) {
              discountAmount = Math.min(discountAmount, promotion.maxDiscount);
            }
          } else {
            discountAmount = promotion.value;
          }
          promotionId = promotion._id;

          // Increment usage
          promotion.usedCount += 1;
          await promotion.save();
        }
      }
    }

    const { subtotal, tax, discount, total } = calculateOrderTotals(orderItems, 0.05, discountAmount);

    // Generate order number and verification code
    const orderNumber = generateOrderNumber();
    const code = await generateVerificationCode();
    const verificationCodeExpiry = getVerificationExpiry(config.verificationCodeExpiryMinutes);

    // Calculate estimated prep time
    const estimatedPrepTime = Math.max(
      ...orderItems.map(() => 15), // default 15 min
      orderItems.reduce((sum, item) => sum + item.quantity * 3, 10) // rough estimate
    );

    // Create order
    const order = await Order.create({
      orderNumber,
      customer: req.user!._id,
      items: orderItems,
      subtotal,
      tax,
      discount,
      total,
      orderType,
      status: 'pending',
      verificationCode: code,
      verificationCodeExpiry,
      isVerified: false,
      verificationAttempts: 0,
      paymentMethod,
      paymentStatus: paymentMethod === 'online' ? 'paid' : 'pending',
      deliveryAddress,
      specialInstructions,
      estimatedPrepTime,
      promotion: promotionId,
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        updatedBy: req.user!._id,
        note: 'Order placed',
      }],
    });

    // Create payment record
    await Payment.create({
      order: order._id,
      amount: total,
      method: paymentMethod,
      status: paymentMethod === 'online' ? 'paid' : 'pending',
      transactionId: paymentMethod === 'online' ? generateTransactionId() : undefined,
      paidAt: paymentMethod === 'online' ? new Date() : undefined,
    });

    // Create notifications for admin and kitchen
    await Notification.create([
      {
        targetRole: 'admin',
        title: 'New Order Received',
        message: `Order ${orderNumber} placed by ${req.user!.firstName} ${req.user!.lastName} — LKR ${total.toFixed(2)}`,
        type: 'new_order',
        relatedOrder: order._id,
      },
      {
        targetRole: 'kitchen',
        title: 'New Order Received',
        message: `Order ${orderNumber} — ${orderItems.length} items — ${orderType}`,
        type: 'new_order',
        relatedOrder: order._id,
      },
    ]);

    // Populate for response
    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'firstName lastName email phone')
      .populate('items.foodItem', 'name image');

    // Return with verification code
    res.status(201).json({
      success: true,
      data: {
        order: populatedOrder,
        verificationCode: code, 
        message: `Your order ${orderNumber} has been placed. Verification code: ${code}`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all orders (admin/kitchen)
// @route   GET /api/orders
// @access  Private/Admin/Kitchen
export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const orderType = req.query.orderType as string;
    const search = req.query.search as string;

    const query: any = {};

    // Customers can only see their own orders
    if (req.user!.role === 'customer') {
      query.customer = req.user!._id;
    }

    if (status) query.status = status;
    if (orderType) query.orderType = orderType;
    if (req.query.isCleared !== undefined) {
      const isClearedReq = req.query.isCleared === 'true';
      if (isClearedReq) {
        query.isCleared = true;
      } else {
        query.isCleared = { $ne: true };
      }
    }
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customer', 'firstName lastName email phone')
      .populate('items.foodItem', 'name image')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone')
      .populate('items.foodItem', 'name image')
      .populate('promotion', 'code description type value');

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    // Customers can only view their own orders
    if (req.user!.role === 'customer' && order.customer._id.toString() !== req.user!._id.toString()) {
      res.status(403).json({ success: false, error: 'Not authorized to view this order' });
      return;
    }

    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get order by order number (for tracking)
// @route   GET /api/orders/track/:orderNumber
// @access  Private
export const getOrderByNumber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .populate('customer', 'firstName lastName')
      .populate('items.foodItem', 'name image');

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin/Kitchen
export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    // Validate status transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['accepted', 'cancelled'],
      accepted: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['completed'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[order.status as OrderStatus]?.includes(status)) {
      res.status(400).json({
        success: false,
        error: `Cannot transition from '${order.status}' to '${status}'`,
      });
      return;
    }

    // Require verification before completing
    if (status === 'completed' && !order.isVerified) {
      res.status(400).json({
        success: false,
        error: 'Order must be verified before completion',
      });
      return;
    }

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user!._id,
      note: note || `Status updated to ${status}`,
    });

    // Update payment status if completing
    if (status === 'completed' && order.paymentMethod === 'cash') {
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
      title: `Order ${order.orderNumber} Updated`,
      message: `Your order status has been updated to: ${status.replace(/_/g, ' ').toUpperCase()}`,
      type: 'status_update',
      relatedOrder: order._id,
    });

    const updatedOrder = await Order.findById(order._id)
      .populate('customer', 'firstName lastName email phone')
      .populate('items.foodItem', 'name image');

    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    // Customers can only cancel their own orders
    if (req.user!.role === 'customer' && order.customer.toString() !== req.user!._id.toString()) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    // Can only cancel if not already preparing/ready/completed
    const nonCancellable: OrderStatus[] = ['preparing', 'ready', 'completed', 'cancelled'];
    if (nonCancellable.includes(order.status as OrderStatus)) {
      res.status(400).json({
        success: false,
        error: `Cannot cancel order in '${order.status}' status`,
      });
      return;
    }

    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      updatedBy: req.user!._id,
      note: req.body.reason || 'Order cancelled',
    });

    await order.save();

    // Update payment
    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
      await order.save();
      await Payment.findOneAndUpdate(
        { order: order._id },
        { status: 'refunded' }
      );
    }

    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get customer's order history
// @route   GET /api/orders/my-orders
// @access  Private/Customer
export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const total = await Order.countDocuments({ customer: req.user!._id });
    const orders = await Order.find({ customer: req.user!._id })
      .populate('items.foodItem', 'name image price')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Clear order from live management (move to history)
// @route   PUT /api/orders/:id/clear
// @access  Private/Admin/Kitchen
export const clearOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    order.isCleared = true;
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
