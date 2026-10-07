<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\ProductionBatch;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\FinancialRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats()
    {
        try {
            $today = Carbon::today()->toDateString();
            $yesterday = Carbon::yesterday()->toDateString();
            $sevenDaysAgo = Carbon::now()->subDays(6)->toDateString();

            // === TODAY STATS ===
            $todayIncome = Transaction::whereDate('transacted_at', $today)
                ->where('status', 'completed')
                ->sum('total');

            $todayTransactions = Transaction::whereDate('transacted_at', $today)
                ->where('status', 'completed')
                ->count();

            $todayProduction = ProductionBatch::where('production_date', $today)
                ->where('status', 'completed')
                ->count();

            $todayExpense = FinancialRecord::where('date', $today)
                ->where('type', 'expense')
                ->sum('amount');

            // === YESTERDAY ===
            $yesterdayIncome = Transaction::whereDate('transacted_at', $yesterday)
                ->where('status', 'completed')
                ->sum('total');

            // === 7 DAYS SALES CHART ===
            $salesByDay = Transaction::where('status', 'completed')
                ->whereDate('transacted_at', '>=', $sevenDaysAgo)
                ->select(
                    DB::raw('DATE(transacted_at) as date'), 
                    DB::raw('SUM(total) as total'), 
                    DB::raw('COUNT(*) as count')
                )
                ->groupBy(DB::raw('DATE(transacted_at)'))
                ->orderBy('date')
                ->get()
                ->map(fn($item) => [
                    'date' => Carbon::parse($item->date)->format('d M'),
                    'total' => (float) $item->total,
                    'count' => (int) $item->count,
                ]);

            $salesByDay = $this->fillMissingDays($salesByDay, 7);

            // === TOP 5 BEST SELLER ===
            $topProducts = TransactionItem::select(
                    'product_id', 
                    'product_name', 
                    DB::raw('SUM(qty) as total_qty'), 
                    DB::raw('SUM(subtotal) as total_revenue')
                )
                ->whereHas('transaction', fn($q) => $q->where('status', 'completed'))
                ->groupBy('product_id', 'product_name')
                ->orderByDesc('total_qty')
                ->limit(5)
                ->get()
                ->map(fn($item) => [
                    'id' => $item->product_id,
                    'name' => $item->product_name,
                    'qty' => (int) $item->total_qty,
                    'revenue' => (float) $item->total_revenue,
                ]);

            // === LOW STOCK ALERT (AMAN - cek kolom dulu) ===
            $lowStockProducts = collect();
            if (Schema::hasColumn('products', 'min_stock')) {
                $lowStockProducts = Product::whereColumn('stock', '<=', 'min_stock')
                    ->orWhere('stock', 0)
                    ->where('is_available', true)
                    ->select('id', 'name', 'code', 'stock', 'min_stock')
                    ->orderBy('stock')
                    ->limit(5)
                    ->get();
            } else {
                // Fallback: produk dengan stok <= 5
                $lowStockProducts = Product::where('stock', '<=', 5)
                    ->where('is_available', true)
                    ->select('id', 'name', 'code', 'stock')
                    ->orderBy('stock')
                    ->limit(5)
                    ->get()
                    ->map(fn($p) => (object) array_merge((array) $p, ['min_stock' => 5]));
            }

            $lowStockMaterials = RawMaterial::whereColumn('stock', '<=', 'min_stock')
                ->orWhere('stock', 0)
                ->select('id', 'name', 'code', 'stock', 'min_stock', 'unit')
                ->orderBy('stock')
                ->limit(5)
                ->get();

            // === RECENT TRANSACTIONS ===
            $recentTransactions = Transaction::with('cashier')
                ->where('status', 'completed')
                ->orderBy('transacted_at', 'desc')
                ->limit(5)
                ->get()
                ->map(fn($t) => [
                    'id' => $t->id,
                    'invoice_number' => $t->invoice_number,
                    'total' => (float) $t->total,
                    'transacted_at' => $t->transacted_at?->format('d M Y H:i'),
                    'cashier' => $t->cashier?->name ?? 'Unknown',
                ]);

            // === MONTHLY SUMMARY ===
            $thisMonth = Carbon::now()->startOfMonth()->toDateString();
            $monthlyIncome = Transaction::whereDate('transacted_at', '>=', $thisMonth)
                ->where('status', 'completed')
                ->sum('total');
            $monthlyExpense = FinancialRecord::where('date', '>=', $thisMonth)
                ->where('type', 'expense')
                ->sum('amount');

            return response()->json([
                'data' => [
                    'today' => [
                        'income' => (float) $todayIncome,
                        'transactions' => (int) $todayTransactions,
                        'production' => (int) $todayProduction,
                        'expense' => (float) $todayExpense,
                        'income_change' => $yesterdayIncome > 0 
                            ? round((($todayIncome - $yesterdayIncome) / $yesterdayIncome) * 100, 1) 
                            : 0,
                    ],
                    'monthly' => [
                        'income' => (float) $monthlyIncome,
                        'expense' => (float) $monthlyExpense,
                        'profit' => (float) ($monthlyIncome - $monthlyExpense),
                    ],
                    'sales_chart' => $salesByDay,
                    'top_products' => $topProducts,
                    'low_stock_products' => $lowStockProducts,
                    'low_stock_materials' => $lowStockMaterials,
                    'recent_transactions' => $recentTransactions,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Dashboard stats error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'message' => 'Error fetching dashboard stats',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function fillMissingDays($data, $days)
    {
        $result = collect();
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('d M');
            $found = $data->firstWhere('date', $date);
            $result->push($found ?? [
                'date' => $date,
                'total' => 0,
                'count' => 0,
            ]);
        }
        return $result;
    }
}