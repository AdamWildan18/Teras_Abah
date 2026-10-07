import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftApi } from '../api/shiftApi';
import api from '../../../lib/axios';
import { toast } from 'sonner';
import { 
  Clock, Users, Plus, Play, Square, DollarSign, 
  TrendingUp, CheckCircle2, AlertCircle, Calendar,
  Edit, Trash2, X, Loader2, Shield
} from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { useRole } from '../../../hooks/useRole';

export default function ShiftPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosingOpen, setIsClosingOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const queryClient = useQueryClient();

  // Role-based permissions
  const { role, canManageShift, isAdmin, isOwner } = useRole();

  // Fetch shift users untuk tanggal terpilih
  const { data: shiftUsersData, isLoading } = useQuery({
    queryKey: ['shift-users', selectedDate],
    queryFn: () => shiftApi.getShiftUsers({ date: selectedDate }),
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['shift-stats', selectedDate],
    queryFn: () => shiftApi.getStats({ date: selectedDate }),
  });

  // Fetch users untuk dropdown
  const { data: usersData } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => api.get('/users'),
    enabled: canManageShift, // Hanya fetch jika user bisa manage shift
  });
  const users = usersData?.data?.data || usersData?.data || [];

  // Fetch shifts master
  const { data: shiftsData } = useQuery({
    queryKey: ['shifts-master'],
    queryFn: shiftApi.getShifts,
    enabled: canManageShift, // Hanya fetch jika user bisa manage shift
  });
  const shifts = shiftsData?.data?.data || shiftsData?.data || [];

  // Robust extraction
  const shiftUsers = shiftUsersData?.data?.data || shiftUsersData?.data || [];
  const stats = statsData?.data?.data || {};

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatTime = (time) => {
    if (!time) return '-';
    return time.substring(0, 5);
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: shiftApi.createShiftUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-users'] });
      queryClient.invalidateQueries({ queryKey: ['shift-stats'] });
      setIsModalOpen(false);
      toast.success('Karyawan berhasil di-assign ke shift');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal assign shift');
    },
  });

  const clockInMutation = useMutation({
    mutationFn: shiftApi.clockIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-users'] });
      queryClient.invalidateQueries({ queryKey: ['shift-stats'] });
      toast.success('Clock in berhasil');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal clock in');
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: ({ id, data }) => shiftApi.clockOut(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-users'] });
      queryClient.invalidateQueries({ queryKey: ['shift-stats'] });
      setIsClosingOpen(false);
      setSelectedShift(null);
      toast.success('Shift berhasil ditutup');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal menutup shift');
    },
  });

  const handleClockOut = (shiftUser) => {
    setSelectedShift(shiftUser);
    setIsClosingOpen(true);
  };

  // Get role badge color
  const getRoleBadgeColor = () => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'owner': return 'bg-purple-100 text-purple-700';
      case 'kasir': return 'bg-blue-100 text-blue-700';
      case 'produksi': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">Shift Karyawan</h1>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium capitalize ${getRoleBadgeColor()}`}>
              <Shield className="w-3 h-3" />
              {role}
            </span>
          </div>
          <p className="text-gray-500 text-sm">Kelola shift kerja dan cash management</p>
        </div>
        
        {/* Tombol Assign Shift - Hanya Admin/Owner */}
        {canManageShift ? (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Assign Shift
          </Button>
        ) : (
          <div className="text-xs text-gray-500 italic">
            * Hanya admin/owner yang dapat assign shift
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total Shift</span>
          </div>
          <p className="text-2xl font-bold">{stats.total_shifts || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Play className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm text-gray-500">Sedang Berjalan</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.active_shifts || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Selesai</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.closed_shifts || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Total Transaksi</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{formatRupiah(stats.total_transactions)}</p>
        </div>
      </div>

      {/* Date Picker */}
      <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4">
        <Calendar className="w-5 h-5 text-gray-400" />
        <label className="text-sm font-medium">Tanggal:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Shift List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-bold text-lg">Daftar Shift</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Karyawan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modal Awal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center">
                    <div className="flex justify-center items-center">
                      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    </div>
                  </td>
                </tr>
              ) : shiftUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    Tidak ada shift untuk tanggal ini
                  </td>
                </tr>
              ) : (
                shiftUsers.map((su) => (
                  <tr key={su.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{su.user?.name}</div>
                      <div className="text-xs text-gray-500">{su.user?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{su.shift?.name}</div>
                      <div className="text-xs text-gray-500">
                        {su.shift?.start_time?.substring(0,5)} - {su.shift?.end_time?.substring(0,5)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {su.clock_in ? formatTime(su.clock_in) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {su.clock_out ? formatTime(su.clock_out) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatRupiah(su.cash_start)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        su.status === 'closed' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {su.status === 'closed' ? <CheckCircle2 className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        {su.status === 'closed' ? 'Selesai' : 'Berjalan'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {su.status === 'open' && (
                        <div className="flex items-center justify-end gap-2">
                          {!su.clock_in ? (
                            <Button
                              size="sm"
                              onClick={() => clockInMutation.mutate(su.id)}
                              loading={clockInMutation.isPending}
                            >
                              <Play className="w-3 h-3" />
                              Clock In
                            </Button>
                          ) : (
                            // Tombol Tutup Shift - Hanya Admin/Owner
                            canManageShift ? (
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleClockOut(su)}
                              >
                                <Square className="w-3 h-3" />
                                Tutup Shift
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                Tunggu admin tutup
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Assign Shift - Hanya Admin/Owner */}
      {isModalOpen && canManageShift && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Assign Karyawan ke Shift"
          size="md"
        >
          <AssignShiftForm
            users={users}
            shifts={shifts}
            selectedDate={selectedDate}
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setIsModalOpen(false)}
            loading={createMutation.isPending}
          />
        </Modal>
      )}

      {/* Modal Closing Shift - Hanya Admin/Owner */}
      {isClosingOpen && selectedShift && canManageShift && (
        <ClosingShiftModal
          shiftUser={selectedShift}
          onClose={() => { setIsClosingOpen(false); setSelectedShift(null); }}
          onSubmit={(data) => clockOutMutation.mutate({ id: selectedShift.id, data })}
          loading={clockOutMutation.isPending}
        />
      )}
    </div>
  );
}

// ==========================================
// FORM ASSIGN SHIFT
// ==========================================
function AssignShiftForm({ users = [], shifts = [], selectedDate, onSubmit, onCancel, loading }) {
  const [userId, setUserId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [cashStart, setCashStart] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      user_id: parseInt(userId),
      shift_id: parseInt(shiftId),
      date: selectedDate,
      cash_start: parseFloat(cashStart) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Tanggal</label>
        <input
          type="date"
          value={selectedDate}
          disabled
          className="w-full px-3 py-2 border rounded-lg bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Karyawan *</label>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
          required
        >
          <option value="">Pilih karyawan</option>
          {Array.isArray(users) && users.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Shift *</label>
        <select
          value={shiftId}
          onChange={(e) => setShiftId(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
          required
        >
          <option value="">Pilih shift</option>
          {Array.isArray(shifts) && shifts.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.start_time?.substring(0,5)} - {s.end_time?.substring(0,5)})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Modal Awal (Kasir)</label>
        <input
          type="number"
          value={cashStart}
          onChange={(e) => setCashStart(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
          min="0"
          step="1000"
        />
        <p className="text-xs text-gray-500 mt-1">Uang tunai di laci saat mulai shift</p>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" type="button" onClick={onCancel}>Batal</Button>
        <Button type="submit" loading={loading}>Assign</Button>
      </div>
    </form>
  );
}

// ==========================================
// MODAL CLOSING SHIFT
// ==========================================
function ClosingShiftModal({ shiftUser, onClose, onSubmit, loading }) {
  const [cashEnd, setCashEnd] = useState(0);

  const cashStart = parseFloat(shiftUser.cash_start) || 0;
  
  const transactionsTotal = Array.isArray(shiftUser.transactions) 
    ? shiftUser.transactions.reduce((sum, t) => {
        const total = parseFloat(t.total) || 0;
        return sum + total;
      }, 0)
    : 0;
  
  const expectedCash = cashStart + transactionsTotal;
  const difference = cashEnd - expectedCash;

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ cash_end: parseFloat(cashEnd) || 0 });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Tutup Shift" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Karyawan</span>
            <span className="font-medium">{shiftUser.user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shift</span>
            <span className="font-medium">{shiftUser.shift?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Clock In</span>
            <span className="font-medium">{shiftUser.clock_in?.substring(0,5)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-600">Modal Awal</span>
            <span className="font-medium">{formatRupiah(cashStart)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Transaksi</span>
            <span className="font-medium">{formatRupiah(transactionsTotal)}</span>
          </div>
          <div className="flex justify-between bg-amber-50 p-2 rounded">
            <span className="font-medium text-amber-700">Uang Seharusnya</span>
            <span className="font-bold text-amber-700">{formatRupiah(expectedCash)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Uang di Laci Sekarang *</label>
          <input
            type="number"
            value={cashEnd}
            onChange={(e) => setCashEnd(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 text-lg font-bold"
            min="0"
            step="1000"
            autoFocus
            required
          />
        </div>

        {cashEnd > 0 && (
          <div className={`p-3 rounded-lg ${
            difference === 0 ? 'bg-green-50 border border-green-200' :
            difference > 0 ? 'bg-blue-50 border border-blue-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {difference === 0 ? <CheckCircle2 className="w-4 h-4 text-green-600" /> :
               difference > 0 ? <TrendingUp className="w-4 h-4 text-blue-600" /> :
               <AlertCircle className="w-4 h-4 text-red-600" />}
              <span className="font-medium text-sm">
                {difference === 0 ? 'Selisih: Rp 0 (Pas!)' :
                 difference > 0 ? `Selisih: +${formatRupiah(difference)} (Kelebihan)` :
                 `Selisih: ${formatRupiah(difference)} (Kurang)`}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" type="button" onClick={onClose}>Batal</Button>
          <Button type="submit" loading={loading}>Tutup Shift</Button>
        </div>
      </form>
    </Modal>
  );
}