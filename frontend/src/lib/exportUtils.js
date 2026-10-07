import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// Import autoTable dengan multiple patterns untuk kompatibilitas Vite
import autoTablePlugin from 'jspdf-autotable';

// Pastikan autoTable adalah fungsi
const autoTable = typeof autoTablePlugin === 'function' 
  ? autoTablePlugin 
  : (autoTablePlugin?.default || autoTablePlugin);

/**
 * Export data transaksi ke PDF
 */
export const exportToPDF = (records, summary, dateFrom, dateTo) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(245, 158, 11);
  doc.text('Warung Bakso', 14, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Laporan Keuangan', 14, 28);
  
  // Periode
  doc.setFontSize(10);
  doc.text(`Periode: ${formatDate(dateFrom)} - ${formatDate(dateTo)}`, 14, 36);
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 42);
  
  // Summary Box
  doc.setFillColor(245, 158, 11);
  doc.rect(14, 48, 182, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('Total Pemasukan', 20, 56);
  doc.text('Total Pengeluaran', 20, 64);
  doc.text('Laba Bersih', 20, 72);
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(formatRupiah(summary.total_income || 0), 100, 56);
  doc.text(formatRupiah(summary.total_expense || 0), 100, 64);
  doc.text(formatRupiah(summary.net_profit || 0), 100, 72);
  
  // Tabel Transaksi
const tableData = records.map(r => [
  r.date || '-',
  r.description || '-',
  r.category?.name || '-',
  r.department || '-',
  r.reference_code || '-',
  (r.type === 'income' ? '+' : '-') + ' ' + formatRupiah(r.amount || 0),
]);

autoTable(doc, {
  startY: 90,
  head: [['Tanggal', 'Keterangan', 'Kategori', 'Dept', 'Ref', 'Jumlah']],
  body: tableData,
  theme: 'grid',
  headStyles: {
    fillColor: [245, 158, 11],
    textColor: 255,
    fontStyle: 'bold',
    fontSize: 8,
  },
  styles: {
    fontSize: 8,
    cellPadding: 2,
    overflow: 'linebreak', // ← Tambahkan ini agar teks panjang wrap
  },
  columnStyles: {
    0: { cellWidth: 22 },  // Tanggal
    1: { cellWidth: 55 },  // Keterangan (paling lebar)
    2: { cellWidth: 28 },  // Kategori
    3: { cellWidth: 18 },  // Dept (disingkat)
    4: { cellWidth: 28 },  // Ref
    5: { cellWidth: 31, halign: 'right' },  // Jumlah
  },
  margin: { left: 14, right: 14 },
});
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save
  const filename = `Laporan_Keuangan_${dateFrom}_${dateTo}.pdf`;
  doc.save(filename);
};

/**
 * Export data transaksi ke Excel
 */
export const exportToExcel = (records, summary, dateFrom, dateTo) => {
  const workbook = XLSX.utils.book_new();
  
  // Sheet 1: Transaksi
  const transactionData = records.map(r => ({
    'Tanggal': r.date || '-',
    'Keterangan': r.description || '-',
    'Kategori': r.category?.name || '-',
    'Departemen': r.department || '-',
    'Referensi': r.reference_code || '-',
    'Tipe': r.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    'Jumlah': r.amount || 0,
    'User': r.user?.name || '-',
  }));
  
  const wsTransactions = XLSX.utils.json_to_sheet(transactionData);
  XLSX.utils.book_append_sheet(workbook, wsTransactions, 'Transaksi');
  
  // Sheet 2: Summary
  const summaryData = [
    { 'Metrik': 'Periode Dari', 'Nilai': dateFrom },
    { 'Metrik': 'Periode Sampai', 'Nilai': dateTo },
    { 'Metrik': 'Total Pemasukan', 'Nilai': summary.total_income || 0 },
    { 'Metrik': 'Total Pengeluaran', 'Nilai': summary.total_expense || 0 },
    { 'Metrik': 'Laba Bersih', 'Nilai': summary.net_profit || 0 },
    { 'Metrik': 'Margin (%)', 'Nilai': summary.profit_margin || 0 },
    { 'Metrik': 'Total Transaksi', 'Nilai': records.length },
  ];
  
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Ringkasan');
  
  // Set column widths
  wsTransactions['!cols'] = [
    { wch: 12 }, { wch: 40 }, { wch: 20 }, 
    { wch: 12 }, { wch: 25 }, { wch: 12 }, 
    { wch: 15 }, { wch: 20 }
  ];
  
  wsSummary['!cols'] = [{ wch: 20 }, { wch: 30 }];
  
  // Save
  const filename = `Laporan_Keuangan_${dateFrom}_${dateTo}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

// Helper functions
const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};