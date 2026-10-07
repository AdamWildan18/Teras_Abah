import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendanceApi';
import { toast } from 'sonner';
import { 
  Calendar, QrCode, UserCheck, Clock, 
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import api from '../../../lib/axios';

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // ✅ Fetch absensi hari ini
  const { data, isLoading } = useQuery({
    queryKey: ['attendance-today', selectedDate],
    queryFn: () => attendanceApi.getToday({ date: selectedDate }),
    retry: 1,
  });

  // ✅ Fetch daftar karyawan untuk dropdown
  const { data: usersData } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => api.get('/users?role=karyawan,kasir,produksi'),
  });

  const employees = usersData?.data?.data || [];
  const attendances = data?.data?.data?.attendances || [];
  const summary = data?.data?.data?.summary || {};

  // Mutations
  const manualMutation = useMutation({
    mutationFn: attendanceApi.inputManual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      setIsManualModalOpen(false);
      toast.success('Absensi berhasil disimpan');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Gagal'),
  });

  const scanMutation = useMutation({
    mutationFn: attendanceApi.scan,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      setIsScanModalOpen(false);
      toast.success(response.data.message);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Gagal'),
  });

  const handleManualSubmit = (formData) => {
    manualMutation.mutate({ ...formData, date: selectedDate });
  };

  const handleScan = (qrCode, type) => {
    scanMutation.mutate({ qr_code: qrCode, type });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Absensi Karyawan</h1>
          <p className="text-gray-500 text-sm">Kelola kehadiran karyawan</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <Button onClick={() => setIsManualModalOpen(true)}>
            <UserCheck className="w-4 h-4 mr-2" />
            Input Manual
          </Button>
          <Button variant="outline" onClick={() => setIsScanModalOpen(true)}>
            <QrCode className="w-4 h-4 mr-2" />
            Scan QR
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard label="Total" value={summary.total || 0} color="blue" />
        <SummaryCard label="Hadir" value={summary.hadir || 0} color="green" />
        <SummaryCard label="Izin" value={summary.izin || 0} color="blue" />
        <SummaryCard label="Sakit" value={summary.sakit || 0} color="yellow" />
        <SummaryCard label="Alpha" value={summary.alpha || 0} color="red" />
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">Daftar Absensi - {selectedDate}</h2>
        </div>
        <div className="divide-y">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Memuat...</div>
          ) : attendances.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Belum ada data absensi untuk tanggal ini</div>
          ) : (
            attendances.map((att, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium">{att.user?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{att.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {att.check_in?.time ? `In: ${att.check_in.time}` : 'Belum check-in'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {att.check_out?.time ? `Out: ${att.check_out.time}` : 'Belum check-out'}
                      </p>
                    </div>
                    <StatusBadge status={att.status} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {isManualModalOpen && (
        <ManualAttendanceModal
          employees={employees}
          date={selectedDate}
          onSubmit={handleManualSubmit}
          onCancel={() => setIsManualModalOpen(false)}
          loading={manualMutation.isPending}
        />
      )}

      {isScanModalOpen && (
        <ScanModal
          onScan={handleScan}
          onCancel={() => setIsScanModalOpen(false)}
          loading={scanMutation.isPending}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
  };
  return (
    <div className={`p-4 rounded-xl ${colors[color]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    hadir: 'bg-green-100 text-green-700',
    izin: 'bg-blue-100 text-blue-700',
    sakit: 'bg-yellow-100 text-yellow-700',
    cuti: 'bg-purple-100 text-purple-700',
    alpha: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
  );
}

// ✅ Modal Input Manual dengan Dropdown Karyawan yang Terisi
function ManualAttendanceModal({ employees, date, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    user_id: '',
    type: 'check_in',
    status: 'hadir',
    time: new Date().toTimeString().slice(0, 5), // ✅ Ini sudah benar (format 24 jam)
    notes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.user_id) {
      toast.error('Pilih karyawan terlebih dahulu');
      return;
    }
    onSubmit(formData);
  };

  return (
    <Modal isOpen={true} onClose={onCancel} title="Input Absensi Manual">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Karyawan *</label>
          <select 
            name="user_id" 
            value={formData.user_id} 
            onChange={handleChange} 
            className="w-full px-3 py-2 border rounded-lg" 
            required
          >
            <option value="">Pilih karyawan</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.role})
              </option>
            ))}
          </select>
          {employees.length === 0 && (
            <p className="text-xs text-red-500 mt-1">
              ⚠️ Tidak ada karyawan. Tambahkan karyawan di menu "Data Karyawan" terlebih dahulu.
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipe *</label>
            <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="check_in">Check In</option>
              <option value="check_out">Check Out</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status *</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="hadir">Hadir</option>
              <option value="izin">Izin</option>
              <option value="sakit">Sakit</option>
              <option value="cuti">Cuti</option>
              <option value="alpha">Alpha</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Waktu</label>
          <input 
            type="time" 
            name="time" 
            value={formData.time} 
            onChange={handleChange} 
            className="w-full px-3 py-2 border rounded-lg"
            step="1" // ✅ Tambahkan ini agar bisa pilih detik jika perlu
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: 24 jam (contoh: 16:45)
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Catatan</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2" className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" type="button" onClick={onCancel}>Batal</Button>
          <Button type="submit" loading={loading}>Simpan</Button>
        </div>
      </form>
    </Modal>
  );
}

function ScanModal({ onScan, onCancel, loading }) {
  const [qrCode, setQrCode] = useState('');
  const [scanType, setScanType] = useState('check_in');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!qrCode) {
      toast.error('QR Code tidak boleh kosong');
      return;
    }
    
    // ✅ Pastikan onScan dipanggil dengan parameter yang benar
    onScan(qrCode, scanType);
  };

  return (
    <Modal isOpen={true} onClose={onCancel} title="Scan QR Code Absensi">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Mintakan karyawan untuk menunjukkan QR Code mereka, lalu scan atau masukkan kode di bawah ini.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tipe Absensi *</label>
          <select 
            value={scanType} 
            onChange={(e) => setScanType(e.target.value)} 
            className="w-full px-3 py-2 border rounded-lg" 
            required
          >
            <option value="check_in">Check In</option>
            <option value="check_out">Check Out</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">QR Code / Kode Karyawan *</label>
          <input
            type="text"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="USR-1-ABCD1234"
            required
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" type="button" onClick={onCancel}>Batal</Button>
          <Button type="submit" loading={loading}>Proses</Button>
        </div>
      </form>
    </Modal>
  );
}