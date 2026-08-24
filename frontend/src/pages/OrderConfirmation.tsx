import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Copy, Clock, Shield, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { order, verificationCode } = (location.state as any) || {};

  if (!order || !verificationCode) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Order details not found.</p>
        <Link to="/orders" className="text-orange-600 font-semibold mt-4 inline-block">View My Orders</Link>
      </div>
    );
  }

  const copyCode = () => {
    navigator.clipboard.writeText(verificationCode);
    toast.success('Verification code copied!');
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed!</h1>
        <p className="text-gray-500">Your order has been received and is being processed</p>
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Order Number */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 text-center">
          <p className="text-sm font-medium text-orange-100 mb-1">Order Number</p>
          <p className="text-3xl font-bold tracking-wider">{order.orderNumber}</p>
        </div>

        {/* Verification Code - Critical Section */}
        <div className="p-6 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-yellow-600" />
            <h3 className="font-bold text-yellow-800">Verification Code</h3>
          </div>
          <p className="text-sm text-yellow-700 mb-3">
            Share this code with the restaurant staff to verify your order. Keep it safe!
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white border-2 border-yellow-400 rounded-xl px-4 py-3 text-center">
              <span className="text-3xl font-mono font-bold tracking-[0.3em] text-gray-900">{verificationCode}</span>
            </div>
            <button onClick={copyCode} className="p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-colors" title="Copy code">
              <Copy className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Code expires in 30 minutes
          </p>
        </div>

        {/* Order Info */}
        <div className="p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium text-xs">Pending Verification</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Order Type</span>
            <span className="font-medium capitalize">{order.orderType}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Payment</span>
            <span className="font-medium capitalize">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Items</span>
            <span className="font-medium">{order.items.length} item(s)</span>
          </div>
          <hr />
          <div className="flex justify-between">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-orange-600 text-lg">LKR {order.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-3">
        <button onClick={() => navigate(`/order-tracking/${order.orderNumber}`)}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg flex items-center justify-center gap-2">
          Track Order <ArrowRight className="h-5 w-5" />
        </button>
        <Link to="/orders" className="block text-center text-orange-600 hover:text-orange-700 font-medium py-2">
          View All Orders
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
