import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import type { Order, OrderStatus } from '../types';
import { CheckCircle, Clock, ChefHat, Package, Truck, XCircle, Shield, Loader2, Check } from 'lucide-react';

const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode; step: number }> = {
  pending: { label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: <Clock className="h-5 w-5" />, step: 1 },
  confirmed: { label: 'Confirmed', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: <CheckCircle className="h-5 w-5" />, step: 2 },
  accepted: { label: 'Accepted', color: 'text-indigo-600', bgColor: 'bg-indigo-100', icon: <Clock className="h-5 w-5" />, step: 3 },
  preparing: { label: 'Preparing', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: <ChefHat className="h-5 w-5" />, step: 4 },
  ready: { label: 'Ready', color: 'text-green-600', bgColor: 'bg-green-100', icon: <Package className="h-5 w-5" />, step: 5 },
  completed: { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-200', icon: <Truck className="h-5 w-5" />, step: 6 },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-100', icon: <XCircle className="h-5 w-5" />, step: -1 },
};

const steps = ['Pending', 'Confirmed', 'Accepted', 'Preparing', 'Ready', 'Completed'];

const OrderTracking: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await orderAPI.getByNumber(orderNumber!);
        setOrder(res.data.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderNumber]);

  // Real-time status updates via WebSocket
  useEffect(() => {
    if (!socket || !order) return;

    socket.emit('join_order_room', order._id);

    const handleStatusUpdate = (data: any) => {
      if (data.orderNumber === orderNumber || data.orderId === order._id) {
        setOrder(prev => prev ? { ...prev, status: data.status } : prev);
      }
    };

    const handleOrderVerified = (data: any) => {
      if (data.orderNumber === orderNumber || data.orderId === order._id) {
        setOrder(prev => prev ? { ...prev, isVerified: true, status: data.status } : prev);
      }
    };

    socket.on('order_status_updated', handleStatusUpdate);
    socket.on('order_verified', handleOrderVerified);

    return () => {
      socket.off('order_status_updated', handleStatusUpdate);
      socket.off('order_verified', handleOrderVerified);
      socket.emit('leave_order_room', order._id);
    };
  }, [socket, order?._id, orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <XCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Order not found</h2>
      </div>
    );
  }

  const currentStatus = statusConfig[order.status];
  const currentStep = currentStatus.step;
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Order Tracking</h1>
        <p className="text-gray-500">Order #{order.orderNumber}</p>
      </div>

      {/* Current Status */}
      <div className={`${currentStatus.bgColor} rounded-2xl p-6 text-center mb-8`}>
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/80 ${currentStatus.color} mb-3`}>
          {currentStatus.icon}
        </div>
        <h2 className={`text-xl font-bold ${currentStatus.color}`}>{currentStatus.label}</h2>
        {order.status === 'pending' && (
          <p className="text-sm mt-2 text-yellow-700">Waiting for restaurant to confirm your order</p>
        )}
        {order.status === 'preparing' && (
          <p className="text-sm mt-2 text-orange-700">Your food is being prepared</p>
        )}
        {order.status === 'ready' && (
          <p className="text-sm mt-2 text-green-700">Your order is ready for pickup!</p>
        )}
      </div>

      {/* Verification Code Box */}
      {order.verificationCode && !isCancelled && order.status !== 'completed' && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center mb-8 shadow-sm">
          <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wider mb-2 flex justify-center items-center gap-2">
            <Shield className="w-4 h-4" /> Your Delivery Verification Code
          </h3>
          <p className="text-4xl font-mono font-bold text-orange-600 tracking-[0.25em]">{order.verificationCode}</p>
          <p className="text-xs text-orange-700 mt-3 font-medium">Provide this code to the restaurant or driver to receive your order.</p>
        </div>
      )}

      {/* Progress Stepper */}
      {!isCancelled && (
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full">
              <div className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100)}%` }} />
            </div>

            {steps.map((step, index) => {
              const stepNum = index + 1;
              const isActive = stepNum <= currentStep;
              const isCurrent = stepNum === currentStep;
              return (
                <div key={step} className="relative flex flex-col items-center z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isActive ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-200 text-gray-500'
                  } ${isCurrent ? 'ring-4 ring-orange-200 scale-110' : ''}`}>
                    {isActive ? <Check className="w-5 h-5" /> : stepNum}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${isActive ? 'text-orange-600' : 'text-gray-400'}`}>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <h3 className="font-bold text-gray-900 mb-4">Order Details</h3>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.quantity}x {item.name}</span>
                <span className="font-medium">LKR {item.subtotal.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <hr className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>LKR {order.subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>LKR {order.tax.toLocaleString()}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-LKR {order.discount.toLocaleString()}</span></div>}
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-orange-600">LKR {order.total.toLocaleString()}</span></div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-gray-50 p-6 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Order Type</span><span className="font-medium capitalize">{order.orderType}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-medium capitalize">{order.paymentMethod}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Verified</span><span className={`font-medium flex items-center gap-1 ${order.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>{order.isVerified ? <><Check className="w-4 h-4" /> Yes</> : <><Clock className="w-4 h-4" /> Pending</>}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Placed At</span><span className="font-medium">{new Date(order.createdAt).toLocaleString()}</span></div>
        </div>

        {/* Status History */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="p-6">
            <h4 className="font-bold text-gray-900 mb-3">Status History</h4>
            <div className="space-y-3">
              {order.statusHistory.map((entry, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium capitalize">{entry.status.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleString()}</p>
                    {entry.note && <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
