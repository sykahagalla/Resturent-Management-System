import React, { useEffect, useState } from 'react';
import { reviewAPI } from '../services/api';
import { Star, UtensilsCrossed, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MyReviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await reviewAPI.getMyReviews();
      setReviews(res.data.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review: any) => {
    setEditingId(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditRating(5);
    setEditComment('');
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    try {
      await reviewAPI.update(id, { rating: editRating, comment: editComment });
      toast.success('Review updated successfully');
      setEditingId(null);
      fetchReviews();
    } catch (error) {
      toast.error('Failed to update review');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewAPI.delete(id);
      toast.success('Review deleted');
      setReviews(reviews.filter(r => r._id !== id));
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Reviews</h1>

      {reviews.length === 0 ? (
        <div className="bg-gray-50 text-center py-16 rounded-2xl border border-gray-100">
          <UtensilsCrossed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No reviews yet</h2>
          <p className="text-gray-500">You haven't reviewed any dishes yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map(review => (
            <div key={review._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-6 flex-col md:flex-row">
              <div className="md:w-48 shrink-0">
                <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative flex items-center justify-center border border-gray-100">
                  {review.foodItem?.image ? (
                    <img src={review.foodItem.image} alt={review.foodItem.name} className="w-full h-full object-cover" />
                  ) : (
                    <UtensilsCrossed className="h-12 w-12 text-gray-300" />
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{review.foodItem?.name || 'Unknown Item'}</h3>
                <p className="text-sm text-gray-500 mb-4">{new Date(review.createdAt).toLocaleDateString()}</p>
                
                {editingId === review._id ? (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => setEditRating(star)} className={"focus:outline-none " + (star <= editRating ? "text-yellow-400" : "text-gray-300")}>
                          <Star className="h-6 w-6 fill-current" />
                        </button>
                      ))}
                    </div>
                    <textarea 
                      value={editComment} 
                      onChange={e => setEditComment(e.target.value)} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-orange-500 min-h-[100px]"
                      placeholder="Optional comment..."
                    />
                    <div className="flex gap-3">
                      <button onClick={() => handleUpdate(review._id)} disabled={saving} className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={handleCancelEdit} disabled={saving} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1 mb-3 text-yellow-400">
                      {[...Array(5)].map((_, i) => <Star key={i} className={"h-5 w-5 " + (i < review.rating ? "fill-current" : "text-gray-200")} />)}
                    </div>
                    <p className="text-gray-700 mb-6">{review.comment}</p>
                    <div className="flex gap-4">
                      <button onClick={() => handleEdit(review)} className="flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700">
                        <Edit2 className="h-4 w-4" /> Edit
                      </button>
                      <button onClick={() => handleDelete(review._id)} className="flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReviews;
