import React, { useEffect, useState } from 'react';
import { orderAPI } from '../services/api';
import type { Order } from '../types';
import { Search, History } from 'lucide-react';

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.getAll({ isCleared: true });
      setOrders(res.data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.customer?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <History className="w-6 h-6 text-gray-500" />
          Order History
        </h1>
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
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium whitespace-nowrap">
              Total Cleared: {orders.length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrders.map(order => (
          <div key={order._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {order.items && order.items.length > 0 
                    ? (order.items.length === 1 ? order.items[0].name : `${order.items[0].name} +${order.items.length - 1}`) 
                    : `#${order.orderNumber}`}
                </h3>
                <p className="text-sm text-gray-500">{order.customer?.firstName} • {order.orderType}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {order.status.replace('_', ' ')}
                </span>
                <p className="text-sm font-bold mt-1">LKR {order.total.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg text-sm max-h-32 overflow-y-auto">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between py-1">
                  <span className="text-gray-600">{item.quantity}x {item.name}</span>
                  <span className="text-gray-400">LKR {item.subtotal.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filteredOrders.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">No order history found.</div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
