import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import { notificationAPI } from '../services/api';
import { ShoppingCart, User, LogOut, Menu as MenuIcon, X, UtensilsCrossed, Bell } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  React.useEffect(() => {
    if (!socket || !user) return;
    
    const handleNewNotif = () => {
      fetchNotifications();
    };

    socket.on('new_notification', handleNewNotif);
    socket.on('order_status_updated', handleNewNotif);

    return () => {
      socket.off('new_notification', handleNewNotif);
      socket.off('order_status_updated', handleNewNotif);
    };
  }, [socket, user]);

  const fetchNotifications = async () => {
    try {
      const [res, countRes] = await Promise.all([
        notificationAPI.getAll({ limit: 5 }),
        notificationAPI.getUnreadCount()
      ]);
      setNotifications(res.data.data);
      setUnreadCount(countRes.data.data.count);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotifClick = async () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && unreadCount > 0) {
      try {
        await notificationAPI.markAllAsRead();
        setUnreadCount(0);
        // Refresh to show them as read
        const res = await notificationAPI.getAll({ limit: 5 });
        setNotifications(res.data.data);
      } catch (e) {
        console.error(e);
      }
    }
  };

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const linkClass = "text-gray-300 hover:text-white transition-colors text-sm font-medium";

  return (
    <div className={`fixed left-0 right-0 z-50 flex justify-center px-4 w-full transition-all duration-500 ease-in-out ${
      isScrolled ? 'top-2' : 'top-6'
    }`}>
      <nav className={`text-white rounded-full flex items-center justify-between w-full border border-white/10 transition-all duration-500 ease-in-out ${
        isScrolled 
          ? 'max-w-5xl bg-[#0a0a0a]/75 backdrop-blur-lg shadow-[0_8px_30px_rgb(0,0,0,0.4)] px-5 py-2'
          : 'max-w-6xl bg-[#0a0a0a] shadow-xl px-6 py-3'
      }`}>
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 font-bold text-xl hover:opacity-80 transition-opacity">
          <UtensilsCrossed className="h-6 w-6 text-orange-500" />
          <span className="tracking-wide">FlavorDash</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className={linkClass}>Home</Link>
          <Link to="/menu" className={linkClass}>Menu</Link>
          {user && (
            <>
              <Link to="/orders" className={linkClass}>My Orders</Link>
              <Link to="/reviews" className={linkClass}>My Reviews</Link>
            </>
          )}
          
          {/* Cart */}
          <Link to="/cart" className="relative text-gray-300 hover:text-white transition-colors flex items-center justify-center p-2 rounded-full hover:bg-white/10">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Notifications */}
          {user && (
            <div className="relative">
              <button onClick={handleNotifClick} className="relative text-gray-300 hover:text-white transition-colors flex items-center justify-center p-2 rounded-full hover:bg-white/10">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden text-gray-800">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold">Notifications</h3>
                    {unreadCount > 0 && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">{unreadCount} New</span>}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                    ) : (
                      notifications.map((notif: any) => (
                        <div key={notif._id} className={`p-4 border-b border-gray-50 last:border-0 ${!notif.isRead ? 'bg-orange-50/30' : ''}`}>
                          <p className="text-sm">{notif.message}</p>
                          <span className="text-xs text-gray-400 mt-1 block">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="flex items-center space-x-4 border-l border-white/20 pl-4">
              <Link to="/profile" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors text-sm font-medium">
                <User className="h-4 w-4" />
                <span>{user.firstName}</span>
              </Link>
              <button onClick={logout} className="text-gray-300 hover:text-red-400 transition-colors" title="Logout">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4 border-l border-white/20 pl-4">
              <Link to="/login" className={linkClass}>Login</Link>
              <Link to="/register" className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center space-x-4">
          <Link to="/cart" className="relative text-gray-300 hover:text-white transition-colors">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                {itemCount}
              </span>
            )}
          </Link>
          <button onClick={() => setIsOpen(!isOpen)} className="text-gray-300 hover:text-white transition-colors">
            {isOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-4 right-4 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xl p-4 flex flex-col space-y-2">
          <Link to="/" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg">Home</Link>
          <Link to="/menu" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg">Menu</Link>
          {user && (
            <>
              <Link to="/orders" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg">My Orders</Link>
              <Link to="/reviews" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg">My Reviews</Link>
              <Link to="/profile" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg">Profile</Link>
              <button onClick={() => { logout(); setIsOpen(false); }} className="text-left block px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg w-full">Logout</button>
            </>
          )}
          {!user && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Link to="/login" onClick={() => setIsOpen(false)} className="text-center px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors">Login</Link>
              <Link to="/register" onClick={() => setIsOpen(false)} className="text-center bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Navbar;
