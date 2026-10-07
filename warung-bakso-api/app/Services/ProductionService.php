<?php

namespace App\Services;

use App\Models\ProductionBatch;
use App\Models\ProductionBatchItem;
use App\Models\Recipe;
use App\Models\RawMaterial;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\FinancialRecord;
use App\Models\FinancialCategory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ProductionService
{
    /**
     * Buat batch produksi baru
     */
    public function createBatch(array $data): ProductionBatch
    {
        return DB::transaction(function () use ($data) {
            $user = Auth::user();
            $product = Product::findOrFail($data['product_id']);
            $recipe = Recipe::with('recipeItems.rawMaterial')
                ->where('product_id', $product->id)
                ->firstOrFail();

            // Generate batch code: PRD-YYYYMMDD-XXXX
            $batchCode = 'PRD-' . Carbon::now()->format('Ymd') . '-' . str_pad(ProductionBatch::count() + 1, 4, '0', STR_PAD_LEFT);

            // Hitung multiplier (berapa kali resep dijalankan)
            $multiplier = $data['qty_produced'] / $recipe->yield_qty;

            // Validasi stok bahan mencukupi
            $this->validateStock($recipe, $multiplier);

            // Buat batch
            $batch = ProductionBatch::create([
                'batch_code' => $batchCode,
                'product_id' => $product->id,
                'user_id' => $user->id,
                'qty_produced' => $data['qty_produced'],
                'production_date' => $data['production_date'] ?? Carbon::now()->toDateString(),
                'notes' => $data['notes'] ?? null,
                'status' => 'completed',
            ]);

            // Hitung total biaya produksi
            $totalCost = 0;

            // Proses setiap bahan
            foreach ($recipe->recipeItems as $recipeItem) {
                $qtyNeeded = $recipeItem->qty * $multiplier;
                $rawMaterial = $recipeItem->rawMaterial;
                $costPerUnit = $rawMaterial->price_per_unit;
                $totalItemCost = $qtyNeeded * $costPerUnit;
                $totalCost += $totalItemCost;

                // Kurangi stok bahan mentah
                $rawMaterial->decrement('stock', $qtyNeeded);

                // Catat stock movement (bahan keluar)
                StockMovement::create([
                    'stockable_type' => RawMaterial::class,
                    'stockable_id' => $rawMaterial->id,
                    'type' => 'out',
                    'qty' => $qtyNeeded,
                    'reference_type' => 'production_batch',
                    'reference_id' => $batch->id,
                    'user_id' => $user->id,
                    'notes' => "Produksi batch {$batchCode} - {$product->name}",
                ]);

                // Simpan item batch
                ProductionBatchItem::create([
                    'production_batch_id' => $batch->id,
                    'raw_material_id' => $rawMaterial->id,
                    'qty_used' => $qtyNeeded,
                    'unit' => $recipeItem->unit,
                ]);
            }

            // Tambah stok produk jadi
            $product->increment('stock', $data['qty_produced']);

            // Catat stock movement (produk masuk)
            StockMovement::create([
                'stockable_type' => Product::class,
                'stockable_id' => $product->id,
                'type' => 'in',
                'qty' => $data['qty_produced'],
                'reference_type' => 'production_batch',
                'reference_id' => $batch->id,
                'user_id' => $user->id,
                'notes' => "Produksi batch {$batchCode}",
            ]);

            // ✅ Catat biaya produksi ke keuangan (departemen produksi)
            // Auto-create kategori jika belum ada
            $expenseCategory = FinancialCategory::firstOrCreate(
                [
                    'name' => 'Pembelian Bahan Mentah',
                    'department' => 'produksi',
                ],
                [
                    'type' => 'expense',
                    'description' => 'Kategori untuk biaya bahan baku produksi',
                ]
            );

            FinancialRecord::create([
                'reference_code' => $batchCode,
                'category_id' => $expenseCategory->id,
                'user_id' => $user->id,
                'type' => 'expense',
                'department' => 'produksi',
                'description' => "Biaya produksi {$product->name} (Batch: {$batchCode})",
                'amount' => $totalCost,
                'date' => Carbon::now()->toDateString(),
            ]);

            // Update batch dengan total cost
            $batch->update(['total_cost' => $totalCost]);

            return $batch->fresh(['product', 'user', 'batchItems.rawMaterial']);
        });
    }

    /**
     * Validasi stok bahan mencukupi
     */
    private function validateStock(Recipe $recipe, float $multiplier): void
    {
        $insufficient = [];

        foreach ($recipe->recipeItems as $item) {
            $qtyNeeded = $item->qty * $multiplier;
            if ($item->rawMaterial->stock < $qtyNeeded) {
                $insufficient[] = [
                    'material' => $item->rawMaterial->name,
                    'needed' => $qtyNeeded,
                    'available' => $item->rawMaterial->stock,
                    'unit' => $item->unit,
                ];
            }
        }

        if (!empty($insufficient)) {
            throw new \Exception('Stok bahan tidak mencukupi: ' . json_encode($insufficient));
        }
    }

    /**
     * Preview bahan yang dibutuhkan (sebelum produksi)
     */
    public function previewProduction(int $productId, int $qtyProduce): array
    {
        $product = Product::findOrFail($productId);
        $recipe = Recipe::with('recipeItems.rawMaterial')
            ->where('product_id', $productId)
            ->firstOrFail();

        $multiplier = $qtyProduce / $recipe->yield_qty;
        $totalCost = 0;
        $items = [];

        foreach ($recipe->recipeItems as $item) {
            $qtyNeeded = $item->qty * $multiplier;
            $cost = $qtyNeeded * $item->rawMaterial->price_per_unit;
            $totalCost += $cost;

            $items[] = [
                'raw_material_id' => $item->rawMaterial->id,
                'name' => $item->rawMaterial->name,
                'code' => $item->rawMaterial->code,
                'qty_needed' => round($qtyNeeded, 3),
                'unit' => $item->unit,
                'stock_available' => (float) $item->rawMaterial->stock,
                'is_sufficient' => $item->rawMaterial->stock >= $qtyNeeded,
                'price_per_unit' => (float) $item->rawMaterial->price_per_unit,
                'total_cost' => round($cost, 2),
            ];
        }

        return [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
            ],
            'recipe' => [
                'yield_qty' => $recipe->yield_qty,
                'yield_unit' => $recipe->yield_unit,
            ],
            'qty_to_produce' => $qtyProduce,
            'multiplier' => round($multiplier, 4),
            'items' => $items,
            'total_cost' => round($totalCost, 2),
            'cost_per_unit' => round($totalCost / $qtyProduce, 2),
            'all_sufficient' => collect($items)->every(fn($i) => $i['is_sufficient']),
        ];
    }

    /**
     * Batalkan batch produksi (rollback stok)
     */
    public function cancelBatch(int $batchId): ProductionBatch
    {
        return DB::transaction(function () use ($batchId) {
            $batch = ProductionBatch::with(['product', 'batchItems.rawMaterial', 'user'])
                ->findOrFail($batchId);

            if ($batch->status === 'cancelled') {
                throw new \Exception('Batch sudah dibatalkan');
            }

            $user = Auth::user();

            // Kembalikan stok bahan mentah
            foreach ($batch->batchItems as $item) {
                $item->rawMaterial->increment('stock', $item->qty_used);

                StockMovement::create([
                    'stockable_type' => RawMaterial::class,
                    'stockable_id' => $item->rawMaterial->id,
                    'type' => 'in',
                    'qty' => $item->qty_used,
                    'reference_type' => 'production_batch_cancel',
                    'reference_id' => $batch->id,
                    'user_id' => $user->id,
                    'notes' => "Pembatalan batch {$batch->batch_code}",
                ]);
            }

            // Kurangi stok produk jadi
            $batch->product->decrement('stock', $batch->qty_produced);

            StockMovement::create([
                'stockable_type' => Product::class,
                'stockable_id' => $batch->product->id,
                'type' => 'out',
                'qty' => $batch->qty_produced,
                'reference_type' => 'production_batch_cancel',
                'reference_id' => $batch->id,
                'user_id' => $user->id,
                'notes' => "Pembatalan batch {$batch->batch_code}",
            ]);

            $batch->update(['status' => 'cancelled']);

            return $batch->fresh(['product', 'user', 'batchItems.rawMaterial']);
        });
    }
}