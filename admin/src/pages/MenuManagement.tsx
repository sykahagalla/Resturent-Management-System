import React, { useEffect, useState } from 'react';
import { foodAPI, categoryAPI } from '../services/api';
import type { FoodItem, Category } from '../types';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, ImageIcon, Camera, Upload, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const ImageUploader = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [mode, setMode] = useState<'url' | 'upload' | 'camera'>('url');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onChange(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      console.error(err);
      toast.error('Failed to access camera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      onChange(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stream]);

  return (
    <div className="space-y-3">
       <label className="block text-sm font-medium text-gray-700">Product Image</label>
       <div className="flex bg-gray-100 p-1 rounded-lg">
         <button type="button" onClick={() => { setMode('url'); stopCamera(); }} className={`flex-1 py-1.5 text-sm font-medium rounded-md flex justify-center items-center gap-1 ${mode === 'url' ? 'bg-white shadow' : 'text-gray-500 hover:text-gray-700'}`}><LinkIcon className="w-4 h-4"/> URL</button>
         <button type="button" onClick={() => { setMode('upload'); stopCamera(); }} className={`flex-1 py-1.5 text-sm font-medium rounded-md flex justify-center items-center gap-1 ${mode === 'upload' ? 'bg-white shadow' : 'text-gray-500 hover:text-gray-700'}`}><Upload className="w-4 h-4"/> Upload</button>
         <button type="button" onClick={() => { setMode('camera'); startCamera(); }} className={`flex-1 py-1.5 text-sm font-medium rounded-md flex justify-center items-center gap-1 ${mode === 'camera' ? 'bg-white shadow' : 'text-gray-500 hover:text-gray-700'}`}><Camera className="w-4 h-4"/> Camera</button>
       </div>

       {mode === 'url' && (
         <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" />
       )}

       {mode === 'upload' && (
         <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
           <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="file-upload" />
           <label htmlFor="file-upload" className="cursor-pointer text-orange-600 hover:text-orange-700 font-medium flex flex-col items-center gap-2">
             <Upload className="w-8 h-8 text-gray-400" />
             <span>Click to browse local files</span>
           </label>
         </div>
       )}

       {mode === 'camera' && (
         <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
           {!stream && <p className="text-gray-400 text-sm">Waiting for camera...</p>}
           <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
           <canvas ref={canvasRef} className="hidden" />
           {stream && (
             <button type="button" onClick={captureImage} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-orange-600 text-white rounded-full p-4 shadow-lg hover:bg-orange-700 border-4 border-white">
               <Camera className="w-6 h-6" />
             </button>
           )}
         </div>
       )}

       {value && mode !== 'camera' && (
         <div className="mt-2 relative inline-block">
           <img src={value} alt="Preview" className="h-24 w-24 object-cover rounded-lg border shadow-sm" />
           <button type="button" onClick={() => onChange('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600">
             <X className="w-3 h-3" />
           </button>
         </div>
       )}
    </div>
  );
};

const ProductModal = ({ isOpen, onClose, onSubmit, categories, initialData }: any) => {
  const [formData, setFormData] = useState(initialData || {
    name: '', description: '', price: '', category: '', image: '',
    prepTimeMinutes: '15', calories: '', isAvailable: true, isPopular: false
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: Number(formData.price),
      prepTimeMinutes: Number(formData.prepTimeMinutes),
      calories: formData.calories ? Number(formData.calories) : undefined,
      category: typeof formData.category === 'object' ? formData.category._id : (formData.category || categories[0]?._id),
      allergens: [],
      tags: []
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input required name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea required name="description" value={formData.description} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (LKR)</label>
              <input required type="number" name="price" value={formData.price} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select required name="category" value={typeof formData.category === 'string' ? formData.category : formData.category?._id} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500">
                {categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <ImageUploader 
            value={formData.image} 
            onChange={(val) => setFormData((prev: any) => ({ ...prev, image: val }))} 
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (min)</label>
              <input required type="number" name="prepTimeMinutes" value={formData.prepTimeMinutes} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calories (optional)</label>
              <input type="number" name="calories" value={formData.calories} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <div className="flex gap-6 mt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleChange} className="rounded text-orange-500 focus:ring-orange-500" />
              Available
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="isPopular" checked={formData.isPopular} onChange={handleChange} className="rounded text-orange-500 focus:ring-orange-500" />
              Popular
            </label>
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium shadow-md">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MenuManagement: React.FC = () => {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  const fetchData = async () => {
    try {
      const [foodRes, catRes] = await Promise.all([foodAPI.getAll(), categoryAPI.getAll()]);
      setItems(foodRes.data.data);
      setCategories(catRes.data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleAvailability = async (id: string) => {
    try {
      await foodAPI.toggleAvailability(id);
      fetchData();
      toast.success('Availability updated');
    } catch (error) { toast.error('Update failed'); }
  };

  const handleOpenModal = (item?: FoodItem) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (data: any) => {
    try {
      if (editingItem) {
        await foodAPI.update(editingItem._id, data);
        toast.success('Product updated');
      } else {
        await foodAPI.create(data);
        toast.success('Product created');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Save product error:", error.response?.data || error);
      const errData = error.response?.data;
      if (errData?.details && Array.isArray(errData.details)) {
        toast.error(errData.details.map((d: any) => `${d.field}: ${d.message}`).join(', '));
      } else {
        toast.error(errData?.error || (editingItem ? 'Failed to update' : 'Failed to create'));
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await foodAPI.delete(id);
      toast.success('Product deleted');
      fetchData();
    } catch (error) { toast.error('Delete failed'); }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
        <button onClick={() => handleOpenModal()} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-md hover:shadow-lg">
          <Plus className="w-5 h-5" /> Add New Item
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">Item Name</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Price</th>
              <th className="px-6 py-4 font-medium">Available</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => {
              const category = categories.find(c => c._id === (typeof item.category === 'string' ? item.category : item.category._id));
              return (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500 overflow-hidden shrink-0 shadow-sm border border-orange-200">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 opacity-50" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.isPopular && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Popular</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{category?.name || 'Uncategorized'}</td>
                  <td className="px-6 py-4 font-medium">LKR {item.price}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleAvailability(item._id)} className={`flex items-center gap-1 ${item.isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                      {item.isAvailable ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(item._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"><Trash2 className="w-5 h-5" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSaveProduct}
        categories={categories}
        initialData={editingItem}
      />
    </div>
  );
};

export default MenuManagement;
