import React, { useEffect, useState } from 'react';
import { orderAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import type { Order } from '../types';
import { ShieldAlert, Check, X, Search, Archive } from 'lucide-react';
import toast from 'react-hot-toast';

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyCode, setVerifyCode] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { socket, playNotificationSound } = useSocket();

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.getAll({ isCleared: false });
      setOrders(res.data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    socket.emit('sync_orders');
    
    socket.on('orders_synced', (data: { orders: Order[] }) => {
      setOrders(data.orders);
    });

    socket.on('new_order', (data: { order: Order }) => {
      playNotificationSound();
      setOrders(prev => [data.order, ...prev]);
      toast.success(`New order #${data.order.orderNumber} received!`);
    });

    socket.on('order_status_updated', () => fetchOrders());
    socket.on('order_verified', () => {
      toast.success('Order verified successfully!');
      fetchOrders();
    });

    return () => {
      socket.off('orders_synced');
      socket.off('new_order');
      socket.off('order_status_updated');
      socket.off('order_verified');
    };
  }, [socket, playNotificationSound]);

  const handleVerify = async (orderId: string) => {
    try {
      await orderAPI.verify(orderId, verifyCode);
      setVerifyCode('');
      setSelectedOrder(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Verification failed');
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await orderAPI.updateStatus(orderId, { status });
      toast.success(`Order marked as ${status.replace('_', ' ')}`);
      fetchOrders();
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const handleClear = async (orderId: string) => {
    try {
      await orderAPI.clear(orderId);
      toast.success('Order cleared and moved to history');
      fetchOrders();
    } catch (error: any) {
      toast.error('Failed to clear order');
    }
  };

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.customer?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Live Order Management</h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search order or customer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full sm:w-64"
            />
          </div>
          <div className="flex gap-2 items-center">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium whitespace-nowrap">Pending: {orders.filter(o => o.status === 'pending').length}</span>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium whitespace-nowrap">Active: {orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrders.map(order => (
          <div key={order._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {order.items && order.items.length > 0 
                    ? (order.items.length === 1 ? order.items[0].name : `${order.items[0].name} +${order.items.length - 1}`) 
                    : `#${order.orderNumber}`}
                </h3>
                <p className="text-sm text-gray-500">{order.customer?.firstName} • {order.orderType}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status.replace('_', ' ')}
                  </span>
                  <button 
                    onClick={() => handleClear(order._id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Clear Order"
                  >
                    <Archive className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm font-bold">LKR {order.total.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm max-h-32 overflow-y-auto">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between py-1">
                  <span>{item.quantity}x {item.name}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            {order.status === 'pending' && (
              <button onClick={() => updateStatus(order._id, 'confirmed')} className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 py-2.5 rounded-xl font-medium transition-colors">
                Confirm Order
              </button>
            )}

            {order.status === 'confirmed' && (
              <button onClick={() => updateStatus(order._id, 'accepted')} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-xl font-medium transition-colors">
                Accept & Send to Kitchen
              </button>
            )}

            {order.status === 'ready' && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2 text-green-800 font-medium">
                  <ShieldAlert className="w-5 h-5" /> Delivery Verification Required
                </div>
                {selectedOrder === order._id ? (
                  <div className="flex gap-2">
                    <input type="text" placeholder="Enter 6-digit code" value={verifyCode} onChange={e => setVerifyCode(e.target.value.toUpperCase())} maxLength={6}
                      className="flex-1 px-3 py-2 border rounded-lg uppercase tracking-widest text-center font-mono font-bold" />
                    <button onClick={() => handleVerify(order._id)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                      <Check className="w-4 h-4" /> Verify
                    </button>
                    <button onClick={() => { setSelectedOrder(null); setVerifyCode(''); }} className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5"/></button>
                  </div>
                ) : (
                  <button onClick={() => setSelectedOrder(order._id)} className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg font-medium transition-colors flex justify-center items-center gap-2">
                    <Check className="w-5 h-5" /> Enter Verification Code
                  </button>
                )}
              </div>
            )}

          </div>
        ))}
        {filteredOrders.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">No active orders</div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
