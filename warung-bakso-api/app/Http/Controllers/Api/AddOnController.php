<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AddOn;
use App\Models\AddonRecipeItem;
use App\Models\RawMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AddOnController extends Controller
{
    public function index()
    {
        try {
            Log::info('=== FETCHING ADD-ONS ===');
            
            $addOns = AddOn::with('recipeItems.rawMaterial')
                ->orderBy('name')
                ->get();

            Log::info('Add-ons fetched successfully: ' . $addOns->count());
            
            return response()->json(['data' => $addOns]);
        } catch (\Exception $e) {
            Log::error('❌ ERROR FETCHING ADD-ONS:');
            Log::error('Message: ' . $e->getMessage());
            Log::error('File: ' . $e->getFile());
            Log::error('Line: ' . $e->getLine());
            Log::error('Trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'message' => 'Gagal mengambil data add-ons',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:50|unique:add_ons,code',
                'price' => 'required|numeric|min:0',
                'stock' => 'nullable|numeric|min:0',
                'recipe_yield' => 'nullable|integer|min:1',
                'is_available' => 'boolean',
                'recipe_items' => 'nullable|array',
                'recipe_items.*.raw_material_id' => 'required_with:recipe_items|exists:raw_materials,id',
                'recipe_items.*.qty' => 'required_with:recipe_items|numeric|min:0',
                'recipe_items.*.unit' => 'required_with:recipe_items|string|max:20',
            ]);

            $addOn = AddOn::create([
                'code' => $validated['code'],
                'name' => $validated['name'],
                'price' => $validated['price'],
                'stock' => $validated['stock'] ?? 0,
                'recipe_yield' => $validated['recipe_yield'] ?? 1,
                'is_available' => $validated['is_available'] ?? true,
            ]);

            if (isset($validated['recipe_items'])) {
                foreach ($validated['recipe_items'] as $item) {
                    AddonRecipeItem::create([
                        'add_on_id' => $addOn->id,
                        'raw_material_id' => $item['raw_material_id'],
                        'qty' => $item['qty'],
                        'unit' => $item['unit'],
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Add-on berhasil ditambahkan',
                'data' => $addOn->load('recipeItems.rawMaterial'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating add-on: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Gagal menambahkan add-on',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $addOn = AddOn::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'code' => 'sometimes|string|max:50|unique:add_ons,code,' . $id,
                'price' => 'sometimes|numeric|min:0',
                'stock' => 'sometimes|numeric|min:0',
                'recipe_yield' => 'sometimes|integer|min:1',
                'is_available' => 'boolean',
                'recipe_items' => 'nullable|array',
                'recipe_items.*.raw_material_id' => 'required_with:recipe_items|exists:raw_materials,id',
                'recipe_items.*.qty' => 'required_with:recipe_items|numeric|min:0',
                'recipe_items.*.unit' => 'required_with:recipe_items|string|max:20',
            ]);

            $addOn->update(array_intersect_key($validated, array_flip([
                'name', 'code', 'price', 'stock', 'recipe_yield', 'is_available'
            ])));

            if (isset($validated['recipe_items'])) {
                $addOn->recipeItems()->delete();
                foreach ($validated['recipe_items'] as $item) {
                    AddonRecipeItem::create([
                        'add_on_id' => $addOn->id,
                        'raw_material_id' => $item['raw_material_id'],
                        'qty' => $item['qty'],
                        'unit' => $item['unit'],
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Add-on berhasil diupdate',
                'data' => $addOn->fresh()->load('recipeItems.rawMaterial'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating add-on: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Gagal mengupdate add-on',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $addOn = AddOn::findOrFail($id);
            $addOn->recipeItems()->delete();
            $addOn->delete();

            return response()->json(['message' => 'Add-on berhasil dihapus']);
        } catch (\Exception $e) {
            Log::error('Error deleting add-on: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Gagal menghapus add-on',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function rawMaterials()
    {
        try {
            $materials = RawMaterial::where('is_available', true)
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'stock', 'unit', 'price_per_unit']);

            return response()->json(['data' => $materials]);
        } catch (\Exception $e) {
            Log::error('Error fetching raw materials: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Gagal mengambil data bahan mentah',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}