<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ✅ Hapus semua unique index yang melibatkan date dan user_id
        $indexes = DB::select("SHOW INDEX FROM `attendances` WHERE Non_unique = 0");
        
        foreach ($indexes as $index) {
            // Lewati PRIMARY key
            if ($index->Key_name === 'PRIMARY') {
                continue;
            }
            
            // Drop index yang melibatkan kolom date, user_id, atau type
            if (in_array($index->Column_name, ['date', 'user_id', 'type'])) {
                try {
                    DB::statement("ALTER TABLE `attendances` DROP INDEX `{$index->Key_name}`");
                } catch (\Exception $e) {
                    // Abaikan jika gagal
                }
            }
        }

        // ✅ Tambah unique constraint baru: (date, user_id, type)
        Schema::table('attendances', function (Blueprint $table) {
            $table->unique(['date', 'user_id', 'type'], 'attendances_date_user_type_unique');
        });
    }

    public function down(): void
    {
        // Hapus constraint baru
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropUnique('attendances_date_user_type_unique');
        });

        // Kembalikan ke constraint lama (hanya date + user_id)
        Schema::table('attendances', function (Blueprint $table) {
            $table->unique(['date', 'user_id'], 'attendances_date_user_id_unique');
        });
    }

        /**
     * Laporan Absensi (dengan filter tanggal & karyawan)
     */
    public function report(Request $request)
    {
        try {
            $validated = $request->validate([
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date',
                'user_id' => 'nullable|exists:users,id',
                'role' => 'nullable|string',
            ]);

            $query = Attendance::with(['user', 'inputBy']);

            // Filter tanggal
            if (!empty($validated['date_from'])) {
                $query->where('date', '>=', $validated['date_from']);
            } else {
                // Default: bulan ini
                $query->where('date', '>=', Carbon::now()->startOfMonth()->toDateString());
            }

            if (!empty($validated['date_to'])) {
                $query->where('date', '<=', $validated['date_to']);
            } else {
                $query->where('date', '<=', Carbon::now()->toDateString());
            }

            // Filter karyawan
            if (!empty($validated['user_id'])) {
                $query->where('user_id', $validated['user_id']);
            }

            // Filter role
            if (!empty($validated['role'])) {
                $query->whereHas('user', function ($q) use ($validated) {
                    $q->where('role', $validated['role']);
                });
            }

            $attendances = $query->orderBy('date', 'desc')
                ->orderBy('user_id')
                ->get();

            // Group by user untuk summary
            $summaryByUser = $attendances->groupBy('user_id')->map(function ($items) {
                return [
                    'user' => $items->first()->user,
                    'total_days' => $items->pluck('date')->unique()->count(),
                    'hadir' => $items->where('status', 'hadir')->count(),
                    'izin' => $items->where('status', 'izin')->count(),
                    'sakit' => $items->where('status', 'sakit')->count(),
                    'cuti' => $items->where('status', 'cuti')->count(),
                    'alpha' => $items->where('status', 'alpha')->count(),
                ];
            })->values();

            // Summary keseluruhan
            $totalSummary = [
                'total_records' => $attendances->count(),
                'total_users' => $attendances->pluck('user_id')->unique()->count(),
                'hadir' => $attendances->where('status', 'hadir')->count(),
                'izin' => $attendances->where('status', 'izin')->count(),
                'sakit' => $attendances->where('status', 'sakit')->count(),
                'cuti' => $attendances->where('status', 'cuti')->count(),
                'alpha' => $attendances->where('status', 'alpha')->count(),
            ];

            return response()->json([
                'data' => [
                    'attendances' => $attendances,
                    'summary_by_user' => $summaryByUser,
                    'total_summary' => $totalSummary,
                    'date_from' => $validated['date_from'] ?? Carbon::now()->startOfMonth()->toDateString(),
                    'date_to' => $validated['date_to'] ?? Carbon::now()->toDateString(),
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting attendance report: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal mengambil laporan absensi',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
};