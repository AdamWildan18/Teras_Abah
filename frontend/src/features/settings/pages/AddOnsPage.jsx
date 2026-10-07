import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/axios';
import { Plus, Edit, Trash2, X, Package, Layers } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { toast } from 'sonner';

export default function AddOnsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState(null);
  const [formData, setFormData] = useState({
    name: '', code: '', price: '', stock: 0, recipe_yield: 1, is_available: true,
    recipe_items: [],
  });
  const queryClient = useQueryClient();

  const { data: addOnsData, isLoading } = useQuery({
    queryKey: ['add-ons-all'],
    queryFn: () => api.get('/add-ons'),
  });

  const { data: rawMaterialsData } = useQuery({
    queryKey: ['raw-materials-all'],
    queryFn: () => api.get('/add-ons/raw-materials'),
  });

  const addOns = addOnsData?.data?.data || addOnsData?.data || [];
  const rawMaterials = rawMaterialsData?.data?.data || rawMaterialsData?.data || [];

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/add-ons', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['add-ons-all'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Add-on berhasil ditambahkan');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Gagal'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/add-ons/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['add-ons-all'] });
      setIsModalOpen(false);
      setEditingAddOn(null);
      resetForm();
      toast.success('Add-on berhasil diupdate');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Gagal'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/add-ons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['add-ons-all'] });
      toast.success('Add-on berhasil dihapus');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '', code: '', price: '', stock: 0, recipe_yield: 1, is_available: true,
      recipe_items: [],
    });
  };

  const handleEdit = (addOn) => {
    setEditingAddOn(addOn);
    setFormData({
      name: addOn.name,
      code: addOn.code,
      price: addOn.price,
      stock: addOn.stock || 0,
      recipe_yield: addOn.recipe_yield || 1,
      is_available: addOn.is_available,
      recipe_items: (addOn.recipe_items || []).map(item => ({
        raw_material_id: item.raw_material_id,
        qty: item.qty,
        unit: item.unit,
      })),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (addOn) => {
    if (window.confirm(`Hapus add-on "${addOn.name}"?`)) {
      deleteMutation.mutate(addOn.id);
    }
  };

  const addRecipeItem = () => {
    setFormData({
      ...formData,
      recipe_items: [...formData.recipe_items, { raw_material_id: '', qty: 0, unit: 'kg' }],
    });
  };

  const updateRecipeItem = (index, field, value) => {
    const newItems = [...formData.recipe_items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, recipe_items: newItems });
  };

  const removeRecipeItem = (index) => {
    const newItems = formData.recipe_items.filter((_, i) => i !== index);
    setFormData({ ...formData, recipe_items: newItems });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      code: formData.code,
      price: parseFloat(formData.price),
      stock: parseFloat(formData.stock),
      recipe_yield: parseInt(formData.recipe_yield),
      is_available: formData.is_available,
      recipe_items: formData.recipe_items.map(item => ({
        raw_material_id: parseInt(item.raw_material_id),
        qty: parseFloat(item.qty),
        unit: item.unit,
      })),
    };

    if (editingAddOn) {
      updateMutation.mutate({ id: editingAddOn.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const formatRupiah = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kelola Add-On</h1>
          <p className="text-gray-500 text-sm">Tambah, edit, atau hapus add-on menu beserta resepnya</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" /> Tambah Add-On
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resep</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center">Memuat...</td></tr>
            ) : addOns.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">Belum ada add-on</td></tr>
            ) : (
              addOns.map((addOn) => (
                <tr key={addOn.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{addOn.code}</td>
                  <td className="px-4 py-3 text-sm font-medium">{addOn.name}</td>
                  <td className="px-4 py-3 text-sm">{formatRupiah(addOn.price)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      addOn.stock <= 0 ? 'bg-red-100 text-red-700' :
                      addOn.stock <= 10 ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {addOn.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-xs text-gray-600">
                      {(addOn.recipe_items || []).length} bahan
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      addOn.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {addOn.is_available ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(addOn)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(addOn)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingAddOn(null); resetForm(); }} title={editingAddOn ? 'Edit Add-On' : 'Tambah Add-On'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Kode *</label>
              <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="AO01" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nama *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Tetelan" required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Harga Jual *</label>
              <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-3 py-2 border rounded-lg" min="0" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stok Awal</label>
              <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full px-3 py-2 border rounded-lg" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hasil per Resep</label>
              <input type="number" value={formData.recipe_yield} onChange={(e) => setFormData({ ...formData, recipe_yield: e.target.value })} className="w-full px-3 py-2 border rounded-lg" min="1" />
              <p className="text-xs text-gray-500 mt-1">Jumlah add-on yang dihasilkan dari 1x resep</p>
            </div>
          </div>

          {/* Resep Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4" /> Resep (Bahan Mentah)
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addRecipeItem}>
                <Plus className="w-3 h-3" /> Tambah Bahan
              </Button>
            </div>

            {formData.recipe_items.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Belum ada bahan. Klik "Tambah Bahan" untuk menambahkan.</p>
            ) : (
              <div className="space-y-2">
                {formData.recipe_items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded-lg">
                    <select
                      value={item.raw_material_id}
                      onChange={(e) => updateRecipeItem(idx, 'raw_material_id', e.target.value)}
                      className="col-span-5 px-2 py-1 border rounded text-sm"
                      required
                    >
                      <option value="">Pilih bahan</option>
                      {rawMaterials.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.code}) - Stok: {m.stock} {m.unit}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateRecipeItem(idx, 'qty', e.target.value)}
                      className="col-span-3 px-2 py-1 border rounded text-sm"
                      placeholder="Qty"
                      step="0.001"
                      min="0"
                      required
                    />
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateRecipeItem(idx, 'unit', e.target.value)}
                      className="col-span-3 px-2 py-1 border rounded text-sm"
                      placeholder="Satuan"
                      required
                    />
                    <button type="button" onClick={() => removeRecipeItem(idx)} className="col-span-1 text-red-500 hover:bg-red-50 rounded p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_available" checked={formData.is_available} onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="is_available" className="text-sm">Tersedia untuk dipesan</label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => { setIsModalOpen(false); setEditingAddOn(null); resetForm(); }}>Batal</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingAddOn ? 'Update' : 'Tambah'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}