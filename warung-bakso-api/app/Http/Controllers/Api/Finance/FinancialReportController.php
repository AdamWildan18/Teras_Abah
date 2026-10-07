<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Models\FinancialRecord;
use App\Models\FinancialCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FinancialReportController extends Controller
{
    /**
     * Get financial records dengan filter
     */
    public function index(Request $request)
    {
        $query = FinancialRecord::with(['category', 'user'])
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc');

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by department
        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }

        // Filter by category
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $records = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $records->items(),
            'meta' => [
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'total' => $records->total(),
            ],
        ]);
    }

    /**
     * Get summary/overview keuangan
     */
    public function summary(Request $request)
    {
        $dateFrom = $request->filled('date_from') ? $request->date_from : Carbon::now()->startOfMonth()->toDateString();
        $dateTo = $request->filled('date_to') ? $request->date_to : Carbon::now()->toDateString();

        // Total Income
        $totalIncome = FinancialRecord::where('type', 'income')
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->sum('amount');

        // Total Expense
        $totalExpense = FinancialRecord::where('type', 'expense')
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->sum('amount');

        // Net Profit
        $netProfit = $totalIncome - $totalExpense;

        // Breakdown by Department
        $byDepartment = FinancialRecord::select('department', 'type', DB::raw('SUM(amount) as total'))
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->groupBy('department', 'type')
            ->get()
            ->groupBy('department');

        // Breakdown by Category
        $byCategory = FinancialRecord::with('category')
            ->select('category_id', 'type', DB::raw('SUM(amount) as total'))
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->groupBy('category_id', 'type')
            ->get();

        return response()->json([
            'data' => [
                'period' => [
                    'from' => $dateFrom,
                    'to' => $dateTo,
                ],
                'summary' => [
                    'total_income' => $totalIncome,
                    'total_expense' => $totalExpense,
                    'net_profit' => $netProfit,
                    'profit_margin' => $totalIncome > 0 ? round(($netProfit / $totalIncome) * 100, 2) : 0,
                ],
                'by_department' => $byDepartment,
                'by_category' => $byCategory,
            ],
        ]);
    }

    /**
     * Get categories untuk dropdown
     */
    public function categories()
    {
        $categories = FinancialCategory::orderBy('department')->orderBy('name')->get();
        
        return response()->json([
            'data' => $categories,
        ]);
    }
}