<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Handle login
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Attempt login
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Email atau password salah.'
            ], 401);
        }

        // Get user
        $user = User::where('email', $request->email)->first();

        // Create token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Return response (Manual array untuk menghindari error relasi)
        return response()->json([
            'message' => 'Login berhasil',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'kasir', // Fallback ke 'kasir' jika kosong
                'is_active' => $user->is_active ?? true,
            ]
        ]);
    }

    /**
     * Handle logout
     */
    public function logout(Request $request)
    {
        // Revoke token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil'
        ]);
    }

    /**
     * Get current user
     */
    public function user(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ?? 'kasir',
            'is_active' => $user->is_active ?? true,
        ]);
    }
}