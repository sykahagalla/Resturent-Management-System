import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { foodAPI, reviewAPI } from '../services/api';
import type { FoodItem } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Clock, Flame, ArrowLeft, Plus, Minus, UtensilsCrossed, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const FoodDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<FoodItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [related, setRelated] = useState<FoodItem[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const { addItem } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchItemAndData = async () => {
      try {
        const res = await foodAPI.getBySlug(slug!);
        const currentItem = res.data.data;
        setItem(currentItem);

        // Fetch related products (same category, exclude current)
        const allRes = await foodAPI.getAll();
        const categoryId = typeof currentItem.category === 'object' ? currentItem.category._id : currentItem.category;
        const relatedItems = allRes.data.data.filter((f: any) => 
          (typeof f.category === 'object' ? f.category._id : f.category) === categoryId && 
          f._id !== currentItem._id
        ).slice(0, 4);
        setRelated(relatedItems);

        // Fetch reviews
        const reviewsRes = await reviewAPI.getForFood(currentItem._id);
        setReviews(reviewsRes.data.data.reviews);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchItemAndData();
  }, [slug]);

  const handleAddToCart = () => {
    if (!item) return;
    addItem(item, quantity);
    toast.success(`${quantity}x ${item.name} added to cart!`);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setSubmittingReview(true);
    try {
      const res = await reviewAPI.create({ foodItem: item._id, rating, comment });
      toast.success('Review submitted successfully!');
      setReviews([res.data.data, ...reviews]);
      setComment('');
      setRating(5);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await reviewAPI.delete(reviewId);
      setReviews(reviews.filter(r => r._id !== reviewId));
      toast.success('Review deleted');
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  if (!item) return <div className="text-center py-20"><p className="text-gray-500">Item not found</p></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/menu" className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Menu
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-80 md:h-96 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden relative shadow-sm border border-gray-100">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <UtensilsCrossed className="h-24 w-24 text-gray-300" />
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.name}</h1>
          <p className="text-gray-500 mb-4">{item.description}</p>
          
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {item.prepTimeMinutes} min</span>
            {item.calories && <span className="flex items-center gap-1"><Flame className="h-4 w-4" /> {item.calories} cal</span>}
          </div>

          {item.allergens.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Allergens:</p>
              <div className="flex gap-2 flex-wrap">
                {item.allergens.map(a => <span key={a} className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full font-medium">{a}</span>)}
              </div>
            </div>
          )}

          <div className="text-3xl font-bold text-orange-600 mb-6">LKR {item.price.toLocaleString()}</div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-3 py-2">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-center shadow-sm">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-bold text-lg">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-center shadow-sm">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button onClick={handleAddToCart} disabled={!item.isAvailable}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
              <ShoppingBag className="h-5 w-5" /> Add to Cart - LKR {(item.price * quantity).toLocaleString()}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
        
        {user ? (
          !reviews.some(r => r.customer?._id === user._id) ? (
            <form onSubmit={handleSubmitReview} className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Write a Review</h3>
              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button type="button" key={star} onClick={() => setRating(star)}
                    className={`focus:outline-none ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                    <Star className="h-8 w-8 fill-current" />
                  </button>
                ))}
              </div>
              <textarea 
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="What did you think about this dish? (Optional)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-orange-500 min-h-[100px]"
              />
              <button disabled={submittingReview} type="submit" className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {submittingReview ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          ) : (
            <div className="bg-green-50 p-4 rounded-xl mb-8 border border-green-100 text-green-800">
              You have already reviewed this product. You can manage it from your Profile.
            </div>
          )
        ) : (
          <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100 text-center">
            <p className="text-gray-600 mb-4">Please log in to leave a review</p>
            <Link to="/login" className="inline-block bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors">Log In</Link>
          </div>
        )}

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-gray-500 italic">No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map(review => (
              <div key={review._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{review.customer?.firstName} {review.customer?.lastName}</span>
                    <span className="text-gray-400 text-sm">• {new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-1 mb-2 text-yellow-400">
                    {[...Array(5)].map((_, i) => <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />)}
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
                {user && (user._id === review.customer?._id || user.role === 'admin') && (
                  <button onClick={() => handleDeleteReview(review._id)} className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors">Delete</button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Related Products Section */}
      {related.length > 0 && (
        <div className="mt-16 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">You might also like</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map(rel => (
              <Link key={rel._id} to={`/food/${rel.slug}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="h-40 bg-gray-50 relative flex justify-center items-center overflow-hidden">
                  {rel.image ? (
                    <img src={rel.image} alt={rel.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <UtensilsCrossed className="h-10 w-10 text-gray-300" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-black transition-colors">{rel.name}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-black font-bold">LKR {rel.price}</p>
                    <div className="bg-black text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <ShoppingBag className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodDetail;
