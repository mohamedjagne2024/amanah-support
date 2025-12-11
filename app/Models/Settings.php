<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class Settings extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'value',
    ];

    /**
     * Get a setting value by name.
     *
     * @param string $name The setting name/key
     * @param mixed $default Default value if not found
     * @return string|null
     */
    public static function get(string $name, mixed $default = null): ?string
    {
        $setting = static::where('name', $name)->first();

        return $setting?->value ?? $default;
    }

    /**
     * Set a setting value by name.
     *
     * @param string $name The setting name/key
     * @param string|null $value The value to store
     * @return static
     */
    public static function set(string $name, ?string $value): static
    {
        return static::updateOrCreate(
            ['name' => $name],
            ['value' => $value]
        );
    }
}
