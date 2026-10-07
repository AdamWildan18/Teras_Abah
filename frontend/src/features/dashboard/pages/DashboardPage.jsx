import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/axios';
import { 
  DollarSign, Package, TrendingUp, TrendingDown, 
  ShoppingCart, ChefHat, AlertTriangle, Loader2,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function DashboardPage() {
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      console.log('📊 Full Response:', response);
      console.log('📊 response.data:', response.data);
      return response;
    },
    refetchInterval: 30000,
  });

  // ✅ PERBAIKAN: Baca statsData.data.data (bukan statsData.data)
  const responseData = statsData?.data || {};
  const stats = responseData.data || {};
  
  console.log('📊 stats object:', stats);
  
  const todayStats = stats.today || {};
  const monthlyStats = stats.monthly || {};
  const salesChartData = stats.sales_chart || [];
  const topProducts = stats.top_products || [];
  const recentTransactions = stats.recent_transactions || [];
  const lowStockProducts = stats.low_stock_products || [];

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error loading dashboard: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Ringkasan bisnis hari ini • {new Date().toLocaleDateString('id-ID', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>
        <button 
          onClick={() => window.location.href = '/cashier'}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition"
        >
          <ShoppingCart className="w-4 h-4" />
          Buka Kasir
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pendapatan Hari Ini */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Pendapatan Hari Ini</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatRupiah(todayStats.income)}</p>
          <div className="flex items-center gap-1 mt-1">
            {todayStats.income_change > 0 ? (
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            ) : todayStats.income_change < 0 ? (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            ) : null}
            <span className={`text-xs ${todayStats.income_change > 0 ? 'text-green-600' : todayStats.income_change < 0 ? 'text-red-600' : 'text-gray-500'}`}>
              {todayStats.income_change > 0 ? '+' : ''}{todayStats.income_change}% dari kemarin
            </span>
          </div>
        </div>

        {/* Transaksi Hari Ini */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Transaksi Hari Ini</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats.transactions || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Rata-rata: {formatRupiah(todayStats.transactions > 0 ? todayStats.income / todayStats.transactions : 0)}
          </p>
        </div>

        {/* Batch Produksi */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <ChefHat className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Batch Produksi</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats.production || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Biaya: {formatRupiah(todayStats.expense)}</p>
        </div>

        {/* Laba Bulan Ini */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Laba Bulan Ini</span>
          </div>
          <p className={`text-2xl font-bold ${monthlyStats.profit >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
            {formatRupiah(monthlyStats.profit)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pengeluaran: {formatRupiah(monthlyStats.expense)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Grafik Penjualan</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">7 hari terakhir</p>
          {salesChartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400">Belum ada data penjualan</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value) => formatRupiah(value)}
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#f59e0b" 
                  fill="#f59e0b"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Produk Terlaris</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Top 5 berdasarkan qty</p>
          {topProducts.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400">Belum ada data produk</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="qty" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}-${entry.id || entry.name}`} fill="#f59e0b" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Transactions & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Transaksi Terakhir</h2>
          </div>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Belum ada transaksi</p>
            ) : (
              recentTransactions.map((transaction, index) => (
                <div 
                  key={`transaction-${transaction.id || index}`} 
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {transaction.invoice_number || `TRX-${index + 1}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {transaction.cashier || 'Kasir'} • {transaction.transacted_at}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-amber-600 dark:text-amber-400">
                    {formatRupiah(transaction.total)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Stok Menipis</h2>
          </div>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Semua stok aman</p>
            ) : (
              lowStockProducts.map((product, index) => (
                <div 
                  key={`lowstock-${product.id || index}`}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {product.name || `Produk ${index + 1}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {product.code || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600 dark:text-red-400 text-sm">
                      {product.stock || 0} unit
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-400">
                      Min: {product.min_stock || 0}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}