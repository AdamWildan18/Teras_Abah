<?php

namespace App\Http\Controllers\Api\Shift;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    public function index()
    {
        $shifts = Shift::withCount(['shiftUsers' => fn($q) => $q->where('date', today())])
            ->orderBy('start_time')
            ->get();

        return response()->json(['data' => $shifts]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'is_active' => 'boolean',
        ]);

        $shift = Shift::create($request->all());

        return response()->json([
            'message' => 'Shift berhasil ditambahkan.',
            'data' => $shift,
        ], 201);
    }

    public function update(Request $request, Shift $shift)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'is_active' => 'boolean',
        ]);

        $shift->update($request->all());

        return response()->json([
            'message' => 'Shift berhasil diupdate.',
            'data' => $shift,
        ]);
    }

    public function destroy(Shift $shift)
    {
        $shift->delete();
        return response()->json(['message' => 'Shift berhasil dihapus.']);
    }
}