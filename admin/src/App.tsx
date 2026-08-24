import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import { LayoutDashboard, ListOrdered, UtensilsCrossed, LogOut, Menu, Bell, MessageSquare, History, Tag } from 'lucide-react';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrderManagement from './pages/OrderManagement';
import MenuManagement from './pages/MenuManagement';
import Reviews from './pages/Reviews';
import OrderHistory from './pages/OrderHistory';
import PromoManagement from './pages/PromoManagement';

const Sidebar: React.FC<{ isOpen: boolean; toggle: () => void }> = ({ isOpen, toggle }) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const { isConnected } = useSocket();

  const links = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard /> },
    { name: 'Orders', path: '/orders', icon: <ListOrdered /> },
    { name: 'Menu', path: '/menu', icon: <UtensilsCrossed /> },
    { name: 'Promos', path: '/promotions', icon: <Tag /> },
    { name: 'Order History', path: '/order-history', icon: <History /> },
    { name: 'Reviews', path: '/reviews', icon: <MessageSquare /> },
  ];

  return (
    <>
      <div className={`fixed inset-y-0 left-0 w-64 bg-gray-900 text-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out z-30`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-800">
          <UtensilsCrossed className="text-orange-500 mr-2" />
          <h1 className="text-xl font-bold">Admin Portal</h1>
        </div>
        
        <div className="p-4 flex items-center gap-3 border-b border-gray-800">
          <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-bold">
            {user?.firstName[0]}
          </div>
          <div>
            <p className="text-sm font-semibold">{user?.firstName}</p>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>

        <nav className="mt-4 flex-1">
          {links.map(link => (
            <Link key={link.path} to={link.path} onClick={() => window.innerWidth < 768 && toggle()}
              className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${location.pathname === link.path ? 'bg-gray-800 text-orange-500 border-r-4 border-orange-500' : ''}`}>
              <span className="mr-3">{link.icon}</span>
              {link.name}
            </Link>
          ))}
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <button onClick={logout} className="flex items-center w-full px-4 py-2 text-red-400 hover:bg-red-900/20 rounded transition-colors">
            <LogOut className="mr-3 w-5 h-5" /> Logout
          </button>
        </div>
      </div>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={toggle} />}
    </>
  );
};

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1"></div>
          <button className="text-gray-400 hover:text-gray-600 relative">
            <Bell className="w-6 h-6" />
          </button>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
            <Route path="/orders" element={<ProtectedLayout><OrderManagement /></ProtectedLayout>} />
            <Route path="/order-history" element={<ProtectedLayout><OrderHistory /></ProtectedLayout>} />
            <Route path="/menu" element={<ProtectedLayout><MenuManagement /></ProtectedLayout>} />
            <Route path="/promotions" element={<ProtectedLayout><PromoManagement /></ProtectedLayout>} />
            <Route path="/reviews" element={<ProtectedLayout><Reviews /></ProtectedLayout>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
