import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeApi } from '../api/recipeApi';
import { rawMaterialApi } from '../api/rawMaterialApi';
import { productApi } from '../api/productApi';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, ChefHat, X, Loader2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function RecipePage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const queryClient = useQueryClient();

  // 1. Fetch recipes
  const { data, isLoading } = useQuery({
    queryKey: ['recipes', search, page],
    queryFn: () => recipeApi.getAll({ search, page, per_page: 15 }),
  });

  // 2. Fetch products for dropdown
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => {
      const response = await productApi.getAllForDropdown();
      console.log('📦 RAW Products API Response:', response);
      return response;
    },
  });

  // 3. Fetch raw materials for dropdown
  const { data: rawMaterialsData, isLoading: materialsLoading, error: materialsError } = useQuery({
    queryKey: ['raw-materials-all'],
    queryFn: async () => {
      const response = await rawMaterialApi.getAllForDropdown();
      console.log('🥩 RAW Materials API Response:', response);
      return response;
    },
  });

  // 4. FIX: Handle Double-Nested Response
console.log('🔍 productsData:', productsData);
console.log('🔍 rawMaterialsData:', rawMaterialsData);

// Handle berbagai kemungkinan struktur response
const getArrayFromResponse = (responseData) => {
  if (!responseData) return [];
  
  // Kasus 1: {data: [...]} (normal)
  if (Array.isArray(responseData.data)) {
    return responseData.data;
  }
  
  // Kasus 2: {data: {data: [...]}} (double nested - INI MASALAHNYA!)
  if (responseData.data?.data && Array.isArray(responseData.data.data)) {
    return responseData.data.data;
  }
  
  // Kasus 3: responseData itu sendiri adalah array
  if (Array.isArray(responseData)) {
    return responseData;
  }
  
  return [];
};

const productsArray = getArrayFromResponse(productsData);
const rawMaterialsArray = getArrayFromResponse(rawMaterialsData);

console.log('✅ Final Products Array:', productsArray);
console.log('✅ Final Raw Materials Array:', rawMaterialsArray);
console.log(' Products count:', productsArray.length);
console.log('📊 Raw Materials count:', rawMaterialsArray.length);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: recipeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setIsModalOpen(false);
      setEditingItem(null);
      toast.success('Resep berhasil ditambahkan');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal menambahkan resep');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => recipeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setIsModalOpen(false);
      setEditingItem(null);
      toast.success('Resep berhasil diupdate');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal mengupdate resep');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: recipeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Resep berhasil dihapus');
    },
  });

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus resep ini?')) {
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

  // Safe extraction untuk table data
  const tableItems = Array.isArray(data?.data?.data) ? data.data.data : [];
  const meta = data?.data?.meta || {};
  const totalItems = Array.isArray(meta.total) ? meta.total[0] : (meta.total || 0);
  const currentPage = Array.isArray(meta.current_page) ? meta.current_page[0] : (meta.current_page || 1);
  const lastPage = Array.isArray(meta.last_page) ? meta.last_page[0] : (meta.last_page || 1);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Resep Produk</h1>
          <p className="text-gray-500 text-sm">Kelola resep dan bahan yang dibutuhkan</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Tambah Resep
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari resep..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hasil Produksi</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Bahan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catatan</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">Memuat data...</td>
              </tr>
            ) : tableItems.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">Belum ada data resep</td>
              </tr>
            ) : (
              tableItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <ChefHat className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-medium">{item.product?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{item.product?.code || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{item.yield_qty} {item.yield_unit}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {Array.isArray(item.items) ? item.items.length : 0} bahan
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.notes || '-'}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition">
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
        {totalItems > 0 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Menampilkan {tableItems.length} dari {totalItems} data
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Resep' : 'Tambah Resep'}
        size="lg"
      >
        {/* Kondisi 1: Sedang Loading */}
        {productsLoading || materialsLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
            <p className="text-gray-600">Memuat data produk dan bahan...</p>
          </div>
        ) : 
        /* Kondisi 2: Data Kosong (Panel Debug Visual) */
        productsArray.length === 0 || rawMaterialsArray.length === 0 ? (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-yellow-800 font-semibold mb-2">⚠️ Data Kosong dari API</h3>
            <p className="text-yellow-700 text-sm mb-4">
              API tidak mengembalikan data produk atau bahan mentah. Pastikan:
            </p>
            <ul className="text-yellow-700 text-sm list-disc list-inside space-y-1 mb-4">
              <li>Produk sudah ditambahkan di menu <strong>Inventory → Produk Jadi</strong></li>
              <li>Bahan Mentah sudah ditambahkan di menu <strong>Inventory → Bahan Mentah</strong></li>
              <li>Server Laravel sedang berjalan di <code>http://localhost:8000</code></li>
            </ul>
            <div className="mt-4 p-3 bg-white rounded border border-yellow-200">
              <p className="text-xs text-gray-600 font-mono mb-1">Debug Info:</p>
              <p className="text-xs text-gray-600">Products count: {productsArray.length}</p>
              <p className="text-xs text-gray-600">Raw Materials count: {rawMaterialsArray.length}</p>
              <p className="text-xs text-gray-600 break-all">productsData: {JSON.stringify(productsData)}</p>
              <p className="text-xs text-gray-600 break-all">rawMaterialsData: {JSON.stringify(rawMaterialsData)}</p>
              {productsError && <p className="text-xs text-red-600 mt-1">Products Error: {productsError.message}</p>}
              {materialsError && <p className="text-xs text-red-600">Materials Error: {materialsError.message}</p>}
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition text-sm font-medium"
            >
              🔄 Refresh Halaman
            </button>
          </div>
        ) : 
        /* Kondisi 3: Data Ada, Render Form */
        (
          <RecipeForm
            initialData={editingItem}
            products={productsArray}
            rawMaterials={rawMaterialsArray}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingItem(null);
            }}
            loading={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}

// ==========================================
// COMPONENT FORM RESEP
// ==========================================
// PERHATIAN: `products = []` dan `rawMaterials = []` mencegah error undefined
function RecipeForm({ initialData, products = [], rawMaterials = [], onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    product_id: initialData?.product?.id || '',
    yield_qty: initialData?.yield_qty || 1,
    yield_unit: initialData?.yield_unit || 'porsi',
    notes: initialData?.notes || '',
    items: initialData?.items || [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'yield_qty' ? parseInt(value) || 0 : value,
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { raw_material_id: '', qty: 0, unit: '' }],
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: field === 'qty' ? parseFloat(value) || 0 : value } : item
      ),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast.error('Minimal harus ada 1 bahan dalam resep');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product Selection */}
      <div>
        <label className="block text-sm font-medium mb-1">Produk *</label>
        <select
          name="product_id"
          value={formData.product_id}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
          required
          disabled={!!initialData}
        >
          <option value="">Pilih produk</option>
          {Array.isArray(products) && products.map(product => (
            <option key={product.id} value={product.id}>
              {product.name} ({product.code})
            </option>
          ))}
        </select>
        {initialData && (
          <p className="text-xs text-gray-500 mt-1">
            Produk tidak bisa diubah. Hapus resep dan buat baru jika ingin mengganti produk.
          </p>
        )}
      </div>

      {/* Yield */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Hasil Produksi *</label>
          <input
            type="number"
            name="yield_qty"
            value={formData.yield_qty}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
            min="1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Satuan Hasil *</label>
          <input
            type="text"
            name="yield_unit"
            value={formData.yield_unit}
            onChange={handleChange}
            placeholder="porsi, pcs, pack"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Bahan-bahan *</label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4" />
            Tambah Bahan
          </Button>
        </div>

        <div className="space-y-3">
          {formData.items.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
              <p className="text-gray-500 text-sm">Belum ada bahan. Klik "Tambah Bahan" untuk menambahkan.</p>
            </div>
          ) : (
            formData.items.map((item, index) => (
              <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <select
                    value={item.raw_material_id}
                    onChange={(e) => updateItem(index, 'raw_material_id', e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">Pilih bahan</option>
                    {Array.isArray(rawMaterials) && rawMaterials.map(material => (
                      <option key={material.id} value={material.id}>
                        {material.name} (Stok: {material.stock} {material.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) => updateItem(index, 'qty', e.target.value)}
                    placeholder="Qty"
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    step="0.001"
                    min="0.001"
                    required
                  />
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    placeholder="Unit (kg, pcs)"
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1">Catatan</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          placeholder="Catatan tambahan untuk resep ini..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" type="button" onClick={onCancel}>Batal</Button>
        <Button type="submit" loading={loading}>{initialData ? 'Update' : 'Simpan'}</Button>
      </div>
    </form>
  );
}