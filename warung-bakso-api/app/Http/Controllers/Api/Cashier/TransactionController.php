<?php

namespace App\Http\Controllers\Api\Cashier;

use App\Http\Controllers\Controller;
use App\Services\TransactionService;
use App\Models\Transaction;
use App\Http\Requests\Cashier\StoreTransactionRequest;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    protected $transactionService;

    public function __construct(TransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    public function index(Request $request)
    {
        $query = Transaction::with(['cashier', 'items.product']);

        if ($request->has('date')) {
            $query->whereDate('transacted_at', $request->date);
        }

        $transactions = $query->orderBy('transacted_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }

    public function store(StoreTransactionRequest $request)
    {
        try {
            $transaction = $this->transactionService->createTransaction($request->validated());
            
            return response()->json([
                'message' => 'Transaksi berhasil.',
                'data' => $transaction,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function show(Transaction $transaction)
    {
        $transaction->load(['items.product', 'cashier']);
        return response()->json(['data' => $transaction]);
    }
}