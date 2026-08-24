import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import Order from '../models/Order';
import { UserRole } from '../types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: UserRole;
}

// Track connected clients
const connectedClients = new Map<string, Set<string>>(); // userId -> Set of socketIds

export const setupSocketHandlers = (io: Server): void => {
  // JWT Authentication middleware for Socket.IO
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      // Allow unauthenticated connections for public tracking
      return next();
    }

    try {
      const decoded = jwt.verify(token as string, config.jwtSecret) as {
        id: string;
        role: UserRole;
      };
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Socket connected: ${socket.id} | User: ${socket.userId || 'anonymous'} | Role: ${socket.userRole || 'none'}`);

    // Track connected client
    if (socket.userId) {
      if (!connectedClients.has(socket.userId)) {
        connectedClients.set(socket.userId, new Set());
      }
      connectedClients.get(socket.userId)!.add(socket.id);
    }

    // Join role-based rooms
    if (socket.userRole === 'admin') {
      socket.join('admin');
      console.log(`Admin joined room: admin`);
    } else if (socket.userRole === 'kitchen') {
      socket.join('kitchen');
      console.log(`Kitchen staff joined room: kitchen`);
    }

    // Join user-specific room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // ============ Socket Events ============

    // Client requests to join order tracking room
    socket.on('join_order_room', (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`Socket ${socket.id} joined order room: ${orderId}`);
    });

    // Client leaves order tracking room
    socket.on('leave_order_room', (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    // Sync latest state on reconnect
    socket.on('sync_orders', async () => {
      try {
        if (socket.userRole === 'admin' || socket.userRole === 'kitchen') {
          // Send active orders for admin/kitchen
          const activeOrders = await Order.find({
            status: { $in: ['pending', 'confirmed', 'accepted', 'preparing', 'ready'] },
          })
            .populate('customer', 'firstName lastName phone')
            .populate('items.foodItem', 'name image')
            .sort({ createdAt: 1 });

          socket.emit('orders_synced', { orders: activeOrders });
        } else if (socket.userId) {
          // Send customer's active orders
          const myOrders = await Order.find({
            customer: socket.userId,
            status: { $nin: ['completed', 'cancelled'] },
          })
            .populate('items.foodItem', 'name image')
            .sort({ createdAt: -1 });

          socket.emit('orders_synced', { orders: myOrders });
        }
      } catch (error) {
        socket.emit('sync_error', { message: 'Failed to sync orders' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} | Reason: ${reason}`);

      if (socket.userId) {
        const userSockets = connectedClients.get(socket.userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            connectedClients.delete(socket.userId);
          }
        }
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });
};

// ============ Broadcast Functions (called from controllers) ============

/**
 * Broadcast new order to admin and kitchen dashboards
 */
export const broadcastNewOrder = (io: Server, order: any): void => {
  io.to('admin').emit('new_order', {
    order,
    timestamp: new Date(),
    message: `New order ${order.orderNumber} received`,
  });

  io.to('kitchen').emit('new_order', {
    order,
    timestamp: new Date(),
    message: `New order ${order.orderNumber} received`,
  });
};

/**
 * Broadcast order status update to customer, admin, and kitchen
 */
export const broadcastOrderStatusUpdate = (io: Server, order: any): void => {
  // To the specific customer
  io.to(`user:${order.customer._id || order.customer}`).emit('order_status_updated', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    timestamp: new Date(),
    message: `Order ${order.orderNumber} is now: ${order.status.replace(/_/g, ' ')}`,
  });

  // To the order room (anyone tracking this order)
  io.to(`order:${order._id}`).emit('order_status_updated', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    timestamp: new Date(),
  });

  // To admin and kitchen
  io.to('admin').emit('order_status_updated', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    timestamp: new Date(),
  });

  io.to('kitchen').emit('order_status_updated', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    timestamp: new Date(),
  });
};

/**
 * Broadcast order verification result
 */
export const broadcastOrderVerified = (io: Server, order: any): void => {
  io.to(`user:${order.customer._id || order.customer}`).emit('order_verified', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    isVerified: true,
    status: order.status,
    timestamp: new Date(),
    message: `Order ${order.orderNumber} has been verified and confirmed!`,
  });

  io.to('admin').emit('order_verified', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    timestamp: new Date(),
  });

  io.to('kitchen').emit('order_verified', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    timestamp: new Date(),
  });
};

/**
 * Broadcast notification
 */
export const broadcastNotification = (
  io: Server,
  notification: { userId?: string; targetRole?: string; title: string; message: string; type: string }
): void => {
  if (notification.userId) {
    io.to(`user:${notification.userId}`).emit('notification', notification);
  }
  if (notification.targetRole) {
    io.to(notification.targetRole).emit('notification', notification);
  }
};
