<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AddonProductionService;
use App\Models\AddonProductionBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AddonProductionController extends Controller
{
    protected $service;

    public function __construct(AddonProductionService $service)
    {
        $this->service = $service;
    }

        public function index(Request $request)
    {
        try {
            $query = AddonProductionBatch::with(['addOn', 'user', 'batchItems.rawMaterial']);

            // ✅ Gunakan filled() agar mengabaikan string kosong ""
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('date_from')) {
                $query->whereDate('production_date', '>=', $request->date_from);
            }

            if ($request->filled('date_to')) {
                $query->whereDate('production_date', '<=', $request->date_to);
            }

            $batches = $query->orderBy('production_date', 'desc')
                ->paginate($request->get('per_page', 15));

            return response()->json([
                'data' => $batches->items(),
                'meta' => [
                    'current_page' => $batches->currentPage(),
                    'last_page' => $batches->lastPage(),
                    'total' => $batches->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching addon production batches: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Gagal mengambil data produksi add-on',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'add_on_id' => 'required|exists:add_ons,id',
                'qty_produced' => 'required|numeric|min:1',
                'production_date' => 'nullable|date',
                'notes' => 'nullable|string',
            ]);

            $batch = $this->service->createBatch($validated);

            return response()->json([
                'message' => 'Produksi add-on berhasil',
                'data' => $batch,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating addon production: ' . $e->getMessage());
            
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function preview(Request $request)
    {
        try {
            $validated = $request->validate([
                'add_on_id' => 'required|exists:add_ons,id',
                'qty_produce' => 'required|numeric|min:1',
            ]);

            $preview = $this->service->previewProduction(
                $validated['add_on_id'],
                $validated['qty_produce']
            );

            return response()->json(['data' => $preview]);
        } catch (\Exception $e) {
            Log::error('Error previewing addon production: ' . $e->getMessage());
            
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function cancel($id)
    {
        try {
            $batch = $this->service->cancelBatch($id);

            return response()->json([
                'message' => 'Produksi add-on dibatalkan',
                'data' => $batch,
            ]);
        } catch (\Exception $e) {
            Log::error('Error cancelling addon production: ' . $e->getMessage());
            
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}