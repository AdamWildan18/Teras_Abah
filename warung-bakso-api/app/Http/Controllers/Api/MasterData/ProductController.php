<?php

namespace App\Http\Controllers\Api\MasterData;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Http\Requests\MasterData\StoreProductRequest;
use App\Http\Requests\MasterData\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ProductCollection;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        if ($request->boolean('available_only')) {
            $query->where('is_available', true);
        }

        $products = $query->orderBy('name')->paginate($request->get('per_page', 15));

        return new ProductCollection($products);
    }

    public function store(StoreProductRequest $request)
    {
        $product = Product::create($request->validated());

        return (new ProductResource($product))
            ->additional(['message' => 'Produk berhasil ditambahkan.']);
    }

    public function show(Product $product)
    {
        $product->load('recipe.recipeItems.rawMaterial');
        return new ProductResource($product);
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        $product->update($request->validated());

        return (new ProductResource($product))
            ->additional(['message' => 'Produk berhasil diupdate.']);
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json([
            'message' => 'Produk berhasil dihapus.',
        ]);
    }

    /**
     * Get all available products (untuk dropdown & kasir)
     * TAMBAH: field 'price' sebagai alias dari 'selling_price' untuk konsistensi frontend
     */
    public function all()
    {
        $products = Product::where('is_available', true)
            ->orderBy('name')
            ->get();
        
        return response()->json([
            'data' => $products->map(fn($item) => [
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'category' => $item->category,
                'selling_price' => (float) $item->selling_price,
                'price' => (float) $item->selling_price, // ← TAMBAHKAN INI (alias untuk frontend)
                'stock' => (int) $item->stock,
                'is_available' => $item->is_available,
            ]),
        ]);
    }
}