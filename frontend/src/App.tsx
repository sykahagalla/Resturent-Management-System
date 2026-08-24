import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { CartProvider } from './context/CartContext';
import toast, { Toaster } from 'react-hot-toast';

// Pages
import Home from './pages/Home';
import Menu from './pages/Menu';
import FoodDetail from './pages/FoodDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderTracking from './pages/OrderTracking';
import OrderHistory from './pages/OrderHistory';
import MyReviews from './pages/MyReviews';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

// Layout
import Navbar from './components/Navbar';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const GlobalNotificationListener: React.FC = () => {
  const { socket, playNotificationSound } = useSocket();
  const { user } = useAuth();

  React.useEffect(() => {
    if (!socket || !user) return;

    const handleStatusUpdate = (data: any) => {
      if (data.message) {
        playNotificationSound();
        if (data.status === 'ready') {
          toast.success(`${data.message}`, { duration: 8000 });
        } else {
          toast.success(data.message);
        }
      }
    };

    socket.on('order_status_updated', handleStatusUpdate);
    socket.on('order_verified', handleStatusUpdate);

    return () => {
      socket.off('order_status_updated', handleStatusUpdate);
      socket.off('order_verified', handleStatusUpdate);
    };
  }, [socket, user, playNotificationSound]);

  return null;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <GlobalNotificationListener />
      <main className={isHomePage ? '' : 'pt-28'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/menu/:slug" element={<FoodDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/order-confirmation/:orderId" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
          <Route path="/order-tracking/:orderNumber" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute><MyReviews /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1f2937', color: '#fff', borderRadius: '12px' }}} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
