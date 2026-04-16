<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverStatus extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id', 'status', 'current_lat', 'current_lng',
        'current_location_name', 'last_seen',
    ];

    protected $casts = [
        'current_lat' => 'decimal:8',
        'current_lng' => 'decimal:8',
        'last_seen'   => 'datetime',
    ];

    const STATUS_AVAILABLE = 'available';
    const STATUS_BUSY      = 'busy';
    const STATUS_OFFLINE   = 'offline';

    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function isAvailable(): bool { return $this->status === self::STATUS_AVAILABLE; }
    public function isOffline(): bool   { return $this->status === self::STATUS_OFFLINE; }
}
