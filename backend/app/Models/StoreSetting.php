<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StoreSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
    ];

    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();
        if (!$setting) return $default;
        
        $val = json_decode($setting->value, true);
        return (json_last_error() === JSON_ERROR_NONE) ? $val : $setting->value;
    }

    public static function set(string $key, mixed $value): void
    {
        $serialized = is_array($value) || is_object($value) ? json_encode($value) : (string)$value;
        static::updateOrCreate(['key' => $key], ['value' => $serialized]);
    }
}
