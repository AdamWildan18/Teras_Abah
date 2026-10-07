import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../api/productApi';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function ProductPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const queryClient = useQueryClient();

  // Fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', search, category, page],
    queryFn: async () => {
        console.log('Fetching products with params:', { search, category, page });
        const response = await productApi.getAll({ search, category, page, per_page: 15 });
        console.log('API Response:', response);
        console.log('Response data:', response.data);
        return response;
    },
    });

    // Debug di console
    if (error) {
    console.error('Query error:', error);
    }
  // Create mutation
const createMutation = useMutation({
  mutationFn: productApi.create,
  onSuccess: () => {
    // Invalidate dengan pattern yang lebih spesifik
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['products-all'] });
    setIsModalOpen(false);
    setEditingItem(null);
    toast.success('Produk berhasil ditambahkan');
  },
  onError: (error) => {
    console.error('Create product error:', error);
    toast.error(error.response?.data?.message || 'Gagal menambahkan produk');
  },
});

// Update mutation
const updateMutation = useMutation({
  mutationFn: ({ id, data }) => productApi.update(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['products-all'] });
    setIsModalOpen(false);
    setEditingItem(null);
    toast.success('Produk berhasil diupdate');
  },
  onError: (error) => {
    console.error('Update product error:', error);
    toast.error(error.response?.data?.message || 'Gagal mengupdate produk');
  },
});

// Delete mutation
const deleteMutation = useMutation({
  mutationFn: productApi.delete,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['products-all'] });
    toast.success('Produk berhasil dihapus');
  },
  onError: (error) => {
    console.error('Delete product error:', error);
    toast.error(error.response?.data?.message || 'Gagal menghapus produk');
  },
});

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus produk ini?')) {
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Produk Jadi</h1>
          <p className="text-gray-500 text-sm">Kelola menu yang dijual ke customer</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Tambah Produk
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Semua Kategori</option>
            <option value="bakso">Bakso</option>
            <option value="mie">Mie</option>
            <option value="minuman">Minuman</option>
            <option value="lainnya">Nasi</option>
            <option value="lainnya">Roti</option>
            <option value="lainnya">Snack</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga Jual</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
                <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    Memuat data...
                </td>
                </tr>
            ) : (
                <>
                {/* Debug: Tampilkan struktur data */}
                {console.log('ProductPage Data:', data)}
                {console.log('ProductPage data.data:', data?.data)}
                
                {/* Coba akses dengan berbagai cara */}
                {(() => {
                    // Cara 1: data.data.data (3 level)
                    const items1 = data?.data?.data;
                    // Cara 2: data.data (2 level)
                    const items2 = data?.data;
                    // Pilih yang array
                    const items = Array.isArray(items1) ? items1 : Array.isArray(items2) ? items2 : [];
                    
                    if (items.length === 0) {
                    return (
                        <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                            Belum ada data produk
                        </td>
                        </tr>
                    );
                    }
                    
                    return items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono">{item.code}</td>
                        <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {item.category || '-'}
                        </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                        Rp {Number(item.selling_price).toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span>{item.stock}</span>
                        </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                            item.is_available 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                            {item.is_available ? 'Tersedia' : 'Tidak Tersedia'}
                        </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                            >
                            <Edit className="w-4 h-4" />
                            </button>
                            <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition"
                            >
                            <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        </td>
                    </tr>
                    ));
                })()}
                </>
            )}
            </tbody>
        </table>

        {/* Pagination */}
            {(() => {
            // Coba akses meta dengan berbagai cara
            const meta = data?.data?.meta || data?.meta;
            
            if (!meta) return null;
            
            const total = meta.total || 0;
            const currentPage = meta.current_page || 1;
            const lastPage = meta.last_page || 1;
            const perPage = meta.per_page || 15;
            
            // Hitung jumlah item yang ditampilkan
            const items = data?.data?.data || data?.data || [];
            const showing = Array.isArray(items) ? items.length : 0;
            
            return (
                <div className="px-4 py-3 border-t flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    Menampilkan {showing} dari {total} data
                </div>
                <div className="flex gap-2">
                    <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                    >
                    Previous
                    </Button>
                    <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === lastPage}
                    onClick={() => setPage(currentPage + 1)}
                    >
                    Next
                    </Button>
                </div>
                </div>
            );
            })()}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Produk' : 'Tambah Produk'}
      >
        <ProductForm
          initialData={editingItem}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  );
}

function ProductForm({ initialData, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    name: initialData?.name || '',
    category: initialData?.category || '',
    selling_price: initialData?.selling_price || 0,
    stock: initialData?.stock || 0,
    is_available: initialData?.is_available ?? true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? checked 
        : ['selling_price', 'stock'].includes(name)
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Kode *</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nama *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Kategori</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Semua Kategori</option>
            <option value="bakso">Bakso</option>
            <option value="mie">Mie</option>
            <option value="minuman">Minuman</option>
            <option value="lainnya">Nasi</option>
            <option value="lainnya">Roti</option>
            <option value="lainnya">Snack</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Harga Jual *</label>
          <input
            type="number"
            name="selling_price"
            value={formData.selling_price}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
            step="0.01"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Stok Awal</label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
            step="0.001"
          />
        </div>
        <div className="flex items-center pt-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_available"
              checked={formData.is_available}
              onChange={handleChange}
              className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
            />
            <span className="text-sm font-medium">Tersedia untuk dijual</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" type="button" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" loading={loading}>
          {initialData ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}