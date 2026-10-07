import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/axios';
import { Plus, Eye, XCircle, Package, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { toast } from 'sonner';

export default function AddonProductionPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
    queryKey: ['addon-production', statusFilter, dateFrom, dateTo],
    queryFn: () => {
      // ✅ Hanya kirim parameter jika nilainya tidak kosong
      const params = { per_page: 100 };
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      
      return api.get('/addon-production', { params });
    },
  });

  const { data: addOnsData } = useQuery({
    queryKey: ['add-ons-all'],
    queryFn: () => api.get('/add-ons'),
  });

  const batches = data?.data?.data || data?.data || [];
  const addOns = addOnsData?.data?.data || addOnsData?.data || [];

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/addon-production', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addon-production'] });
      queryClient.invalidateQueries({ queryKey: ['add-ons-all'] });
      setIsModalOpen(false);
      toast.success('Produksi add-on berhasil!');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Gagal'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.post(`/addon-production/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addon-production'] });
      queryClient.invalidateQueries({ queryKey: ['add-ons-all'] });
      setIsDetailOpen(false);
      toast.success('Produksi add-on dibatalkan');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Gagal'),
  });

  const handleViewDetail = (batch) => {
    setSelectedBatch(batch);
    setIsDetailOpen(true);
  };

  const handleCancel = (batch) => {
    if (window.confirm(`Batalkan batch ${batch.batch_code}? Stok akan dikembalikan.`)) {
      cancelMutation.mutate(batch.id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Produksi Add-On</h1>
          <p className="text-gray-500 text-sm">Kelola produksi add-on dari bahan mentah</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" /> Buat Produksi
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" placeholder="Cari batch..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 border rounded-lg" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="">Semua Status</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border rounded-lg" placeholder="Dari tanggal" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border rounded-lg" placeholder="Sampai tanggal" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Add-On</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biaya</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center">Memuat...</td></tr>
            ) : batches.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">Belum ada data produksi</td></tr>
            ) : (
              batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-medium">{batch.batch_code}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-medium text-sm">{batch.add_on?.name}</div>
                        <div className="text-xs text-gray-500">{batch.add_on?.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">{batch.qty_produced} unit</td>
                  <td className="px-4 py-3 text-sm">Rp {(batch.total_cost || 0).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{batch.production_date}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      batch.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {batch.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleViewDetail(batch)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </button>
                      {batch.status === 'completed' && (
                        <button onClick={() => handleCancel(batch)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg">
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

      {/* Modal Produksi */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Produksi Add-On" size="lg">
        <AddonProductionForm
          addOns={addOns}
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setIsModalOpen(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Modal Detail */}
      <Modal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelectedBatch(null); }} title={`Detail: ${selectedBatch?.batch_code || ''}`} size="lg">
        {selectedBatch && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div><div className="text-xs text-gray-500">Batch</div><div className="font-mono font-semibold">{selectedBatch.batch_code}</div></div>
              <div><div className="text-xs text-gray-500">Add-On</div><div className="font-semibold">{selectedBatch.add_on?.name}</div></div>
              <div><div className="text-xs text-gray-500">Qty</div><div className="font-semibold">{selectedBatch.qty_produced} unit</div></div>
              <div><div className="text-xs text-gray-500">Biaya</div><div className="font-semibold">Rp {(selectedBatch.total_cost || 0).toLocaleString('id-ID')}</div></div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Bahan yang Digunakan</h4>
              <table className="w-full text-sm border rounded-lg overflow-hidden">
                <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Bahan</th><th className="px-3 py-2 text-right">Qty</th></tr></thead>
                <tbody className="divide-y">
                  {selectedBatch.batch_items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2"><div className="font-medium">{item.raw_material?.name}</div><div className="text-xs text-gray-500">{item.raw_material?.code}</div></td>
                      <td className="px-3 py-2 text-right font-mono">{item.qty_used} {item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedBatch.status === 'completed' && (
              <Button variant="danger" onClick={() => handleCancel(selectedBatch)} loading={cancelMutation.isPending} className="w-full">
                <XCircle className="w-4 h-4" /> Batalkan Produksi
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function AddonProductionForm({ addOns = [], onSubmit, onCancel, loading }) {
  const [addOnId, setAddOnId] = useState('');
  const [qtyProduce, setQtyProduce] = useState(1);
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const handlePreview = async () => {
    if (!addOnId || qtyProduce < 1) {
      toast.error('Pilih add-on dan jumlah produksi');
      return;
    }
    setPreviewLoading(true);
    setPreviewError('');
    setPreview(null);
    try {
      const response = await api.post('/addon-production/preview', {
        add_on_id: parseInt(addOnId),
        qty_produce: parseInt(qtyProduce),
      });
      setPreview(response.data?.data || response.data);
    } catch (error) {
      setPreviewError(error.response?.data?.message || 'Gagal memuat preview');
      toast.error(error.response?.data?.message || 'Gagal');
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
      add_on_id: parseInt(addOnId),
      qty_produced: parseInt(qtyProduce),
      production_date: productionDate,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Add-On *</label>
          <select value={addOnId} onChange={(e) => { setAddOnId(e.target.value); setPreview(null); }} className="w-full px-3 py-2 border rounded-lg" required>
            <option value="">Pilih add-on</option>
            {addOns.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.code}) - Stok: {a.stock}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Jumlah Produksi *</label>
          <input type="number" value={qtyProduce} onChange={(e) => { setQtyProduce(e.target.value); setPreview(null); }} className="w-full px-3 py-2 border rounded-lg" min="1" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tanggal Produksi</label>
          <input type="date" value={productionDate} onChange={(e) => setProductionDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div className="flex items-end">
          <Button type="button" variant="outline" onClick={handlePreview} disabled={!addOnId || previewLoading} className="w-full">
            {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            {previewLoading ? 'Memuat...' : 'Preview Bahan'}
          </Button>
        </div>
      </div>

      {previewError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">{previewError}</p>
          </div>
        </div>
      )}

      {preview && !previewError && (
        <div className={`border rounded-lg p-4 ${preview.all_sufficient ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              {preview.all_sufficient ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
              Preview Bahan Dibutuhkan
            </h4>
            <span className="text-sm">Multiplier: <strong>{preview.multiplier}x</strong></span>
          </div>
          <table className="w-full text-sm mb-3">
            <thead><tr className="border-b"><th className="text-left py-2">Bahan</th><th className="text-right py-2">Dibutuhkan</th><th className="text-right py-2">Stok</th><th className="text-right py-2">Status</th></tr></thead>
            <tbody>
              {preview.items.map((item, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="py-2"><div className="font-medium">{item.name}</div><div className="text-xs text-gray-500">{item.code}</div></td>
                  <td className="text-right py-2">{item.qty_needed} {item.unit}</td>
                  <td className="text-right py-2">{item.stock_available} {item.unit}</td>
                  <td className="text-right py-2">
                    {item.is_sufficient ? <span className="text-green-600 text-xs">✓ Cukup</span> : <span className="text-red-600 text-xs">✗ Kurang</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pt-3 border-t">
            <div className="text-xs text-gray-600">Estimasi Biaya</div>
            <div className="text-lg font-bold">Rp {(preview.total_cost || 0).toLocaleString('id-ID')}</div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Catatan</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="2" className="w-full px-3 py-2 border rounded-lg" placeholder="Catatan (opsional)..." />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" type="button" onClick={onCancel}>Batal</Button>
        <Button type="submit" loading={loading} disabled={!preview || !preview.all_sufficient}>
          {preview?.all_sufficient ? 'Konfirmasi Produksi' : 'Preview Dulu'}
        </Button>
      </div>
    </form>
  );
}