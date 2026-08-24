import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryAPI, foodAPI } from '../services/api';
import type { Category, FoodItem } from '../types';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Star, Clock, ArrowRight, UtensilsCrossed } from 'lucide-react';
import ImageFallback from '../components/ImageFallback';
import toast from 'react-hot-toast';

const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularItems, setPopularItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, foodRes] = await Promise.all([
          categoryAPI.getAll(),
          foodAPI.getAll({ popular: 'true', limit: 8 }),
        ]);
        setCategories(catRes.data.data);
        setPopularItems(foodRes.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddToCart = (item: FoodItem) => {
    addItem(item);
    toast.success(`${item.name} added to cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center text-white overflow-hidden pt-20">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop")' }}
        ></div>
        
        {/* Enhanced Dark/Gradient Overlay */}
        <div className="absolute inset-0 z-0 bg-black/70"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 sm:py-28 lg:py-32 w-full flex flex-col items-center text-center justify-center gap-12">
          {/* Text Content */}
          <div className="max-w-3xl flex-1 mt-10 md:mt-0">
            <div className="inline-flex items-center gap-2 mb-8 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20">
              <span className="text-white font-bold tracking-widest uppercase text-xs">Premium Dining Experience</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-black leading-tight mb-6 drop-shadow-2xl">
              Taste the Authentic Magic
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-200 mb-10 max-w-2xl mx-auto drop-shadow-md font-medium leading-relaxed">
              Experience the true flavors with our carefully crafted dishes. Order online for a delightful culinary journey.
            </p>
            
            <div className="flex flex-wrap gap-5 justify-center">
              <Link
                to="/menu"
                className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-lg transition-colors hover:bg-gray-200"
              >
                <span>Order Now</span> 
              </Link>
              
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 bg-transparent border border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-colors"
              >
                View Menu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Browse Categories</h2>
            <p className="text-gray-500 mt-1">Find what you're craving</p>
          </div>
          <Link to="/menu" className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/menu?category=${cat._id}`}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 text-center group border border-gray-100"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <UtensilsCrossed className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">{cat.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{cat.itemCount} items</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Items */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Popular Items</h2>
              <p className="text-gray-500 mt-1">Most ordered dishes this week</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularItems.map((item) => (
              <div key={item._id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group">
                <div className="h-48 overflow-hidden relative group-hover:opacity-90 transition-opacity bg-gray-100">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <ImageFallback className="w-full h-full" iconSize="xl" />
                  )}
                  {item.isPopular && (
                    <span className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                      <Star className="h-3.5 w-3.5" /> Popular
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <Link to={`/menu/${item.slug}`} className="font-semibold text-gray-900 hover:text-orange-600 transition-colors text-lg block mb-1">
                    {item.name}
                  </Link>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-orange-600">LKR {item.price.toLocaleString()}</span>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <Clock className="h-3 w-3" /> {item.prepTimeMinutes} min
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="bg-orange-500 hover:bg-orange-600 text-white p-2.5 rounded-xl transition-colors shadow-lg hover:shadow-xl"
                    >
                      <ShoppingBag className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] text-gray-400 py-16 border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                <UtensilsCrossed className="h-6 w-6 text-white" />
                <span className="text-xl font-bold text-white">FlavorDash</span>
              </div>
              <p className="text-sm">Providing an authentic culinary experience with the finest ingredients. Quality and taste you can trust.</p>
            </div>
            
            <div className="flex flex-col items-center md:items-start">
              <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Quick Links</h4>
              <Link to="/" className="hover:text-white transition-colors mb-2 text-sm">Home</Link>
              <Link to="/menu" className="hover:text-white transition-colors mb-2 text-sm">Menu</Link>
              <Link to="/login" className="hover:text-white transition-colors text-sm">Login</Link>
            </div>
            
            <div className="flex flex-col items-center md:items-start">
              <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Contact Us</h4>
              <p className="mb-2 text-sm">123 Flavor Street</p>
              <p className="mb-2 text-sm">Colombo, Sri Lanka</p>
              <p className="text-sm">support@flavordash.com</p>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} FlavorDash. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
