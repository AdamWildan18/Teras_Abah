<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Product;
use App\Models\AddOn;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class TransactionService
{
    public function createTransaction(array $data): Transaction
    {
        return DB::transaction(function () use ($data) {
            $user = Auth::user();
            
            $subtotal = 0;
            $itemsToInsert = [];

            foreach ($data['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                
                // Validasi stok
                if ($product->stock < $item['qty']) {
                    throw new \Exception("Stok {$product->name} tidak mencukupi. Tersedia: {$product->stock}");
                }

                // ✅ PERBAIKAN: Gunakan selling_price (sesuai struktur database Anda)
                $price = floatval($product->selling_price ?? 0);

                if ($price <= 0) {
                    throw new \Exception("Harga produk {$product->name} tidak valid (Rp 0)");
                }

                // Hitung total add-ons
                $addOnsTotal = 0;
                $addOnsData = [];
                
                if (isset($item['add_ons']) && is_array($item['add_ons'])) {
                    foreach ($item['add_ons'] as $addOn) {
                        $addOnPrice = floatval($addOn['price'] ?? 0);
                        $addOnsTotal += $addOnPrice;
                        $addOnsData[] = [
                            'id' => $addOn['id'] ?? null,
                            'name' => $addOn['name'] ?? '',
                            'price' => $addOnPrice,
                        ];
                    }
                }

                // Hitung subtotal item: (harga produk + add-ons) × qty
                $itemSubtotal = ($price + $addOnsTotal) * $item['qty'];
                $subtotal += $itemSubtotal;

                $itemsToInsert[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'price' => $price, // ✅ Harga yang benar
                    'qty' => $item['qty'],
                    'subtotal' => $itemSubtotal,
                    'notes' => $item['notes'] ?? null,
                    'add_ons' => $addOnsData,
                ];
            }

            // Hitung diskon
            $discountPercent = floatval($data['discount_percent'] ?? 0);
            $discountAmount = floatval($data['discount_amount'] ?? 0);
            
            if ($discountAmount <= 0 && $discountPercent > 0) {
                $discountAmount = $subtotal * ($discountPercent / 100);
            }
            
            $total = $subtotal - $discountAmount;
            $paid = floatval($data['paid'] ?? 0);
            $change = $paid - $total;

            // Validasi
            if ($total <= 0) {
                throw new \Exception("Total transaksi tidak valid");
            }
            
            if ($paid < $total) {
                throw new \Exception("Uang pembayaran kurang");
            }

            // Generate invoice number
            $invoiceNumber = 'INV-' . Carbon::now()->format('Ymd') . '-' . 
                str_pad((Transaction::whereDate('created_at', Carbon::today())->count() + 1), 5, '0', STR_PAD_LEFT);

            // Buat transaksi
            $transaction = Transaction::create([
                'invoice_number' => $invoiceNumber,
                'cashier_id' => $user->id,
                'customer_name' => $data['customer_name'] ?? null,
                'order_type' => $data['order_type'],
                'subtotal' => $subtotal,
                'discount_percent' => $discountPercent,
                'discount_amount' => $discountAmount,
                'total' => $total,
                'paid' => $paid,
                'change' => $change,
                'payment_method' => $data['payment_method'],
                'transacted_at' => Carbon::now(),
                'status' => 'completed',
            ]);

            // Simpan items dan kurangi stok
            foreach ($itemsToInsert as $itemData) {
                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $itemData['product_id'],
                    'product_name' => $itemData['product_name'],
                    'price' => $itemData['price'],
                    'qty' => $itemData['qty'],
                    'subtotal' => $itemData['subtotal'],
                    'notes' => $itemData['notes'],
                    'add_ons' => $itemData['add_ons'],
                ]);

                // Kurangi stok produk
                $product = Product::find($itemData['product_id']);
                if ($product) {
                    $product->decrement('stock', $itemData['qty']);
                }

                // ✅ Kurangi stok add-ons yang dipakai
                if (!empty($itemData['add_ons'])) {
                    foreach ($itemData['add_ons'] as $addOn) {
                        \App\Models\AddOn::where('id', $addOn['id'])->decrement('stock', 1);
                    }
                }
            }

            return $transaction->load(['items', 'cashier']);
        });
    }
}