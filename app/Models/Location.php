<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'name_en', 'code', 'zone',
        'lat', 'lng', 'address', 'qr_token', 'is_active',
    ];

    protected $casts = [
        'lat' => 'decimal:8',
        'lng' => 'decimal:8',
        'is_active' => 'boolean',
    ];

    public function shuttleRequests()
    {
        return $this->hasMany(ShuttleRequest::class);
    }

    /**
     * Get display name based on locale
     */
    public function getDisplayName(string $locale = 'id'): string
    {
        if ($locale === 'en' && $this->name_en) {
            return $this->name_en;
        }
        return $this->name;
    }
}
