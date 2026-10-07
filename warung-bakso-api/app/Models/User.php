<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',      // ✅ DITAMBAHKAN: Untuk nomor HP karyawan
        'qr_code',    // ✅ DITAMBAHKAN: Untuk menyimpan kode unik QR absensi
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    // ==========================================
    // ROLE HELPER METHODS
    // ==========================================

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function isKasir(): bool
    {
        return $this->role === 'kasir';
    }

    public function isProduksi(): bool
    {
        return $this->role === 'produksi';
    }

    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    public function hasAnyRole(array $roles): bool
    {
        return in_array($this->role, $roles);
    }

    // ==========================================
    // PERMISSION CHECKS
    // ==========================================

    public function canAccessInventory(): bool
    {
        return $this->hasAnyRole(['admin', 'owner']);
    }

    public function canAccessProduction(): bool
    {
        return $this->hasAnyRole(['admin', 'owner', 'produksi']);
    }

    public function canAccessKasir(): bool
    {
        return $this->hasAnyRole(['admin', 'owner', 'kasir']);
    }

    public function canAccessFinance(): bool
    {
        return $this->hasAnyRole(['admin', 'owner']);
    }

    public function canManageShift(): bool
    {
        return $this->hasAnyRole(['admin', 'owner']);
    }

    // ==========================================
    // RELATIONSHIPS
    // ==========================================

    /**
     * Get all transactions where user is cashier
     */
    public function cashierTransactions()
    {
        return $this->hasMany(\App\Models\Transaction::class, 'cashier_id');
    }

    /**
     * Get all shift assignments
     */
    public function shiftUsers()
    {
        return $this->hasMany(\App\Models\ShiftUser::class);
    }

    /**
     * Get all financial records created by user
     */
    public function financialRecords()
    {
        return $this->hasMany(\App\Models\FinancialRecord::class);
    }

    /**
     * Get all stock movements by user
     */
    public function stockMovements()
    {
        return $this->hasMany(\App\Models\StockMovement::class);
    }

    /**
     * Get all attendance records for this user
     */
    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    // ==========================================
    // SCOPES
    // ==========================================

    /**
     * Scope a query to only include active users.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include users with specific role.
     */
    public function scopeRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Generate QR code data (untuk absensi scan)
     */
    public function getQrData()
    {
        return [
            'user_id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
        ];
    }
}