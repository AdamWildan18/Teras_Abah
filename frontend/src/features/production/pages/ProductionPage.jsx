import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionApi } from '../api/productionApi';
import { productApi } from '../../inventory/api/productApi';
import { toast } from 'sonner';
import { 
  Plus, Search, Eye, XCircle, ChefHat, Package, 
  Calendar, TrendingUp, AlertTriangle, CheckCircle2, Loader2 
} from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function ProductionPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const queryClient = useQueryClient();

  // Fetch production batches
  const { data, isLoading } = useQuery({
    queryKey: ['production-batches', statusFilter, dateFrom, dateTo, page],
    queryFn: async () => {
      const response = await productionApi.getAll({ 
        status: statusFilter, 
        date_from: dateFrom, 
        date_to: dateTo, 
        page, 
        per_page: 15 
      });
      console.log('📦 Production Batches API Response:', response);
      return response;
    },
  });

  // Fetch products for dropdown
  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => {
      const response = await productApi.getAllForDropdown();
      return response;
    },
  });

  // Robust data extraction
  const getArrayFromResponse = (responseData) => {
    if (!responseData) return [];
    if (Array.isArray(responseData.data)) return responseData.data;
    if (responseData.data?.data && Array.isArray(responseData.data.data)) {
      return responseData.data.data;
    }
    if (Array.isArray(responseData)) return responseData;
    return [];
  };

  const products = getArrayFromResponse(productsData);
  const batches = getArrayFromResponse(data);

  // ✅ HITUNG STATISTIK LANGSUNG DARI DATA BATCHES
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7);

  const todayBatches = batches.filter(b => {
    const batchDate = b.production_date || b.created_at || '';
    return batchDate.startsWith(today);
  });

  const monthBatches = batches.filter(b => {
    const batchDate = b.production_date || b.created_at || '';
    return batchDate.startsWith(currentMonth);
  });

  const stats = {
    today: {
      total_batches: todayBatches.length,
      total_produced: todayBatches.reduce((sum, b) => sum + (b.qty_produced || 0), 0),
      total_cost: todayBatches.reduce((sum, b) => sum + parseFloat(b.total_cost || 0), 0),
    },
    this_month: {
      total_batches: monthBatches.length,
      total_produced: monthBatches.reduce((sum, b) => sum + (b.qty_produced || 0), 0),
      total_cost: monthBatches.reduce((sum, b) => sum + parseFloat(b.total_cost || 0), 0),
    },
  };

  console.log(' Stats Calculated:', stats);
  console.log('📅 Today:', today, 'Batches:', todayBatches.length);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: productionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-batches'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      toast.success('Produksi berhasil dilakukan!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal melakukan produksi');
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: productionApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-batches'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsDetailOpen(false);
      toast.success('Produksi berhasil dibatalkan');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal membatalkan produksi');
    },
  });

  const handleViewDetail = (batch) => {
    setSelectedBatch(batch);
    setIsDetailOpen(true);
  };

  const handleCancel = (batch) => {
    if (window.confirm(`Yakin ingin membatalkan batch ${batch.batch_code}? Stok akan dikembalikan.`)) {
      cancelMutation.mutate(batch.id);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Produksi</h1>
          <p className="text-gray-500 text-sm">Kelola batch produksi dan stok produk</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Buat Produksi
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Hari Ini</span>
          </div>
          <p className="text-2xl font-bold">{stats.today.total_batches} <span className="text-sm font-normal text-gray-500">batch</span></p>
          <p className="text-sm text-gray-600 mt-1">
            {stats.today.total_produced} unit • Rp {stats.today.total_cost.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm text-gray-500">Bulan Ini</span>
          </div>
          <p className="text-2xl font-bold">{stats.this_month.total_batches} <span className="text-sm font-normal text-gray-500">batch</span></p>
          <p className="text-sm text-gray-600 mt-1">
            {stats.this_month.total_produced} unit • Rp {stats.this_month.total_cost.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Total Batch</span>
          </div>
          <p className="text-2xl font-bold">{batches.length} <span className="text-sm font-normal text-gray-500">batch</span></p>
          <p className="text-sm text-gray-600 mt-1">Semua waktu</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Semua Status</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biaya</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">Memuat data...</td>
              </tr>
            ) : batches.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="w-12 h-12 text-gray-300" />
                    <p>Belum ada data produksi</p>
                    <p className="text-xs text-gray-400">Klik "Buat Produksi" untuk membuat batch pertama</p>
                  </div>
                </td>
              </tr>
            ) : (
              batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-medium">{batch.batch_code}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-medium text-sm">{batch.product?.name}</div>
                        <div className="text-xs text-gray-500">{batch.product?.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">{batch.qty_produced} unit</td>
                  <td className="px-4 py-3 text-sm">Rp {(batch.total_cost || 0).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{batch.production_date}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      batch.status === 'completed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {batch.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDetail(batch)}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {batch.status === 'completed' && (
                        <button
                          onClick={() => handleCancel(batch)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition"
                          title="Batalkan"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Buat Produksi */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Batch Produksi"
        size="lg"
      >
        <ProductionForm
          products={products}
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setIsModalOpen(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Modal Detail */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedBatch(null); }}
        title={`Detail Batch: ${selectedBatch?.batch_code || ''}`}
        size="lg"
      >
        {selectedBatch && (
          <BatchDetail 
            batch={selectedBatch} 
            onCancel={() => handleCancel(selectedBatch)}
            isCancelling={cancelMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}

// ==========================================
// FORM PRODUKSI
// ==========================================
function ProductionForm({ products = [], onSubmit, onCancel, loading }) {
  const [productId, setProductId] = useState('');
  const [qtyProduce, setQtyProduce] = useState(1);
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const handlePreview = async () => {
    if (!productId || qtyProduce < 1) {
      toast.error('Pilih produk dan jumlah produksi');
      return;
    }
    
    setPreviewLoading(true);
    setPreviewError('');
    setPreview(null);
    
    try {
      const response = await productionApi.preview({ 
        product_id: parseInt(productId), 
        qty_produce: parseInt(qtyProduce) 
      });
      
      const previewData = response.data?.data || response.data;
      
      if (!previewData) {
        throw new Error('Response data kosong');
      }
      
      setPreview(previewData);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Gagal memuat preview';
      setPreviewError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!preview || !preview.all_sufficient) {
      toast.error('Stok bahan tidak mencukupi');
      return;
    }
    onSubmit({
      product_id: parseInt(productId),
      qty_produced: parseInt(qtyProduce),
      production_date: productionDate,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Produk *</label>
          <select
            value={productId}
            onChange={(e) => { setProductId(e.target.value); setPreview(null); setPreviewError(''); }}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
            required
          >
            <option value="">Pilih produk</option>
            {Array.isArray(products) && products.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Jumlah Produksi *</label>
          <input
            type="number"
            value={qtyProduce}
            onChange={(e) => { setQtyProduce(e.target.value); setPreview(null); setPreviewError(''); }}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
            min="1"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tanggal Produksi</label>
          <input
            type="date"
            value={productionDate}
            onChange={(e) => setProductionDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="flex items-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handlePreview} 
            disabled={!productId || previewLoading}
            className="w-full"
          >
            {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            {previewLoading ? 'Memuat...' : 'Preview Bahan'}
          </Button>
        </div>
      </div>

      {previewError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Gagal Memuat Preview</h4>
              <p className="text-sm text-red-700 mt-1">{previewError}</p>
            </div>
          </div>
        </div>
      )}

      {preview && !previewError && (
        <div className={`border rounded-lg p-4 ${preview.all_sufficient ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              {preview.all_sufficient ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              Preview Bahan Dibutuhkan
            </h4>
            <span className="text-sm text-gray-600">
              Multiplier: <strong>{preview.multiplier || 0}x</strong>
            </span>
          </div>

          {Array.isArray(preview.items) && preview.items.length > 0 ? (
            <table className="w-full text-sm mb-3">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Bahan</th>
                  <th className="text-right py-2">Dibutuhkan</th>
                  <th className="text-right py-2">Stok</th>
                  <th className="text-right py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.items.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-2">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.code}</div>
                    </td>
                    <td className="text-right py-2">{item.qty_needed} {item.unit}</td>
                    <td className="text-right py-2">{item.stock_available} {item.unit}</td>
                    <td className="text-right py-2">
                      {item.is_sufficient ? (
                        <span className="text-green-600 text-xs font-medium">✓ Cukup</span>
                      ) : (
                        <span className="text-red-600 text-xs font-medium">
                          ✗ Kurang {(item.qty_needed - item.stock_available).toFixed(2)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">Tidak ada item bahan</div>
          )}

          <div className="flex justify-between items-center pt-3 border-t">
            <div>
              <div className="text-xs text-gray-600">Estimasi Biaya Produksi</div>
              <div className="text-lg font-bold text-gray-800">
                Rp {(preview.total_cost || 0).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Catatan</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="2"
          placeholder="Catatan produksi (opsional)..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" type="button" onClick={onCancel}>Batal</Button>
        <Button 
          type="submit" 
          loading={loading} 
          disabled={!preview || !preview.all_sufficient}
        >
          {preview?.all_sufficient ? 'Konfirmasi Produksi' : 'Preview Dulu'}
        </Button>
      </div>
    </form>
  );
}

// ==========================================
// DETAIL BATCH
// ==========================================
function BatchDetail({ batch, onCancel, isCancelling }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="text-xs text-gray-500">Batch Code</div>
          <div className="font-mono font-semibold">{batch.batch_code}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Produk</div>
          <div className="font-semibold">{batch.product?.name}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Qty Produksi</div>
          <div className="font-semibold">{batch.qty_produced} unit</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Total Biaya</div>
          <div className="font-semibold">Rp {(batch.total_cost || 0).toLocaleString('id-ID')}</div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Bahan yang Digunakan
        </h4>
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Bahan</th>
              <th className="px-3 py-2 text-right">Qty Dipakai</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {batch.batch_items?.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-2">
                  <div className="font-medium">{item.raw_material?.name}</div>
                  <div className="text-xs text-gray-500">{item.raw_material?.code}</div>
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {item.qty_used} {item.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {batch.status === 'completed' && (
        <div className="pt-4 border-t">
          <Button 
            variant="danger" 
            onClick={onCancel} 
            loading={isCancelling}
            className="w-full"
          >
            <XCircle className="w-4 h-4" />
            Batalkan Produksi (Rollback Stok)
          </Button>
        </div>
      )}
    </div>
  );
}