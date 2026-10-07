import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/axios';
import { 
  TrendingUp, TrendingDown, Wallet, Receipt, 
  Calendar, FileText, FileSpreadsheet
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function FinancePage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // 1. Ambil data transaksi kasir (Pemasukan)
  const { data: transactionsData, isLoading: loadingTransactions } = useQuery({
    queryKey: ['finance-transactions', dateFrom, dateTo],
    queryFn: async () => {
      const response = await api.get('/transactions', {
        params: {
          date_from: dateFrom,
          date_to: dateTo,
          per_page: 1000,
        },
      });
      console.log('📊 Transactions Response:', response);
      return response;
    },
  });

  // 2. Ambil data Financial Records (Pengeluaran)
  const { data: expensesData, isLoading: loadingExpenses } = useQuery({
    queryKey: ['finance-expenses', dateFrom, dateTo],
    queryFn: async () => {
      const response = await api.get('/finance/records', {
        params: {
          date_from: dateFrom,
          date_to: dateTo,
          type: 'expense',
          per_page: 1000,
        },
      });
      console.log('💰 Expenses Response:', response);
      return response;
    },
  });

  // 3. Parse data dengan SANGAT ROBUST
  const parseData = (responseData) => {
    console.log('🔍 Parsing response:', responseData);
    
    if (!responseData) return [];
    
    // Coba berbagai format response
    if (Array.isArray(responseData)) return responseData;
    if (Array.isArray(responseData.data)) return responseData.data;
    if (responseData.data?.data && Array.isArray(responseData.data.data)) {
      return responseData.data.data;
    }
    if (responseData.data?.records && Array.isArray(responseData.data.records)) {
      return responseData.data.records;
    }
    
    console.warn('⚠️ Tidak bisa parse data:', responseData);
    return [];
  };

  const transactions = parseData(transactionsData);
  const expenses = parseData(expensesData);

  console.log('✅ Parsed Transactions:', transactions);
  console.log('✅ Parsed Expenses:', expenses);

  // 4. Hitung Total Pemasukan
  const totalIncome = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + parseFloat(t.total || 0), 0);

  // 5. Hitung Total Pengeluaran
  const totalExpense = expenses
    .reduce((sum, e) => {
      const amount = parseFloat(e.amount || 0);
      console.log('💵 Expense item:', e, 'Amount:', amount);
      return sum + amount;
    }, 0);

  console.log('💰 Total Income:', totalIncome);
  console.log('💸 Total Expense:', totalExpense);

  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0;

  // 6. Gabungkan data untuk tabel
  const allRecords = [
    ...transactions.map(t => ({
      ...t,
      record_type: 'income',
      date: t.transacted_at,
      description: `Transaksi ${t.invoice_number}`,
      category: 'Pemasukan Kasir',
      amount: parseFloat(t.total || 0),
      reference: t.cashier?.name || '-',
      department: 'Kasir',
    })),
    ...expenses.map(e => ({
      ...e,
      record_type: 'expense',
      date: e.date || e.expense_date || e.created_at,
      description: e.description || e.notes || 'Pengeluaran',
      category: e.category?.name || e.category || 'Umum',
      amount: parseFloat(e.amount || 0),
      reference: e.reference_code || e.reference || '-',
      department: e.department || 'Produksi',
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  console.log(' All Records:', allRecords);

  // 7. Filter untuk tabel
  const filteredRecords = allRecords.filter(record => {
    if (typeFilter !== 'all' && record.record_type !== typeFilter) return false;
    if (departmentFilter !== 'all' && record.department !== departmentFilter) return false;
    return true;
  });

  // 8. Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('TERAS ABAH', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Laporan Keuangan', 105, 22, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Periode: ${formatDate(dateFrom)} - ${formatDate(dateTo)}`, 105, 28, { align: 'center' });
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 105, 34, { align: 'center' });
    
    doc.setDrawColor(0);
    doc.line(14, 38, 196, 38);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN KEUANGAN', 14, 45);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Pemasukan: ${formatRupiah(totalIncome)}`, 14, 52);
    doc.text(`Total Pengeluaran: ${formatRupiah(totalExpense)}`, 14, 58);
    doc.text(`Laba Bersih: ${formatRupiah(netProfit)}`, 14, 64);
    doc.text(`Margin: ${profitMargin}%`, 14, 70);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DAFTAR TRANSAKSI', 14, 80);
    
    const tableData = filteredRecords.map(r => [
      formatDate(r.date),
      r.description,
      r.category,
      r.department,
      r.reference,
      (r.record_type === 'income' ? '+' : '-') + ' ' + formatRupiah(r.amount),
    ]);
    
    doc.autoTable({
      startY: 85,
      head: [['Tanggal', 'Keterangan', 'Kategori', 'Dept', 'Ref', 'Jumlah']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [245, 158, 11],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: { fontSize: 8, cellPadding: 2 },
    });
    
    doc.save(`Laporan-Keuangan-${dateFrom}-to-${dateTo}.pdf`);
  };

  // 9. Export Excel (CSV)
  const handleExportExcel = () => {
    const headers = ['Tanggal', 'Keterangan', 'Kategori', 'Departemen', 'Referensi', 'Tipe', 'Jumlah'];
    const rows = filteredRecords.map(r => [
      formatDate(r.date),
      r.description,
      r.category,
      r.department,
      r.reference,
      r.record_type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      r.amount,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-keuangan-${dateFrom}-to-${dateTo}.csv`;
    link.click();
  };

  const isLoading = loadingTransactions || loadingExpenses;

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan Keuangan</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Monitoring pemasukan dan pengeluaran</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF} size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel} size="sm">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dari Tanggal</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sampai Tanggal</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipe</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">Semua</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Departemen</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">Semua</option>
              <option value="Kasir">Kasir</option>
              <option value="Produksi">Produksi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistik Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pemasukan</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatRupiah(totalIncome)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dari semua sumber</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pengeluaran</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatRupiah(totalExpense)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Biaya operasional</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Laba Bersih</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatRupiah(netProfit)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Margin: {profitMargin}%</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Receipt className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Transaksi</span>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{filteredRecords.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total catatan</p>
        </div>
      </div>

      {/* Tabel Transaksi */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Daftar Transaksi</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4 inline mr-1" />
            {formatDate(dateFrom)} - {formatDate(dateTo)}
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Memuat data...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Tidak ada data transaksi pada periode ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Keterangan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Departemen</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Referensi</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRecords.map((record, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      <div className="font-medium">{record.description}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Ref: {record.reference}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        record.record_type === 'income'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {record.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {record.department}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {record.reference}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-bold ${
                      record.record_type === 'income' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {record.record_type === 'income' ? '+' : '-'} {formatRupiah(record.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}