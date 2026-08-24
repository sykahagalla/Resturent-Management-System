import React, { useEffect, useState } from 'react';
import { promotionAPI } from '../services/api';
import type { Promotion } from '../types';
import { Tag, Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const PromoManagement: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: 0,
    minOrderAmount: 0,
    maxDiscount: '',
    startDate: '',
    endDate: '',
    usageLimit: 0,
    isActive: true,
  });

  const fetchPromotions = async () => {
    try {
      const res = await promotionAPI.getAll();
      setPromotions(res.data.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleOpenModal = (promo?: Promotion) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        code: promo.code,
        description: promo.description,
        type: promo.type,
        value: promo.value,
        minOrderAmount: promo.minOrderAmount,
        maxDiscount: promo.maxDiscount ? promo.maxDiscount.toString() : '',
        startDate: new Date(promo.startDate).toISOString().slice(0, 10),
        endDate: new Date(promo.endDate).toISOString().slice(0, 10),
        usageLimit: promo.usageLimit,
        isActive: promo.isActive,
      });
    } else {
      setEditingPromo(null);
      setFormData({
        code: '',
        description: '',
        type: 'percentage',
        value: 0,
        minOrderAmount: 0,
        maxDiscount: '',
        startDate: '',
        endDate: '',
        usageLimit: 0,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined
      };

      if (editingPromo) {
        await promotionAPI.update(editingPromo._id, payload);
        toast.success('Promotion updated successfully');
      } else {
        await promotionAPI.create(payload);
        toast.success('Promotion created successfully');
      }
      setIsModalOpen(false);
      fetchPromotions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        await promotionAPI.delete(id);
        toast.success('Promotion deleted');
        fetchPromotions();
      } catch (error: any) {
        toast.error('Failed to delete promotion');
      }
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Tag className="w-6 h-6 text-orange-500" />
          Promo Codes Management
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Promo Code
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm">
                <th className="p-4 font-medium">Code</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Value</th>
                <th className="p-4 font-medium">Validity</th>
                <th className="p-4 font-medium">Usage</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {promotions.map((promo) => (
                <tr key={promo._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-gray-900 uppercase tracking-wider">{promo.code}</span>
                    <p className="text-xs text-gray-500 mt-1">{promo.description}</p>
                  </td>
                  <td className="p-4 capitalize">{promo.type}</td>
                  <td className="p-4">
                    {promo.type === 'percentage' ? `${promo.value}%` : `LKR ${promo.value}`}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <div>From: {new Date(promo.startDate).toLocaleDateString()}</div>
                    <div>To: {new Date(promo.endDate).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4 text-sm">
                    {promo.usedCount} / {promo.usageLimit === 0 ? '∞' : promo.usageLimit}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${promo.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleOpenModal(promo)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(promo._id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors ml-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {promotions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No promo codes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
                  <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border rounded-lg uppercase" placeholder="e.g. SUMMER20" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="20% off on all orders" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (LKR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input required type="number" min="0" step="any" value={formData.value} onChange={e => setFormData({...formData, value: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount (LKR)</label>
                  <input type="number" min="0" value={formData.minOrderAmount} onChange={e => setFormData({...formData, minOrderAmount: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (optional)</label>
                  <input type="number" min="0" value={formData.maxDiscount} onChange={e => setFormData({...formData, maxDiscount: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. 1000" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input required type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit (0 for unlimited)</label>
                  <input type="number" min="0" value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})}
                      className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500" />
                    <span className="text-sm font-medium text-gray-700">Is Active</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white hover:bg-orange-600 rounded-lg font-medium transition-colors">
                  {editingPromo ? 'Update Promo' : 'Create Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoManagement;
