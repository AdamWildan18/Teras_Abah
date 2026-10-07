<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'description',
    ];

    protected $casts = [
        'value' => 'string',
    ];

    /**
     * Get setting value by key (with cache)
     */
    public static function get(string $key, $default = null)
    {
        return Cache::remember("setting_{$key}", 3600, function () use ($key, $default) {
            $setting = self::where('key', $key)->first();
            return $setting ? self::castValue($setting->value, $setting->type) : $default;
        });
    }

    /**
     * Set setting value by key
     */
    public static function set(string $key, $value, string $type = 'string'): void
    {
        $setting = self::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'type' => $type]
        );
        Cache::forget("setting_{$key}");
        Cache::forget('settings_all');
        
        // Clear group cache
        Cache::forget("settings_group_{$setting->group}");
    }

    /**
     * Get all settings by group
     */
    public static function getByGroup(string $group): array
    {
        return Cache::remember("settings_group_{$group}", 3600, function () use ($group) {
            return self::where('group', $group)
                ->get()
                ->mapWithKeys(fn($s) => [$s->key => self::castValue($s->value, $s->type)])
                ->toArray();
        });
    }

    /**
     * Clear all settings cache (FIX: tanpa tags)
     */
    public static function clearCache(): void
    {
        // Hapus cache per-key (tanpa tags)
        $settings = self::all();
        foreach ($settings as $setting) {
            Cache::forget("setting_{$setting->key}");
            Cache::forget("settings_group_{$setting->group}");
        }
        Cache::forget('settings_all');
    }

    /**
     * Cast value based on type
     */
    private static function castValue($value, string $type)
    {
        if ($value === null) return null;
        
        return match($type) {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'number', 'integer' => (int) $value,
            'float' => (float) $value,
            'json' => json_decode($value, true),
            default => $value,
        };
    }
}