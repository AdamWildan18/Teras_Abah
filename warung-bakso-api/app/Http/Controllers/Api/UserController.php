<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Tambah karyawan baru
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:6',
                'role' => 'required|in:admin,owner,kasir,produksi,karyawan',
                'phone' => 'nullable|string|max:20',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'phone' => $request->phone,
                'is_active' => $request->boolean('is_active', true),
            ]);

            return response()->json([
                'message' => 'Karyawan berhasil ditambahkan',
                'data' => $user,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error creating user: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal menambahkan karyawan',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update data karyawan
     */
    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $id,
                'password' => 'nullable|string|min:6',
                'role' => 'sometimes|in:admin,owner,kasir,produksi,karyawan',
                'phone' => 'nullable|string|max:20',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $updateData = $request->only(['name', 'email', 'role', 'phone', 'is_active']);

            // Hanya update password jika diisi
            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            $user->update($updateData);

            return response()->json([
                'message' => 'Data karyawan berhasil diupdate',
                'data' => $user->fresh(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating user: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal mengupdate karyawan',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Hapus karyawan
     */
    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);

            // Jangan biarkan admin menghapus dirinya sendiri
            if ($user->id === auth()->id()) {
                return response()->json([
                    'message' => 'Anda tidak dapat menghapus akun sendiri',
                ], 422);
            }

            $user->delete();

            return response()->json([
                'message' => 'Karyawan berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting user: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal menghapus karyawan',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}