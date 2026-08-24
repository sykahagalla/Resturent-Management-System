import React, { useEffect, useState, useMemo } from 'react';
import { kitchenAPI, orderAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import type { Order } from '../types';
import { Check, ChefHat, Clock, AlertTriangle, ListFilter } from 'lucide-react';
import toast from 'react-hot-toast';

// --- Live Timer Component ---
const LiveTimer: React.FC<{ startTime: string }> = ({ startTime }) => {
  const [elapsedMins, setElapsedMins] = useState(0);

  useEffect(() => {
    const calculateTime = () => {
      const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 60000);
      setElapsedMins(diff >= 0 ? diff : 0);
    };

    calculateTime(); // Initial
    const timer = setInterval(calculateTime, 10000); // Check every 10 seconds for accuracy

    return () => clearInterval(timer);
  }, [startTime]);

  return (
    <div className="flex items-center gap-1 font-bold text-lg tracking-wide">
      <Clock className="w-5 h-5" /> {elapsedMins}m
    </div>
  );
};

// Helper for card color mapping
const getCardColorClasses = (startTime: string) => {
  const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 60000);
  if (diff >= 20) {
    return {
      header: 'bg-red-600 text-white',
      border: 'border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]',
      bg: 'bg-red-950/20'
    };
  }
  if (diff >= 10) {
    return {
      header: 'bg-yellow-500 text-gray-900',
      border: 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)]',
      bg: 'bg-yellow-950/20'
    };
  }
  return {
    header: 'bg-emerald-600 text-white',
    border: 'border-emerald-500/30',
    bg: 'bg-gray-800'
  };
};


const KitchenDisplay: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tickingForce, setTickingForce] = useState(0); // Used to force header color re-eval every minute
  const { socket, playNotificationSound } = useSocket();

  const fetchQueue = async () => {
    try {
      const res = await kitchenAPI.getQueue();
      setOrders(res.data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchQueue();
    // Force re-eval of colors every minute
    const timer = setInterval(() => setTickingForce(f => f + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    socket.emit('sync_orders');
    
    socket.on('orders_synced', (data: { orders: Order[] }) => {
      const queue = data.orders.filter(o => ['accepted', 'preparing'].includes(o.status));
      setOrders(queue);
    });

    socket.on('order_status_updated', () => fetchQueue());
    socket.on('new_order', () => fetchQueue());

    return () => {
      socket.off('orders_synced');
      socket.off('order_status_updated');
      socket.off('new_order');
    };
  }, [socket]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      setOrders(prev => prev.filter(o => {
        if (o._id === orderId) {
          if (status === 'ready') return false; 
          return { ...o, status }; 
        }
        return true;
      }));
      
      await orderAPI.updateStatus(orderId, { status });
      if (status === 'preparing') toast.success('Started preparing order');
      if (status === 'ready') {
        playNotificationSound();
        toast.success('Order marked as ready!');
      }
      fetchQueue();
    } catch (error) {
      toast.error('Failed to update status');
      fetchQueue(); 
    }
  };

  const incomingOrders = useMemo(() => orders.filter(o => o.status === 'accepted'), [orders]);
  const preparingOrders = useMemo(() => orders.filter(o => o.status === 'preparing'), [orders]);

  // Aggregate Items Calculation
  const aggregateItems = useMemo(() => {
    const tally: Record<string, { count: number, special: string[] }> = {};
    const visibleOrders = orders.filter(o => ['accepted', 'preparing'].includes(o.status));
    
    visibleOrders.forEach(order => {
      order.items.forEach(item => {
        if (!tally[item.name]) {
          tally[item.name] = { count: 0, special: [] };
        }
        tally[item.name].count += item.quantity;
        if (item.specialInstructions) {
          tally[item.name].special.push(`${item.quantity}x: ${item.specialInstructions}`);
        }
      });
    });
    // Sort alphabetically by name
    return Object.entries(tally).sort((a, b) => a[0].localeCompare(b[0]));
  }, [orders]);


  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-gray-400 text-2xl font-bold tracking-widest">
      <div className="animate-pulse">LOADING KITCHEN QUEUE...</div>
    </div>
  );

  const renderOrderCard = (order: Order, isPreparing: boolean) => {
    // Rely on tickingForce just to re-trigger getCardColorClasses periodically
    const colors = getCardColorClasses(order.updatedAt + tickingForce.toString().replace(/./g, '')); 
    
    return (
      <div key={order._id} className={`flex flex-col rounded-2xl overflow-hidden border-2 ${colors.border} ${colors.bg} h-full transition-all duration-300 transform`}>
        <div className={`p-4 flex justify-between items-center ${colors.header}`}>
          <div className="flex items-center gap-3">
            <span className="font-black text-2xl tracking-wide">
              {order.items && order.items.length > 0 
                ? (order.items.length === 1 ? order.items[0].name.substring(0,12) : `${order.items[0].name.substring(0,12)} +${order.items.length - 1}`) 
                : `#${order.orderNumber}`}
            </span>
            <span className="px-3 py-1 rounded bg-black/30 font-bold text-sm tracking-widest uppercase">
              {order.orderType === 'takeaway' ? 'TAKE' : 'DELV'}
            </span>
          </div>
          <LiveTimer startTime={order.updatedAt} />
        </div>
        
        <div className="flex-1 p-5 overflow-y-auto">
          {order.specialInstructions && (
            <div className="mb-5 p-3 bg-yellow-500/20 border-2 border-yellow-500/50 rounded-xl text-yellow-300 text-lg font-medium flex gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 text-yellow-400" />
              <span>{order.specialInstructions}</span>
            </div>
          )}
          <ul className="space-y-4">
            {order.items.map((item, i) => (
              <li key={i} className="text-gray-100 bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                <div className="flex items-start gap-4">
                  <span className="font-black text-2xl text-orange-400 min-w-[2.5rem]">{item.quantity}x</span>
                  <div>
                    <span className="font-bold text-xl">{item.name}</span>
                    {item.specialInstructions && (
                      <p className="text-yellow-400 text-base mt-1.5 flex gap-2 items-start font-medium bg-black/20 p-2 rounded-lg">
                        <span className="text-yellow-600">↳</span> {item.specialInstructions}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="p-4 bg-gray-900 border-t-4 border-gray-800 mt-auto">
          {isPreparing ? (
            <button onClick={() => updateStatus(order._id, 'ready')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-95 text-white py-5 rounded-xl font-black text-2xl tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-emerald-500/25 cursor-pointer">
              <Check className="w-8 h-8" /> MARK READY
            </button>
          ) : (
            <button onClick={() => updateStatus(order._id, 'preparing')}
              className="w-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 active:scale-95 text-white py-5 rounded-xl font-black text-2xl tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-orange-500/25 cursor-pointer">
              <ChefHat className="w-8 h-8" /> START PREP
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex gap-6 p-2">
      {/* Main Boards */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 h-full min-h-0">
        
        {/* Incoming Column */}
        <div className="flex flex-col bg-gray-900/60 rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
          <div className="p-5 bg-gradient-to-r from-indigo-900 to-gray-900 border-b-2 border-indigo-500/30 flex justify-between items-center">
            <h2 className="text-2xl font-black text-indigo-400 tracking-widest">NEW TICKETS</h2>
            <span className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-lg">
              {incomingOrders.length}
            </span>
          </div>
          <div className="flex-1 p-5 overflow-x-auto overflow-y-hidden custom-scrollbar">
            <div className="flex gap-5 h-full w-max">
              {incomingOrders.map(order => (
                <div key={order._id} className="w-[360px] h-full shrink-0">
                  {renderOrderCard(order, false)}
                </div>
              ))}
              {incomingOrders.length === 0 && (
                <div className="w-full flex items-center justify-center text-gray-600 text-2xl font-black tracking-widest opacity-50">
                  NO NEW TICKETS
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preparing Column */}
        <div className="flex flex-col bg-gray-900/60 rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
          <div className="p-5 bg-gradient-to-r from-orange-900 to-gray-900 border-b-2 border-orange-500/30 flex justify-between items-center">
            <h2 className="text-2xl font-black text-orange-400 tracking-widest">PREPARING</h2>
            <span className="bg-orange-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-lg">
              {preparingOrders.length}
            </span>
          </div>
          <div className="flex-1 p-5 overflow-x-auto overflow-y-hidden custom-scrollbar">
            <div className="flex gap-5 h-full w-max">
              {preparingOrders.map(order => (
                <div key={order._id} className="w-[360px] h-full shrink-0">
                  {renderOrderCard(order, true)}
                </div>
              ))}
              {preparingOrders.length === 0 && (
                <div className="w-full flex items-center justify-center text-gray-600 text-2xl font-black tracking-widest opacity-50">
                  NOTHING PREPARING
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Panel */}
      <div className="hidden xl:flex w-[320px] flex-col bg-gray-900/80 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden shrink-0">
        <div className="p-5 bg-gradient-to-r from-emerald-900 to-gray-900 border-b-2 border-emerald-500/30 flex items-center gap-3">
          <ListFilter className="w-7 h-7 text-emerald-400" />
          <h2 className="text-xl font-black text-emerald-400 tracking-widest">PREP TOTALS</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {aggregateItems.length === 0 ? (
            <div className="text-center text-gray-500 font-bold mt-10">Queue Empty</div>
          ) : (
            <ul className="space-y-3">
              {aggregateItems.map(([name, data]) => (
                <li key={name} className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-gray-200">{name}</span>
                    <span className="font-black text-2xl text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-xl">
                      {data.count}
                    </span>
                  </div>
                  {data.special.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {data.special.map((note, idx) => (
                        <div key={idx} className="text-sm font-medium text-yellow-400 bg-yellow-400/10 p-2 rounded-lg leading-tight">
                          {note}
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Add custom scrollbar styles globally for the KDS */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 12px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.8);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 1);
        }
      `}</style>
    </div>
  );
};

export default KitchenDisplay;
