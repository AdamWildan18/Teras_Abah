<?php

namespace App\Http\Controllers\Api\Production;

use App\Http\Controllers\Controller;
use App\Services\ProductionService;
use App\Models\ProductionBatch;
use App\Http\Requests\Production\StoreProductionBatchRequest;
use App\Http\Resources\ProductionBatchResource;
use App\Http\Resources\ProductionBatchCollection;
use Illuminate\Http\Request;

class ProductionBatchController extends Controller
{
    protected $productionService;

    public function __construct(ProductionService $productionService)
    {
        $this->productionService = $productionService;
    }

    public function index(Request $request)
{
    try {
        $query = ProductionBatch::query();

        // Filter by status - gunakan filled() bukan has()
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date range - gunakan filled() untuk hindari string kosong
        if ($request->filled('date_from')) {
            $query->where('production_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('production_date', '<=', $request->date_to);
        }

        // Filter by product
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        // Pagination dengan eager loading
        $batches = $query->with(['product', 'user', 'batchItems.rawMaterial'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return new ProductionBatchCollection($batches);
    } catch (\Exception $e) {
        \Log::error('Production index error: ' . $e->getMessage());
        return response()->json([
            'message' => 'Error fetching production batches',
            'error' => $e->getMessage(),
        ], 500);
    }
}

    public function store(StoreProductionBatchRequest $request)
    {
        try {
            $batch = $this->productionService->createBatch($request->validated());

            return (new ProductionBatchResource($batch))
                ->additional(['message' => 'Produksi berhasil dilakukan.']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function show(ProductionBatch $productionBatch)
    {
        $productionBatch->load(['product', 'user', 'batchItems.rawMaterial']);
        return new ProductionBatchResource($productionBatch);
    }

    public function preview(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'qty_produce' => 'required|integer|min:1',
        ]);

        try {
            $preview = $this->productionService->previewProduction(
                $request->product_id,
                $request->qty_produce
            );

            return response()->json(['data' => $preview]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function cancel(ProductionBatch $productionBatch)
    {
        try {
            $batch = $this->productionService->cancelBatch($productionBatch->id);

            return (new ProductionBatchResource($batch))
                ->additional(['message' => 'Produksi berhasil dibatalkan.']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Statistik produksi
     */
    public function stats(Request $request)
    {
        $today = now()->toDateString();
        $thisMonth = now()->startOfMonth()->toDateString();

        $stats = [
            'today' => [
                'total_batches' => ProductionBatch::where('production_date', $today)->where('status', 'completed')->count(),
                'total_produced' => ProductionBatch::where('production_date', $today)->where('status', 'completed')->sum('qty_produced'),
                'total_cost' => ProductionBatch::where('production_date', $today)->where('status', 'completed')->sum('total_cost'),
            ],
            'this_month' => [
                'total_batches' => ProductionBatch::where('production_date', '>=', $thisMonth)->where('status', 'completed')->count(),
                'total_produced' => ProductionBatch::where('production_date', '>=', $thisMonth)->where('status', 'completed')->sum('qty_produced'),
                'total_cost' => ProductionBatch::where('production_date', '>=', $thisMonth)->where('status', 'completed')->sum('total_cost'),
            ],
        ];

        return response()->json(['data' => $stats]);
    }
}