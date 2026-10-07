<?php

namespace App\Services;

use App\Models\AddOn;
use App\Models\AddonRecipeItem;
use App\Models\AddonProductionBatch;
use App\Models\AddonProductionBatchItem;
use App\Models\RawMaterial;
use App\Models\FinancialCategory;
use App\Models\FinancialRecord;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class AddonProductionService
{
    /**
     * Preview bahan yang dibutuhkan untuk produksi add-on
     */
    public function previewProduction(int $addOnId, float $qtyProduce): array
    {
        $addOn = AddOn::with('recipeItems.rawMaterial')->findOrFail($addOnId);

        if ($addOn->recipeItems->isEmpty()) {
            throw new \Exception("Add-on {$addOn->name} belum memiliki resep");
        }

        $multiplier = $qtyProduce / $addOn->recipe_yield;
        $totalCost = 0;
        $items = [];

        foreach ($addOn->recipeItems as $item) {
            $qtyNeeded = $item->qty * $multiplier;
            $cost = $qtyNeeded * floatval($item->rawMaterial->price_per_unit ?? 0);
            $totalCost += $cost;

            $items[] = [
                'raw_material_id' => $item->rawMaterial->id,
                'name' => $item->rawMaterial->name,
                'code' => $item->rawMaterial->code,
                'qty_needed' => round($qtyNeeded, 3),
                'unit' => $item->unit,
                'stock_available' => floatval($item->rawMaterial->stock),
                'is_sufficient' => floatval($item->rawMaterial->stock) >= $qtyNeeded,
                'price_per_unit' => floatval($item->rawMaterial->price_per_unit),
                'total_cost' => round($cost, 2),
            ];
        }

        return [
            'add_on' => [
                'id' => $addOn->id,
                'name' => $addOn->name,
                'code' => $addOn->code,
            ],
            'recipe_yield' => $addOn->recipe_yield,
            'qty_to_produce' => $qtyProduce,
            'multiplier' => round($multiplier, 4),
            'items' => $items,
            'total_cost' => round($totalCost, 2),
            'all_sufficient' => collect($items)->every(fn($i) => $i['is_sufficient']),
        ];
    }

    /**
     * Produksi add-on dari bahan mentah
     */
    public function createBatch(array $data): AddonProductionBatch
    {
        return DB::transaction(function () use ($data) {
            $user = Auth::user();
            $addOn = AddOn::with('recipeItems.rawMaterial')->findOrFail($data['add_on_id']);

            if ($addOn->recipeItems->isEmpty()) {
                throw new \Exception("Add-on {$addOn->name} belum memiliki resep");
            }

            // Generate batch code
            $batchCode = 'ADD-' . Carbon::now()->format('Ymd') . '-' . 
                str_pad((AddonProductionBatch::whereDate('created_at', Carbon::today())->count() + 1), 4, '0', STR_PAD_LEFT);

            $multiplier = $data['qty_produced'] / $addOn->recipe_yield;
            $totalCost = 0;
            $batchItems = [];

            // Validasi stok & hitung biaya
            foreach ($addOn->recipeItems as $item) {
                $qtyNeeded = $item->qty * $multiplier;
                $rawMaterial = $item->rawMaterial;

                if (floatval($rawMaterial->stock) < $qtyNeeded) {
                    throw new \Exception("Stok {$rawMaterial->name} tidak mencukupi");
                }

                $cost = $qtyNeeded * floatval($rawMaterial->price_per_unit ?? 0);
                $totalCost += $cost;

                $batchItems[] = [
                    'raw_material_id' => $rawMaterial->id,
                    'qty_used' => $qtyNeeded,
                    'unit' => $item->unit,
                    'cost' => $cost,
                ];
            }

            // Buat batch
            $batch = AddonProductionBatch::create([
                'batch_code' => $batchCode,
                'add_on_id' => $addOn->id,
                'user_id' => $user->id,
                'qty_produced' => $data['qty_produced'],
                'total_cost' => $totalCost,
                'production_date' => $data['production_date'] ?? Carbon::now()->toDateString(),
                'notes' => $data['notes'] ?? null,
                'status' => 'completed',
            ]);

            // Simpan items, kurangi stok bahan, catat pengeluaran
            foreach ($batchItems as $itemData) {
                AddonProductionBatchItem::create([
                    'addon_production_batch_id' => $batch->id,
                    'raw_material_id' => $itemData['raw_material_id'],
                    'qty_used' => $itemData['qty_used'],
                    'unit' => $itemData['unit'],
                    'cost' => $itemData['cost'],
                ]);

                // Kurangi stok bahan mentah
                RawMaterial::where('id', $itemData['raw_material_id'])
                    ->decrement('stock', $itemData['qty_used']);

                // Catat pengeluaran keuangan
                $this->recordExpense($batchCode, $addOn->name, $itemData['cost'], $user->id);
            }

            // Tambah stok add-on
            $addOn->increment('stock', $data['qty_produced']);

            return $batch->load(['addOn', 'user', 'batchItems.rawMaterial']);
        });
    }

    /**
     * Batalkan batch produksi (rollback)
     */
    public function cancelBatch(int $batchId): AddonProductionBatch
    {
        return DB::transaction(function () use ($batchId) {
            $batch = AddonProductionBatch::with(['addOn', 'batchItems.rawMaterial', 'user'])
                ->findOrFail($batchId);

            if ($batch->status === 'cancelled') {
                throw new \Exception('Batch sudah dibatalkan');
            }

            // Kembalikan stok bahan mentah
            foreach ($batch->batchItems as $item) {
                RawMaterial::where('id', $item->raw_material_id)
                    ->increment('stock', $item->qty_used);
            }

            // Kurangi stok add-on
            $batch->addOn->decrement('stock', $batch->qty_produced);

            // Hapus catatan pengeluaran
            FinancialRecord::where('reference_code', $batch->batch_code)->delete();

            $batch->update(['status' => 'cancelled']);

            return $batch->fresh(['addOn', 'user', 'batchItems.rawMaterial']);
        });
    }

    /**
     * Catat pengeluaran ke keuangan
     */
    private function recordExpense(string $batchCode, string $addOnName, float $cost, int $userId): void
    {
        $category = FinancialCategory::firstOrCreate(
            ['name' => 'Produksi Add-On', 'department' => 'produksi'],
            ['type' => 'expense']
        );

        FinancialRecord::create([
            'reference_code' => $batchCode,
            'category_id' => $category->id,
            'user_id' => $userId,
            'type' => 'expense',
            'department' => 'produksi',
            'description' => "Produksi add-on: {$addOnName} (Batch: {$batchCode})",
            'amount' => $cost,
            'date' => Carbon::now()->toDateString(),
        ]);
    }
}