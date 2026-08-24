import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, UtensilsCrossed } from 'lucide-react';

const Cart: React.FC = () => {
  const { items, removeItem, updateQuantity, getSubtotal, getTax, getTotal, clearCart, itemCount } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-20 w-20 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some delicious items to get started</p>
        <Link to="/menu" className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
          Browse Menu <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Cart ({itemCount})</h1>
        <button onClick={clearCart} className="text-red-500 hover:text-red-600 text-sm font-medium">Clear Cart</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.foodItem._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <UtensilsCrossed className="h-8 w-8 text-orange-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{item.foodItem.name}</h3>
                <p className="text-orange-600 font-bold">LKR {item.foodItem.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.foodItem._id, item.quantity - 1)}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.foodItem._id, item.quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">LKR {(item.foodItem.price * item.quantity).toLocaleString()}</p>
                <button onClick={() => removeItem(item.foodItem._id)} className="text-red-400 hover:text-red-500 mt-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit sticky top-24">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">LKR {getSubtotal().toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax (5%)</span><span className="font-medium">LKR {getTax().toLocaleString()}</span></div>
            <hr className="my-3" />
            <div className="flex justify-between text-lg"><span className="font-bold">Total</span><span className="font-bold text-orange-600">LKR {getTotal().toLocaleString()}</span></div>
          </div>
          <button onClick={() => navigate('/checkout')}
            className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg flex items-center justify-center gap-2">
            Proceed to Checkout <ArrowRight className="h-5 w-5" />
          </button>
          <Link to="/menu" className="block text-center text-orange-600 hover:text-orange-700 font-medium mt-4 text-sm">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
