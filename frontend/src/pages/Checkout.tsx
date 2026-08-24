import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { orderAPI, promotionAPI } from '../services/api';
import { MapPin, CreditCard, Banknote, Globe, Tag, Loader2, XCircle, ShoppingBag, Truck, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const Checkout: React.FC = () => {
  const { items, getSubtotal, getTax, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState<'takeaway' | 'delivery'>('takeaway');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online'>('cash');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState({ street: '', city: '', state: '', zipCode: '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);
  
  // Timer state
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastIdRef = useRef<string | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (toastIdRef.current) toast.dismiss(toastIdRef.current);
    };
  }, []);

  // Handle countdown logic
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
      
      // Update toast
      if (toastIdRef.current) {
        toast.loading(`Placing order in ${countdown}s...`, { id: toastIdRef.current });
      } else {
        toastIdRef.current = toast.loading(`Placing order in ${countdown}s...`);
      }
    } else if (countdown === 0) {
      // Time's up, place the actual order
      setCountdown(null);
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
      executePlaceOrder();
    }
  }, [countdown]);

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    try {
      const res = await promotionAPI.validate(promoCode, getSubtotal());
      setDiscount(res.data.data.discount);
      setPromoApplied(true);
      toast.success(`Promo applied! You save LKR ${res.data.data.discount}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid promo code');
    }
  };

  const handlePlaceOrderClick = () => {
    if (items.length === 0) { toast.error('Cart is empty'); return; }
    if (orderType === 'delivery' && (!deliveryAddress.street || !deliveryAddress.city)) {
      toast.error('Please fill in delivery address'); return;
    }
    
    // Start 10 second countdown
    setCountdown(10);
  };

  const cancelOrderPlacement = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCountdown(null);
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
    toast.success('Order placement paused. You can edit your order.');
  };

  const executePlaceOrder = async () => {
    setLoading(true);
    try {
      const orderData = {
        items: items.map(item => ({
          foodItem: item.foodItem._id,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
        })),
        orderType,
        paymentMethod,
        specialInstructions,
        promotionCode: promoApplied ? promoCode : undefined,
        ...(orderType === 'delivery' ? { deliveryAddress } : {}),
      };

      const res = await orderAPI.create(orderData);
      const { order, verificationCode } = res.data.data;

      // Emit new order via WebSocket for real-time notification
      if (socket) {
        socket.emit('new_order_placed', { orderId: order._id, orderNumber: order.orderNumber });
      }

      clearCart();
      toast.success('Order placed successfully!');
      // Navigate to confirmation page with verification code
      navigate(`/order-confirmation/${order._id}`, {
        state: { order, verificationCode },
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${countdown !== null ? 'opacity-50 pointer-events-none' : ''} transition-opacity duration-300`}>
        <div className="lg:col-span-2 space-y-6">
          {/* Order Type */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Type</h2>
            <div className="grid grid-cols-2 gap-3">
              {(['takeaway', 'delivery'] as const).map(type => (
                <button key={type} onClick={() => setOrderType(type)}
                  className={`p-4 rounded-xl border-2 font-semibold text-center transition-all ${
                    orderType === type ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  <div className="flex items-center justify-center gap-2">
                    {type === 'takeaway' ? <ShoppingBag className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                    <span>{type === 'takeaway' ? 'Takeaway' : 'Delivery'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          {orderType === 'delivery' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-orange-500" /> Delivery Address</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Street Address" value={deliveryAddress.street}
                  onChange={e => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="City" value={deliveryAddress.city}
                    onChange={e => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  <input type="text" placeholder="State" value={deliveryAddress.state}
                    onChange={e => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="ZIP Code" value={deliveryAddress.zipCode}
                    onChange={e => setDeliveryAddress({...deliveryAddress, zipCode: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  <input type="tel" placeholder="Phone" value={deliveryAddress.phone}
                    onChange={e => setDeliveryAddress({...deliveryAddress, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'cash' as const, label: 'Cash', icon: <Banknote className="h-5 w-5" /> },
                { value: 'card' as const, label: 'Card', icon: <CreditCard className="h-5 w-5" /> },
                { value: 'online' as const, label: 'Online', icon: <Globe className="h-5 w-5" /> },
              ].map(method => (
                <button key={method.value} onClick={() => setPaymentMethod(method.value)}
                  className={`p-4 rounded-xl border-2 font-medium text-center transition-all flex flex-col items-center gap-2 ${
                    paymentMethod === method.value ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {method.icon} {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Special Instructions</h2>
            <textarea value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)}
              rows={3} placeholder="Any special requests? (allergies, extra spicy, etc.)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit sticky top-24">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {items.map(item => (
              <div key={item.foodItem._id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.quantity}x {item.foodItem.name}</span>
                <span className="font-medium">LKR {(item.foodItem.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <hr className="my-3" />
          
          {/* Promo Code */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="Promo code"
                disabled={promoApplied}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50" />
            </div>
            <button onClick={handleApplyPromo} disabled={promoApplied || !promoCode}
              className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
              {promoApplied ? <Check className="w-4 h-4 mx-auto" /> : 'Apply'}
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>LKR {getSubtotal().toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax (5%)</span><span>LKR {getTax().toLocaleString()}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-LKR {discount.toLocaleString()}</span></div>}
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-orange-600">LKR {getTotal(discount).toLocaleString()}</span></div>
          </div>

          <button onClick={handlePlaceOrderClick} disabled={loading || countdown !== null}
            className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3.5 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 shadow-xl flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Placing Order...</> : 'Place Order'}
          </button>
        </div>
      </div>

      {/* Timer Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f97316" strokeWidth="8" 
                  strokeDasharray={`${2 * Math.PI * 45}`} 
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - countdown / 10)}`}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className="absolute text-3xl font-bold text-gray-900">{countdown}</span>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h3>
            <p className="text-gray-500 mb-8">We will send your order to the kitchen in {countdown} seconds.</p>
            
            <div className="flex gap-4">
              <button 
                onClick={cancelOrderPlacement}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <XCircle className="w-5 h-5" /> Edit Order
              </button>
              <button 
                onClick={() => setCountdown(0)}
                className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/30"
              >
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
