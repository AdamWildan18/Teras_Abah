<?php

namespace App\Http\Controllers\Api\MasterData;

use App\Http\Controllers\Controller;
use App\Models\RawMaterial;
use App\Http\Requests\MasterData\StoreRawMaterialRequest;
use App\Http\Requests\MasterData\UpdateRawMaterialRequest;
use App\Http\Resources\RawMaterialResource;
use App\Http\Resources\RawMaterialCollection;
use Illuminate\Http\Request;

class RawMaterialController extends Controller
{
    /**
     * List semua bahan mentah (dengan pagination & search)
     */
    public function index(Request $request)
    {
        $query = RawMaterial::query();

        // Search by name or code
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Filter by low stock
        if ($request->boolean('low_stock')) {
            $query->whereColumn('stock', '<=', 'min_stock');
        }

        $rawMaterials = $query->orderBy('name')->paginate($request->get('per_page', 15));

        return new RawMaterialCollection($rawMaterials);
    }

    /**
     * Simpan bahan mentah baru
     */
    public function store(StoreRawMaterialRequest $request)
    {
        $rawMaterial = RawMaterial::create($request->validated());

        return (new RawMaterialResource($rawMaterial))
            ->additional(['message' => 'Bahan mentah berhasil ditambahkan.']);
    }

    /**
     * Detail bahan mentah
     */
    public function show(RawMaterial $rawMaterial)
    {
        return new RawMaterialResource($rawMaterial);
    }

    /**
     * Update bahan mentah
     */
    public function update(Request $request, RawMaterial $rawMaterial)
        {
            try {
                $validated = $request->validate([
                    'code' => 'required|string|max:255|unique:raw_materials,code,' . $rawMaterial->id,
                    'name' => 'required|string|max:255',
                    'unit' => 'required|string|max:20',
                    'stock' => 'nullable|numeric|min:0',
                    'min_stock' => 'nullable|numeric|min:0',
                    'price_per_unit' => 'required|numeric|min:0',
                    'is_available' => 'boolean',
                    'description' => 'nullable|string',
                ]);

                // ✅ Update secara eksplisit
                $rawMaterial->update([
                    'code' => $validated['code'],
                    'name' => $validated['name'],
                    'unit' => $validated['unit'],
                    'stock' => $validated['stock'] ?? 0,
                    'min_stock' => $validated['min_stock'] ?? 0, // ✅ Pastikan ini ada
                    'price_per_unit' => $validated['price_per_unit'],
                    'is_available' => $validated['is_available'] ?? true,
                    'description' => $validated['description'] ?? null,
                ]);

                return response()->json([
                    'message' => 'Bahan mentah berhasil diupdate',
                    'data' => $rawMaterial->fresh(), // Mengembalikan data terbaru
                ]);
            } catch (\Exception $e) {
                \Log::error('Error updating raw material: ' . $e->getMessage());
                
                return response()->json([
                    'message' => 'Gagal mengupdate bahan mentah',
                    'error' => $e->getMessage(),
                ], 422);
            }
        }   

    /**
     * Hapus bahan mentah (soft delete)
     */
    public function destroy(RawMaterial $rawMaterial)
    {
        $rawMaterial->delete();

        return response()->json([
            'message' => 'Bahan mentah berhasil dihapus.',
        ]);
    }

    /**
     * Get semua bahan mentah (untuk dropdown, tanpa pagination)
     */
    public function all()
    {
        $rawMaterials = RawMaterial::orderBy('name')->get();
        
        return response()->json([
            'data' => $rawMaterials->map(fn($item) => [
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'unit' => $item->unit,
                'stock' => $item->stock,
            ]),
        ]);
    }

        /**
     * Tambah stok bahan mentah (Restock)
     */
    public function restock(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'qty' => 'required|numeric|min:0.001',
                'notes' => 'nullable|string|max:255',
            ]);

            $rawMaterial = RawMaterial::findOrFail($id);
            
            // ✅ Tambah stok (increment), bukan replace
            $rawMaterial->increment('stock', $validated['qty']);
            
            // Refresh data
            $rawMaterial = $rawMaterial->fresh();

            return response()->json([
                'message' => 'Stok berhasil ditambahkan',
                'data' => $rawMaterial,
                'added_qty' => $validated['qty'],
                'new_stock' => $rawMaterial->stock,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error restocking: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal menambahkan stok',
                'error' => $e->getMessage(),
            ], 422);
        }
    }
}