import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendanceApi';
import { toast } from 'sonner';
import { QrCode, Download, RefreshCw, User, Loader2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import api from '../../../lib/axios';

export default function EmployeeQrPage() {
  const [selectedUserId, setSelectedUserId] = useState('');
  const queryClient = useQueryClient();

  // ✅ Fetch daftar karyawan untuk dropdown
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => api.get('/users?role=karyawan,kasir,produksi,admin,owner'),
  });

  const employees = usersData?.data?.data || [];

  // ✅ Fetch QR Code ketika user dipilih
  const { data: qrData, isLoading: qrLoading, refetch } = useQuery({
    queryKey: ['employee-qr', selectedUserId],
    queryFn: () => attendanceApi.getQrCode(selectedUserId),
    enabled: !!selectedUserId,
    retry: 1,
  });

  const qrInfo = qrData?.data?.data || {};

  // ✅ Mutation untuk regenerate QR Code
  const regenerateMutation = useMutation({
    mutationFn: (userId) => attendanceApi.generateQrCode(userId),
    onSuccess: () => {
      refetch();
      toast.success('QR Code berhasil di-generate ulang');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal generate QR Code');
    },
  });

  const handleRegenerate = () => {
    if (!selectedUserId) {
      toast.error('Pilih karyawan terlebih dahulu');
      return;
    }
    if (window.confirm('Yakin ingin generate QR Code baru? QR Code lama tidak akan bisa digunakan lagi.')) {
      regenerateMutation.mutate(selectedUserId);
    }
  };

  const handleDownload = () => {
    if (!qrInfo.qr_image) {
      toast.error('QR Code belum tersedia');
      return;
    }
    
    // Download sebagai file SVG
    const svgContent = qrInfo.qr_image;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-code-${qrInfo.user?.name || 'karyawan'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('QR Code berhasil didownload');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">QR Code Karyawan</h1>
        <p className="text-gray-500 text-sm">Generate dan kelola QR Code untuk absensi scan</p>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <QrCode className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-900">Cara Penggunaan</h3>
          <p className="text-sm text-blue-700 mt-1">
            1. Pilih karyawan dari dropdown di bawah<br />
            2. QR Code akan otomatis di-generate jika belum ada<br />
            3. Download QR Code dan cetak untuk diberikan ke karyawan<br />
            4. Karyawan dapat menggunakan QR Code ini untuk check-in/check-out di halaman Absensi Harian
          </p>
        </div>
      </div>

      {/* Select Karyawan */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <label className="block text-sm font-medium mb-2">Pilih Karyawan *</label>
        {usersLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat daftar karyawan...
          </div>
        ) : employees.length === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              ⚠️ Tidak ada karyawan. Tambahkan karyawan terlebih dahulu di menu <strong>"Data Karyawan"</strong>.
            </p>
          </div>
        ) : (
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="">-- Pilih Karyawan --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.role}) - {emp.email}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* QR Code Display */}
      {selectedUserId && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {qrLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" />
              <p className="text-gray-500">Memuat QR Code...</p>
            </div>
          ) : qrInfo.user ? (
            <div className="flex flex-col items-center space-y-6">
              {/* QR Code Image */}
              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                <div 
                  className="qr-code-display"
                  dangerouslySetInnerHTML={{ __html: qrInfo.qr_image }} 
                />
              </div>

              {/* Info Karyawan */}
              <div className="text-center space-y-2">
                <div className="flex items-center gap-2 justify-center">
                  <User className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-lg text-gray-900">{qrInfo.user.name}</h3>
                </div>
                <p className="text-sm text-gray-500">{qrInfo.user.email}</p>
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                  <span className="text-xs font-medium text-gray-600">Role:</span>
                  <span className="text-xs font-bold text-amber-700 uppercase">{qrInfo.user.role}</span>
                </div>
                {qrInfo.qr_code && (
                  <p className="text-xs font-mono bg-amber-50 text-amber-700 px-3 py-1 rounded mt-2">
                    Kode: {qrInfo.qr_code}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t w-full justify-center">
                <Button 
                  variant="outline" 
                  onClick={handleDownload}
                  disabled={!qrInfo.qr_image}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleRegenerate}
                  loading={regenerateMutation.isPending}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate Baru
                </Button>
              </div>

              {/* Catatan */}
              <div className="bg-gray-50 rounded-lg p-4 w-full max-w-md">
                <p className="text-xs text-gray-600">
                  <strong>Catatan:</strong> Jika Anda menekan "Generate Baru", QR Code lama tidak akan bisa digunakan lagi. 
                  Karyawan harus menggunakan QR Code yang baru dicetak.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Gagal memuat QR Code. Silakan coba pilih karyawan lain.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}