<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Database\QueryException;

class AttendanceController extends Controller
{
    /**
     * Get absensi hari ini
     */
    public function today(Request $request)
    {
        try {
            $date = $request->get('date', Carbon::today()->toDateString());
            
            $attendances = Attendance::with(['user', 'inputBy'])
                ->where('date', $date)
                ->orderBy('created_at', 'asc')
                ->get();

            // Group by user
            $grouped = $attendances->groupBy('user_id')->map(function ($items) {
                $checkIn = $items->firstWhere('type', 'check_in');
                $checkOut = $items->firstWhere('type', 'check_out');
                
                return [
                    'user' => $checkIn?->user ?? $checkOut?->user,
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'status' => $checkIn?->status ?? $checkOut?->status ?? 'alpha',
                ];
            });

            return response()->json([
                'data' => [
                    'date' => $date,
                    'attendances' => $grouped->values(),
                    'summary' => [
                        'total' => $grouped->count(),
                        'hadir' => $grouped->where('status', 'hadir')->count(),
                        'izin' => $grouped->where('status', 'izin')->count(),
                        'sakit' => $grouped->where('status', 'sakit')->count(),
                        'cuti' => $grouped->where('status', 'cuti')->count(),
                        'alpha' => $grouped->where('status', 'alpha')->count(),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting today attendance: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Gagal mengambil data absensi',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Input absensi manual (oleh admin)
     */
    public function inputManual(Request $request)
    {
        try {
            $validated = $request->validate([
                'date' => 'required|date',
                'user_id' => 'required|exists:users,id',
                'type' => 'required|in:check_in,check_out',
                'status' => 'required|in:hadir,izin,sakit,cuti,alpha',
                'time' => 'nullable|string',
                'notes' => 'nullable|string',
            ]);

            // Konversi format waktu ke 24 jam (H:i)
            if (!empty($validated['time'])) {
                $timeFormats = ['H:i:s', 'h:i:s A', 'h:i:s a', 'H:i', 'h:i A', 'h:i a'];
                $parsedTime = null;
                
                foreach ($timeFormats as $format) {
                    $dateTime = \DateTime::createFromFormat($format, $validated['time']);
                    if ($dateTime) {
                        $parsedTime = $dateTime->format('H:i');
                        break;
                    }
                }
                
                $validated['time'] = $parsedTime ?? date('H:i');
            } else {
                $validated['time'] = date('H:i');
            }

            // Cek apakah sudah ada
            $existing = Attendance::where('date', $validated['date'])
                ->where('user_id', $validated['user_id'])
                ->where('type', $validated['type'])
                ->first();

            if ($existing) {
                $existing->update([
                    ...$validated,
                    'method' => 'manual',
                    'input_by' => Auth::id(),
                ]);
                $attendance = $existing->fresh(['user', 'inputBy']);
            } else {
                $attendance = Attendance::create([
                    ...$validated,
                    'method' => 'manual',
                    'input_by' => Auth::id(),
                ]);
                $attendance->load(['user', 'inputBy']);
            }

            return response()->json([
                'message' => 'Absensi berhasil disimpan',
                'data' => $attendance,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error input manual attendance: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal menyimpan absensi',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

        /**
     * Scan QR Code untuk absensi
     */
    public function scan(Request $request)
    {
        try {
            $validated = $request->validate([
                'qr_code' => 'required|string',
                'type' => 'required|in:check_in,check_out',
            ]);

            $user = User::where('qr_code', $validated['qr_code'])->first();

            if (!$user) {
                return response()->json(['message' => 'QR Code tidak valid'], 404);
            }

            $today = Carbon::today()->toDateString();
            $now = Carbon::now()->format('H:i');

            // ✅ Cek apakah sudah ada absensi dengan type yang sama hari ini
            $existing = Attendance::where('date', $today)
                ->where('user_id', $user->id)
                ->where('type', $validated['type'])
                ->first();

            if ($existing) {
                // ✅ SELALU UPDATE jika sudah ada (tidak pernah reject)
                $existing->update([
                    'time' => $now,
                    'method' => 'scan',
                ]);
                
                return response()->json([
                    'message' => "Waktu {$validated['type']} berhasil diupdate menjadi {$now}",
                    'data' => [
                        'user' => $user->name,
                        'type' => $validated['type'],
                        'time' => $now,
                        'updated' => true,
                    ],
                ]);
            }

            // Jika belum ada, buat record baru
            $attendance = Attendance::create([
                'date' => $today,
                'user_id' => $user->id,
                'type' => $validated['type'],
                'status' => 'hadir',
                'time' => $now,
                'method' => 'scan',
            ]);

            return response()->json([
                'message' => "{$validated['type']} berhasil",
                'data' => [
                    'user' => $user->name,
                    'type' => $validated['type'],
                    'time' => $now,
                    'updated' => false,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error scanning QR: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal scan QR',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Generate QR Code untuk user
     */
    public function generateQrCode($userId)
    {
        try {
            $user = User::findOrFail($userId);
            $qrCode = 'USR-' . $user->id . '-' . strtoupper(substr(md5($user->email . time()), 0, 8));
            $user->update(['qr_code' => $qrCode]);
            
            // Generate QR code sebagai SVG string
            $qrImage = (string) QrCode::size(300)->generate($qrCode);

            return response()->json([
                'data' => [
                    'user' => $user,
                    'qr_code' => $qrCode,
                    'qr_image' => $qrImage,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error generating QR code: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal generate QR',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get QR Code user
     */
    public function getQrCode($userId)
    {
        try {
            $user = User::findOrFail($userId);

            if (!$user->qr_code) {
                return $this->generateQrCode($userId);
            }

            // Generate QR code sebagai SVG string
            $qrImage = (string) QrCode::size(300)->generate($user->qr_code);

            return response()->json([
                'data' => [
                    'user' => $user,
                    'qr_code' => $user->qr_code,
                    'qr_image' => $qrImage,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting QR code: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal mengambil QR code',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Riwayat absensi
     */
    public function history(Request $request)
    {
        try {
            $validated = $request->validate([
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date',
                'user_id' => 'nullable|exists:users,id',
            ]);

            $query = Attendance::with(['user', 'inputBy']);

            if (isset($validated['date_from'])) {
                $query->where('date', '>=', $validated['date_from']);
            }
            if (isset($validated['date_to'])) {
                $query->where('date', '<=', $validated['date_to']);
            }
            if (isset($validated['user_id'])) {
                $query->where('user_id', $validated['user_id']);
            }

            $attendances = $query->orderBy('date', 'desc')
                ->orderBy('created_at')
                ->paginate($request->get('per_page', 15));

            return response()->json([
                'data' => $attendances->items(),
                'meta' => [
                    'current_page' => $attendances->currentPage(),
                    'last_page' => $attendances->lastPage(),
                    'total' => $attendances->total(),
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting attendance history: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal mengambil riwayat',
                'error' => $e->getMessage(),
            ], 500);
        }
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
                'total_days' => $attendances->pluck('date')->unique()->count(), // ✅ Hari kerja unik
                'hadir' => $attendances->where('status', 'hadir')
                    ->pluck('date')
                    ->unique()
                    ->count(), // ✅ Hitung hari unik dengan status hadir
                'izin' => $attendances->where('status', 'izin')
                    ->pluck('date')
                    ->unique()
                    ->count(),
                'sakit' => $attendances->where('status', 'sakit')
                    ->pluck('date')
                    ->unique()
                    ->count(),
                'cuti' => $attendances->where('status', 'cuti')
                    ->pluck('date')
                    ->unique()
                    ->count(),
                'alpha' => $attendances->where('status', 'alpha')
                    ->pluck('date')
                    ->unique()
                    ->count(),
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

}