import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import { ChefHat, LogOut, Wifi, WifiOff } from 'lucide-react';

// Pages
import Login from './pages/Login';
import KitchenDisplay from './pages/KitchenDisplay';

const KitchenLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const { isConnected } = useSocket();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  if (!user || (user.role !== 'kitchen' && user.role !== 'admin')) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <ChefHat className="text-orange-500 w-8 h-8" />
          <h1 className="text-xl font-bold tracking-wider">KITCHEN DISPLAY SYSTEM</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            <span className="font-medium text-sm">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          <div className="h-8 w-px bg-gray-700"></div>
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-300">{user.firstName}</span>
            <button onClick={logout} className="text-gray-400 hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6 overflow-hidden">
        {children}
      </main>
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
            <Route path="/" element={<KitchenLayout><KitchenDisplay /></KitchenLayout>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-center" toastOptions={{
            style: { background: '#374151', color: '#fff' },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } }
          }} />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
