<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SettingController extends Controller
{
    /**
     * Get all settings grouped
     */
    public function index()
    {
        $groups = ['general', 'receipt', 'appearance'];
        $result = [];
        
        foreach ($groups as $group) {
            $result[$group] = Setting::where('group', $group)
                ->orderBy('key')
                ->get()
                ->map(fn($s) => [
                    'key' => $s->key,
                    'value' => $s->value,
                    'type' => $s->type,
                    'description' => $s->description,
                ]);
        }

        return response()->json(['data' => $result]);
    }

    /**
     * Update settings
     */
    public function update(Request $request)
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable',
        ]);

        foreach ($request->settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'type' => $setting['type'] ?? 'string',
                ]
            );
        }

        Setting::clearCache();

        return response()->json(['message' => 'Pengaturan berhasil disimpan']);
    }

    /**
     * Upload file (logo/favicon)
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,svg,webp|max:2048',
            'key' => 'required|string|in:app_logo,app_favicon',
        ]);

        $file = $request->file('file');
        $key = $request->key;
        
        // Hapus file lama jika ada
        $oldPath = Setting::get($key);
        if ($oldPath && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }

        // Simpan file baru
        $extension = $file->getClientOriginalExtension();
        $filename = $key . '_' . time() . '.' . $extension;
        $path = $file->storeAs('settings', $filename, 'public');

        // Update setting
        Setting::set($key, $path, 'file');

        return response()->json([
            'message' => 'File berhasil diupload',
            'path' => Storage::url($path),
            'key' => $key,
        ]);
    }

    /**
     * Get public settings (untuk frontend - tanpa auth)
     */
    public function public()
    {
        $settings = [
            'app_name' => Setting::get('app_name', 'Warung Bakso'),
            'app_tagline' => Setting::get('app_tagline', ''),
            'app_logo' => Setting::get('app_logo'),
            'theme_mode' => Setting::get('theme_mode', 'light'),
            'primary_color' => Setting::get('primary_color', '#f59e0b'),
            'receipt' => Setting::getByGroup('receipt'),
        ];

        return response()->json(['data' => $settings]);
    }
}