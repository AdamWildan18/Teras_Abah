<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MasterData\RawMaterialController;
use App\Http\Controllers\Api\MasterData\ProductController;
use App\Http\Controllers\Api\MasterData\RecipeController;
use App\Http\Controllers\Api\Production\ProductionBatchController;
use App\Http\Controllers\Api\Cashier\TransactionController;
use App\Http\Controllers\Api\Finance\FinancialReportController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\Shift\ShiftController;
use App\Http\Controllers\Api\Shift\ShiftUserController;
use App\Http\Controllers\Api\AddOnController;
use App\Http\Controllers\Api\AddonProductionController;
use App\Models\User;

// ==========================================
// PUBLIC ROUTES (Tidak perlu login)
// ==========================================
Route::post('/login', [AuthController::class, 'login']);

// ==========================================
// PROTECTED ROUTES (Perlu token auth:sanctum)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    
    // 1. AUTH & USER INFO
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // 2. USERS / KARYAWAN MANAGEMENT
    // GET: Ambil daftar user (untuk dropdown & halaman Data Karyawan)
    Route::get('/users', function(\Illuminate\Http\Request $request) {
        $query = User::where('is_active', true);

        if ($request->has('role')) {
            $roles = explode(',', $request->role);
            $query->whereIn('role', $roles);
        }

        return response()->json([
            'data' => $query->select('id', 'name', 'email', 'role', 'phone', 'qr_code')
                ->orderBy('name')
                ->get()
        ]);
    });

    // CRUD Users (Hanya Admin & Owner)
    Route::middleware('role:admin,owner')->group(function () {
        Route::post('/users', [\App\Http\Controllers\Api\UserController::class, 'store']);
        Route::put('/users/{id}', [\App\Http\Controllers\Api\UserController::class, 'update']);
        Route::delete('/users/{id}', [\App\Http\Controllers\Api\UserController::class, 'destroy']);
    });

    // 3. DASHBOARD (Semua role)
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // ==========================================
    // 4. INVENTORY
    // ==========================================
    
    // Products ALL - SEMUA role bisa akses (kasir butuh untuk POS)
    Route::get('/products/all', [ProductController::class, 'all']);
    Route::get('/products/{product}/recipe', [RecipeController::class, 'byProduct']);
    
    // Raw Materials & Products CRUD - Hanya Admin & Owner
    Route::middleware('role:admin,owner')->group(function () {
        Route::get('/raw-materials/all', [RawMaterialController::class, 'all']);
        Route::apiResource('/raw-materials', RawMaterialController::class);
        
        // ROUTE BARU: Tambah Stok (Restock)
        Route::post('/raw-materials/{id}/restock', [RawMaterialController::class, 'restock']);
        
        Route::apiResource('/products', ProductController::class);
        Route::apiResource('/recipes', RecipeController::class);
    });

    // ==========================================
    // 5. PRODUCTION (Admin, Owner, Produksi)
    // ==========================================
    Route::middleware('role:admin,owner,produksi')->group(function () {
        Route::get('/production/stats', [ProductionBatchController::class, 'stats']);
        Route::post('/production/preview', [ProductionBatchController::class, 'preview']);
        Route::post('/production/{productionBatch}/cancel', [ProductionBatchController::class, 'cancel']);
        Route::apiResource('/production', ProductionBatchController::class)->parameters([
            'production' => 'productionBatch'
        ]);
    });

    // ==========================================
    // 6. CASHIER / POS (Admin, Owner, Kasir)
    // ==========================================
    Route::middleware('role:admin,owner,kasir')->group(function () {
        Route::apiResource('/transactions', TransactionController::class); 
    });
    
    // ==========================================
    // 7. FINANCE (Hanya Admin & Owner)
    // ==========================================
    Route::middleware('role:admin,owner')->group(function () {
        Route::get('/finance/summary', [FinancialReportController::class, 'summary']);
        Route::get('/finance/categories', [FinancialReportController::class, 'categories']);
        Route::apiResource('/finance/records', FinancialReportController::class)->except(['store', 'update', 'destroy']);
    });

    // ==========================================
    // 8. SHIFT MANAGEMENT (Legacy / Opsional)
    // ==========================================
    Route::middleware('role:admin,owner')->group(function () {
        Route::apiResource('/shifts', ShiftController::class);
        Route::post('/shift-users', [ShiftUserController::class, 'store']);
    });

    Route::get('/shift-users/stats', [ShiftUserController::class, 'stats']);
    Route::get('/shift-users', [ShiftUserController::class, 'index']);
    Route::post('/shift-users/{shiftUser}/clock-in', [ShiftUserController::class, 'clockIn']);
    Route::post('/shift-users/{shiftUser}/clock-out', [ShiftUserController::class, 'clockOut']);

    // Settings (Admin & Owner only)
    Route::middleware('role:admin,owner')->group(function () {
        Route::get('/settings', [\App\Http\Controllers\Api\SettingController::class, 'index']);
        Route::post('/settings', [\App\Http\Controllers\Api\SettingController::class, 'update']);
        Route::post('/settings/upload', [\App\Http\Controllers\Api\SettingController::class, 'upload']);
    });

    // Public settings (untuk nama app & logo di login page)
    Route::get('/settings/public', [\App\Http\Controllers\Api\SettingController::class, 'public']);

    // ==========================================
    // 9. ADD-ONS MANAGEMENT
    // ==========================================
    
    // View add-ons (semua authenticated user bisa lihat)
    Route::get('/add-ons', [AddOnController::class, 'index']);
    Route::get('/add-ons/raw-materials', [AddOnController::class, 'rawMaterials']);
    
    // CRUD add-ons & Production (Hanya Admin & Owner)
    Route::middleware('role:admin,owner')->group(function () {
        Route::post('/add-ons', [AddOnController::class, 'store']);
        Route::put('/add-ons/{addOn}', [AddOnController::class, 'update']);
        Route::delete('/add-ons/{addOn}', [AddOnController::class, 'destroy']);
        
        Route::get('/addon-production', [AddonProductionController::class, 'index']);
        Route::post('/addon-production', [AddonProductionController::class, 'store']);
        Route::post('/addon-production/preview', [AddonProductionController::class, 'preview']);
        Route::post('/addon-production/{batch}/cancel', [AddonProductionController::class, 'cancel']);
    });

    // ==========================================
    // 10. ATTENDANCE & EMPLOYEE (ABSENSI)
    // ==========================================
    
    // Scan QR Code (semua user yang login bisa scan)
    Route::post('/attendance/scan', [\App\Http\Controllers\Api\AttendanceController::class, 'scan']);
    
    // Get absensi hari ini (semua user)
    Route::get('/attendance/today', [\App\Http\Controllers\Api\AttendanceController::class, 'today']);
    
    // Admin & Owner only
    Route::middleware('role:admin,owner')->group(function () {
        Route::get('/attendance/report', [\App\Http\Controllers\Api\AttendanceController::class, 'report']);
        Route::post('/attendance/manual', [\App\Http\Controllers\Api\AttendanceController::class, 'inputManual']);
        Route::get('/attendance/history', [\App\Http\Controllers\Api\AttendanceController::class, 'history']);
        Route::get('/attendance/qr-code/{userId}', [\App\Http\Controllers\Api\AttendanceController::class, 'getQrCode']);
        Route::post('/attendance/qr-code/{userId}/generate', [\App\Http\Controllers\Api\AttendanceController::class, 'generateQrCode']);
    });
});