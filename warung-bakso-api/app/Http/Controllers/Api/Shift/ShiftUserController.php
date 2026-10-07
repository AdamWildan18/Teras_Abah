<?php

namespace App\Http\Controllers\Api\Shift;

use App\Http\Controllers\Controller;
use App\Models\ShiftUser;
use App\Models\Transaction;
use App\Http\Requests\Shift\StoreShiftUserRequest;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ShiftUserController extends Controller
{
    public function index(Request $request)
    {
        $query = ShiftUser::with(['user', 'shift', 'transactions']);

        $date = $request->filled('date') ? $request->date : today()->toDateString();
        $query->where('date', $date);

        if ($request->filled('shift_id')) $query->where('shift_id', $request->shift_id);
        if ($request->filled('user_id')) $query->where('user_id', $request->user_id);
        if ($request->filled('status')) $query->where('status', $request->status);

        $shiftUsers = $query->orderBy('clock_in', 'desc')->get();

        return response()->json(['data' => $shiftUsers]);
    }

    public function store(StoreShiftUserRequest $request)
    {
        $shiftUser = ShiftUser::create([
            'user_id' => $request->user_id,
            'shift_id' => $request->shift_id,
            'date' => $request->date,
            'cash_start' => $request->cash_start ?? 0,
            'status' => 'open',
        ]);

        return response()->json([
            'message' => 'Karyawan berhasil di-assign ke shift.',
            'data' => $shiftUser->load(['user', 'shift']),
        ], 201);
    }

    public function clockIn(ShiftUser $shiftUser)
    {
        if ($shiftUser->clock_in) {
            return response()->json(['message' => 'Sudah clock in.'], 422);
        }

        $shiftUser->update(['clock_in' => Carbon::now()->format('H:i:s')]);

        return response()->json([
            'message' => 'Clock in berhasil.',
            'data' => $shiftUser->fresh(['user', 'shift']),
        ]);
    }

    public function clockOut(Request $request, ShiftUser $shiftUser)
    {
        $request->validate(['cash_end' => 'required|numeric|min:0']);

        if (!$shiftUser->clock_in) return response()->json(['message' => 'Belum clock in.'], 422);
        if ($shiftUser->status === 'closed') return response()->json(['message' => 'Shift sudah ditutup.'], 422);

        $totalTransactions = Transaction::where('shift_user_id', $shiftUser->id)
            ->where('status', 'completed')
            ->sum('total');

        $cashStart = $shiftUser->cash_start ?? 0;
        $cashEnd = $request->cash_end;
        $difference = $cashEnd - $cashStart - $totalTransactions;

        $shiftUser->update([
            'clock_out' => Carbon::now()->format('H:i:s'),
            'cash_end' => $cashEnd,
            'status' => 'closed',
        ]);

        return response()->json([
            'message' => 'Shift berhasil ditutup.',
            'data' => $shiftUser->fresh(['user', 'shift']),
            'summary' => [
                'cash_start' => $cashStart,
                'cash_end' => $cashEnd,
                'total_transactions' => $totalTransactions,
                'expected_cash' => $cashStart + $totalTransactions,
                'difference' => $difference,
            ],
        ]);
    }

    public function stats(Request $request)
    {
        $date = $request->filled('date') ? $request->date : today()->toDateString();

        return response()->json([
            'data' => [
                'total_shifts' => ShiftUser::where('date', $date)->count(),
                'active_shifts' => ShiftUser::where('date', $date)->where('status', 'open')->count(),
                'closed_shifts' => ShiftUser::where('date', $date)->where('status', 'closed')->count(),
                'total_transactions' => Transaction::whereHas('shiftUser', fn($q) => $q->where('date', $date))
                    ->where('status', 'completed')->sum('total'),
            ],
        ]);
    }
}