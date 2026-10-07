<?php

namespace App\Http\Controllers\Api\MasterData;

use App\Http\Controllers\Controller;
use App\Models\Recipe;
use App\Models\RecipeItem;
use App\Http\Requests\MasterData\StoreRecipeRequest;
use App\Http\Requests\MasterData\UpdateRecipeRequest;
use App\Http\Resources\RecipeResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RecipeController extends Controller
{
    public function index(Request $request)
    {
        $recipes = Recipe::with('product', 'recipeItems.rawMaterial')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => RecipeResource::collection($recipes),
            'meta' => [
                'current_page' => $recipes->currentPage(),
                'last_page' => $recipes->lastPage(),
                'per_page' => $recipes->perPage(),
                'total' => $recipes->total(),
            ],
        ]);
    }

    public function store(StoreRecipeRequest $request)
    {
        return DB::transaction(function () use ($request) {
            // Cek apakah produk sudah punya resep
            $existing = Recipe::where('product_id', $request->product_id)->first();
            if ($existing) {
                return response()->json([
                    'message' => 'Produk ini sudah memiliki resep. Gunakan update.',
                ], 422);
            }

            // Buat recipe
            $recipe = Recipe::create([
                'product_id' => $request->product_id,
                'yield_qty' => $request->yield_qty,
                'yield_unit' => $request->yield_unit,
                'notes' => $request->notes,
            ]);

            // Buat recipe items
            foreach ($request->items as $item) {
                RecipeItem::create([
                    'recipe_id' => $recipe->id,
                    'raw_material_id' => $item['raw_material_id'],
                    'qty' => $item['qty'],
                    'unit' => $item['unit'],
                ]);
            }

            $recipe->load('product', 'recipeItems.rawMaterial');

            return (new RecipeResource($recipe))
                ->additional(['message' => 'Resep berhasil ditambahkan.']);
        });
    }

    public function show(Recipe $recipe)
    {
        $recipe->load('product', 'recipeItems.rawMaterial');
        return new RecipeResource($recipe);
    }

    public function update(UpdateRecipeRequest $request, Recipe $recipe)
    {
        return DB::transaction(function () use ($request, $recipe) {
            // Update recipe
            $recipe->update([
                'yield_qty' => $request->yield_qty,
                'yield_unit' => $request->yield_unit,
                'notes' => $request->notes,
            ]);

            // Delete old items
            $recipe->recipeItems()->delete();

            // Create new items
            foreach ($request->items as $item) {
                RecipeItem::create([
                    'recipe_id' => $recipe->id,
                    'raw_material_id' => $item['raw_material_id'],
                    'qty' => $item['qty'],
                    'unit' => $item['unit'],
                ]);
            }

            $recipe->load('product', 'recipeItems.rawMaterial');

            return (new RecipeResource($recipe))
                ->additional(['message' => 'Resep berhasil diupdate.']);
        });
    }

    public function destroy(Recipe $recipe)
    {
        $recipe->recipeItems()->delete();
        $recipe->delete();

        return response()->json([
            'message' => 'Resep berhasil dihapus.',
        ]);
    }

    /**
     * Get resep by product ID
     */
    public function byProduct(Product $product)
    {
        $recipe = Recipe::with('recipeItems.rawMaterial')
            ->where('product_id', $product->id)
            ->first();

        if (!$recipe) {
            return response()->json([
                'message' => 'Resep tidak ditemukan.',
            ], 404);
        }

        return new RecipeResource($recipe);
    }
}