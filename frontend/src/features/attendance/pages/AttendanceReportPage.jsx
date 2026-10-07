import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendanceApi';
import { Calendar, Download, Filter, Users, CheckCircle, Clock, AlertCircle, FileText, TrendingUp } from 'lucide-react';
import Button from '../../../components/ui/Button';
import api from '../../../lib/axios';

export default function AttendanceReportPage() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // ✅ State filter sebagai OBJECT, bukan string
  const [filters, setFilters] = useState({
    date_from: firstDay.toISOString().split('T')[0],
    date_to: today.toISOString().split('T')[0],
    user_id: '',
    role: '',
  });

  // ✅ Fetch laporan dengan object filters
  const { data, isLoading } = useQuery({
    queryKey: ['attendance-report', filters],
    queryFn: () => attendanceApi.getReport(filters),
  });

  const reportData = data?.data?.data || {};
  const attendances = reportData.attendances || [];
  const summaryByUser = reportData.summary_by_user || [];
  const totalSummary = reportData.total_summary || {};

  // Fetch daftar karyawan untuk filter
  const { data: usersData } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => api.get('/users?role=karyawan,kasir,produksi,admin,owner'),
  });
  const employees = usersData?.data?.data || [];

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    setFilters({
      date_from: firstDay.toISOString().split('T')[0],
      date_to: today.toISOString().split('T')[0],
      user_id: '',
      role: '',
    });
  };

  // Export ke CSV
  const handleExportCSV = () => {
    if (attendances.length === 0) {
      alert('Tidak ada data untuk diexport');
      return;
    }

    const headers = ['Tanggal', 'Nama Karyawan', 'Role', 'Tipe', 'Status', 'Waktu', 'Metode', 'Catatan'];
    const rows = attendances.map(att => [
      att.date,
      att.user?.name || '-',
      att.user?.role || '-',
      att.type === 'check_in' ? 'Check In' : 'Check Out',
      att.status,
      att.time || '-',
      att.method,
      att.notes || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-absensi-${filters.date_from}-s/d-${filters.date_to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    const colors = {
      hadir: 'bg-green-100 text-green-700',
      izin: 'bg-blue-100 text-blue-700',
      sakit: 'bg-yellow-100 text-yellow-700',
      cuti: 'bg-purple-100 text-purple-700',
      alpha: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan Absensi</h1>
          <p className="text-gray-500 text-sm">Rekap kehadiran karyawan</p>
        </div>
        <Button onClick={handleExportCSV} disabled={attendances.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600" />
          <h2 className="font-semibold text-gray-700">Filter Laporan</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dari Tanggal</label>
            <input type="date" name="date_from" value={filters.date_from} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sampai Tanggal</label>
            <input type="date" name="date_to" value={filters.date_to} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Karyawan</label>
            <select name="user_id" value={filters.user_id} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">Semua Karyawan</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select name="role" value={filters.role} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
              <option value="kasir">Kasir</option>
              <option value="produksi">Produksi</option>
              <option value="karyawan">Karyawan</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <Button variant="outline" size="sm" onClick={handleReset}>Reset Filter</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <SummaryCard label="Total Records" value={totalSummary.total_records || 0} icon={<FileText className="w-5 h-5" />} color="blue" />
        <SummaryCard label="Karyawan" value={totalSummary.total_users || 0} icon={<Users className="w-5 h-5" />} color="purple" />
        <SummaryCard label="Hadir" value={totalSummary.hadir || 0} icon={<CheckCircle className="w-5 h-5" />} color="green" />
        <SummaryCard label="Izin" value={totalSummary.izin || 0} icon={<Clock className="w-5 h-5" />} color="blue" />
        <SummaryCard label="Sakit" value={totalSummary.sakit || 0} icon={<AlertCircle className="w-5 h-5" />} color="yellow" />
        <SummaryCard label="Alpha" value={totalSummary.alpha || 0} icon={<AlertCircle className="w-5 h-5" />} color="red" />
      </div>

      {/* Rekap Per Karyawan */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" /> Rekap Per Karyawan
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hari</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hadir</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Izin</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sakit</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cuti</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Alpha</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {summaryByUser.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">Tidak ada data untuk periode ini</td></tr>
              ) : (
                summaryByUser.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{item.user?.name}</td>
                    <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-gray-100 rounded text-xs uppercase">{item.user?.role}</span></td>
                    <td className="px-4 py-3 text-sm text-center font-semibold">{item.total_days}</td>
                    <td className="px-4 py-3 text-sm text-center"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">{item.hadir}</span></td>
                    <td className="px-4 py-3 text-sm text-center"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{item.izin}</span></td>
                    <td className="px-4 py-3 text-sm text-center"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">{item.sakit}</span></td>
                    <td className="px-4 py-3 text-sm text-center"><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">{item.cuti}</span></td>
                    <td className="px-4 py-3 text-sm text-center"><span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">{item.alpha}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Absensi */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" /> Detail Absensi ({filters.date_from} s/d {filters.date_to})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metode</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : attendances.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">Tidak ada data absensi untuk periode ini</td></tr>
              ) : (
                attendances.map((att, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{att.date}</td>
                    <td className="px-4 py-3 text-sm font-medium">{att.user?.name}</td>
                    <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-gray-100 rounded text-xs uppercase">{att.user?.role}</span></td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${att.type === 'check_in' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {att.type === 'check_in' ? 'Check In' : 'Check Out'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(att.status)}`}>{att.status}</span></td>
                    <td className="px-4 py-3 text-sm font-mono">{att.time || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${att.method === 'scan' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {att.method === 'scan' ? 'Scan' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{att.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    green: 'bg-green-50 text-green-700 border border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    red: 'bg-red-50 text-red-700 border border-red-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  };
  return (
    <div className={`p-4 rounded-xl ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs font-medium">{label}</span></div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}