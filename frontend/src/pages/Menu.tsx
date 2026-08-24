import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { categoryAPI, foodAPI } from '../services/api';
import type { Category, FoodItem } from '../types';
import { useCart } from '../context/CartContext';
import { Search, ShoppingBag, Clock, Star, UtensilsCrossed } from 'lucide-react';
import ImageFallback from '../components/ImageFallback';
import toast from 'react-hot-toast';

const Menu: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const { addItem } = useCart();

  useEffect(() => {
    categoryAPI.getAll().then(res => setCategories(res.data.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (selectedCategory) params.category = selectedCategory;
        if (search) params.search = search;
        const res = await foodAPI.getAll(params);
        setFoodItems(res.data.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [selectedCategory, search]);

  const handleCategoryFilter = (catId: string) => {
    setSelectedCategory(catId === selectedCategory ? '' : catId);
    if (catId === selectedCategory) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', catId);
    }
    setSearchParams(searchParams);
  };

  const handleAddToCart = (item: FoodItem) => {
    addItem(item);
    toast.success(`${item.name} added to cart!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Menu</h1>
        <p className="text-gray-500">Explore our delicious selection of dishes</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search for dishes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700"
        />
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        <button
          onClick={() => handleCategoryFilter('')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            !selectedCategory
              ? 'bg-orange-500 text-white shadow-lg'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
          }`}
        >
          All Items
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => handleCategoryFilter(cat._id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat._id
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 text-sm">
          {loading ? 'Loading...' : `${foodItems.length} item${foodItems.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Food Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : foodItems.length === 0 ? (
        <div className="text-center py-16">
          <UtensilsCrossed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No items found</h3>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {foodItems.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group border border-gray-100">
              <Link to={`/menu/${item.slug}`} className="block">
                <div className="h-48 overflow-hidden relative group-hover:opacity-90 transition-opacity bg-gray-100">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <ImageFallback className="w-full h-full" iconSize="xl" />
                  )}
                  {item.isPopular && (
                    <span className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3" /> Popular
                    </span>
                  )}
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold">Unavailable</span>
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <Link to={`/menu/${item.slug}`} className="font-semibold text-gray-900 hover:text-orange-600 transition-colors">
                    {item.name}
                  </Link>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.description}</p>
                
                {item.allergens.length > 0 && (
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {item.allergens.map(a => (
                      <span key={a} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-orange-600">LKR {item.price.toLocaleString()}</span>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.prepTimeMinutes}min</span>
                      {item.calories && <span>• {item.calories} cal</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.isAvailable}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors shadow-md hover:shadow-lg"
                  >
                    <ShoppingBag className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Menu;
