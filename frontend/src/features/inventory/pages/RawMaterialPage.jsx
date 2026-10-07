import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rawMaterialApi } from '../api/rawMaterialApi';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, AlertTriangle, PackagePlus, X } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function RawMaterialPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [restockItem, setRestockItem] = useState(null);
  const queryClient = useQueryClient();

  // Fetch data
  const { data, isLoading } = useQuery({
    queryKey: ['raw-materials', search, page],
    queryFn: () => rawMaterialApi.getAll({ search, page, per_page: 15 }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: rawMaterialApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      setIsModalOpen(false);
      setEditingItem(null);
      toast.success('Bahan mentah berhasil ditambahkan');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Gagal menambahkan bahan'),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rawMaterialApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      setIsModalOpen(false);
      setEditingItem(null);
      toast.success('Bahan mentah berhasil diupdate');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Gagal mengupdate bahan'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: rawMaterialApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      toast.success('Bahan mentah berhasil dihapus');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Gagal menghapus bahan'),
  });

  // ✅ Restock mutation
  const restockMutation = useMutation({
    mutationFn: ({ id, data }) => rawMaterialApi.restock(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      setIsRestockOpen(false);
      setRestockItem(null);
      toast.success(`Stok bertambah ${response.data.added_qty}. Total: ${response.data.new_stock}`);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Gagal menambah stok'),
  });

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // ✅ Handler untuk buka modal restock
  const handleRestock = (item) => {
    setRestockItem(item);
    setIsRestockOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus bahan ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (formData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // ✅ Handler submit restock
  const handleRestockSubmit = (formData) => {
    restockMutation.mutate({ id: restockItem.id, data: formData });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bahan Mentah</h1>
          <p className="text-gray-500 text-sm">Kelola bahan baku produksi</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Bahan
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari bahan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Stok</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga/Unit</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
            ) : data?.data?.data?.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">Belum ada data bahan mentah</td></tr>
            ) : (
              data?.data?.data?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{item.code}</td>
                  <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={parseFloat(item.stock) <= parseFloat(item.min_stock) ? 'text-red-600 font-semibold' : ''}>
                        {item.stock} {item.unit}
                      </span>
                      {parseFloat(item.stock) <= parseFloat(item.min_stock) && (
                        <AlertTriangle className="w-4 h-4 text-amber-500" title="Stok menipis" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{item.min_stock} {item.unit}</td>
                  <td className="px-4 py-3 text-sm">Rp {parseFloat(item.price_per_unit).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* ✅ Tombol Tambah Stok */}
                      <button
                        onClick={() => handleRestock(item)}
                        className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg transition"
                        title="Tambah Stok"
                      >
                        <PackagePlus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data?.data?.meta && (
          <div className="px-4 py-3 border-t flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-500">
              Menampilkan {data.data.data?.length} dari {data.data.meta.total} data
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page === data.data.meta.last_page} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form (Tambah/Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        title={editingItem ? 'Edit Bahan Mentah' : 'Tambah Bahan Mentah'}
      >
        <RawMaterialForm
          initialData={editingItem}
          onSubmit={handleSubmit}
          onCancel={() => { setIsModalOpen(false); setEditingItem(null); }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      {/* ✅ Modal Restock (Tambah Stok) */}
      <Modal
        isOpen={isRestockOpen}
        onClose={() => { setIsRestockOpen(false); setRestockItem(null); }}
        title={`Tambah Stok: ${restockItem?.name || ''}`}
      >
        <RestockForm
          item={restockItem}
          onSubmit={handleRestockSubmit}
          onCancel={() => { setIsRestockOpen(false); setRestockItem(null); }}
          loading={restockMutation.isPending}
        />
      </Modal>
    </div>
  );
}

// ==========================================
// FORM TAMBAH/EDIT BAHAN MENTAH
// ==========================================
function RawMaterialForm({ initialData, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    name: initialData?.name || '',
    unit: initialData?.unit || 'kg',
    stock: initialData?.stock || 0,
    min_stock: initialData?.min_stock || 0,
    price_per_unit: initialData?.price_per_unit || 0,
    is_available: initialData?.is_available ?? true,
    description: initialData?.description || '',
  });

  const isEditMode = !!initialData;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? checked 
        : ['stock', 'min_stock', 'price_per_unit'].includes(name) 
          ? (value === '' ? 0 : parseFloat(value) || 0) 
          : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isEditMode && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>Stok tidak dapat diubah langsung.</strong> Gunakan tombol <strong>"Tambah Stok"</strong> (ikon 📦) di tabel untuk menambah stok bahan ini.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Kode *</label>
          <input type="text" name="code" value={formData.code} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nama *</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Satuan *</label>
          <input type="text" name="unit" value={formData.unit} onChange={handleChange} placeholder="kg, gram, pcs, liter" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Harga per Unit *</label>
          <input type="number" name="price_per_unit" value={formData.price_per_unit} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" step="0.01" min="0" required />
        </div>
      </div>

      {/* ✅ Stok: Read-only saat edit, editable saat tambah baru */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Stok {isEditMode && <span className="text-xs text-gray-500">(Read-only)</span>}
          </label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            readOnly={isEditMode}
            disabled={isEditMode}
            className={`w-full px-3 py-2 border rounded-lg outline-none ${
              isEditMode 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                : 'focus:ring-2 focus:ring-amber-500'
            }`}
            step="0.001"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Min Stok</label>
          <input type="number" name="min_stock" value={formData.min_stock} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" step="0.001" min="0" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Deskripsi</label>
        <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" name="is_available" id="is_available" checked={formData.is_available} onChange={handleChange} className="w-4 h-4 text-amber-500 rounded" />
        <label htmlFor="is_available" className="text-sm font-medium">Tersedia untuk produksi</label>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" type="button" onClick={onCancel}>Batal</Button>
        <Button type="submit" loading={loading}>{initialData ? 'Update' : 'Simpan'}</Button>
      </div>
    </form>
  );
}

// ==========================================
// ✅ FORM RESTOCK (TAMBAH STOK)
// ==========================================
function RestockForm({ item, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    qty: 0,
    notes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'qty' ? (value === '' ? 0 : parseFloat(value) || 0) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.qty <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }
    onSubmit(formData);
  };

  if (!item) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Info stok saat ini */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <PackagePlus className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">{item.name}</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-blue-600">Kode:</span>
            <span className="ml-2 font-mono font-medium">{item.code}</span>
          </div>
          <div>
            <span className="text-blue-600">Stok Saat Ini:</span>
            <span className="ml-2 font-bold">{item.stock} {item.unit}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Jumlah Ditambah *</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="qty"
            value={formData.qty}
            onChange={handleChange}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            step="0.001"
            min="0.001"
            placeholder="0"
            required
            autoFocus
          />
          <span className="text-sm font-medium text-gray-600 min-w-[60px]">{item.unit}</span>
        </div>
        {formData.qty > 0 && (
          <p className="text-xs text-green-600 mt-1">
            ✓ Stok baru: <strong>{(parseFloat(item.stock) + formData.qty).toFixed(3)} {item.unit}</strong>
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Catatan (Opsional)</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="2"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          placeholder="Contoh: Pembelian dari supplier XYZ"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" type="button" onClick={onCancel}>Batal</Button>
        <Button type="submit" loading={loading} className="bg-green-600 hover:bg-green-700">
          <PackagePlus className="w-4 h-4 mr-2" />
          Tambah Stok
        </Button>
      </div>
    </form>
  );
}