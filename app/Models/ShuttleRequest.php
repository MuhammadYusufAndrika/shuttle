<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShuttleRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_code', 'user_id', 'location_id', 'destination',
        'driver_id', 'status', 'priority', 'passenger_count', 'notes',
        'requested_at', 'accepted_at', 'on_the_way_at', 'arrived_at',
        'completed_at', 'cancelled_at', 'cancel_reason', 'response_time_seconds',
    ];

    protected $casts = [
        'requested_at'   => 'datetime',
        'accepted_at'    => 'datetime',
        'on_the_way_at'  => 'datetime',
        'arrived_at'     => 'datetime',
        'completed_at'   => 'datetime',
        'cancelled_at'   => 'datetime',
        'priority'       => 'integer',
        'passenger_count'=> 'integer',
        'response_time_seconds' => 'integer',
    ];

    const STATUS_PENDING    = 'pending';
    const STATUS_ACCEPTED   = 'accepted';
    const STATUS_ON_THE_WAY = 'on_the_way';
    const STATUS_ARRIVED    = 'arrived';
    const STATUS_COMPLETED  = 'completed';
    const STATUS_CANCELLED  = 'cancelled';

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    // Scopes
    public function scopePending($query)    { return $query->where('status', self::STATUS_PENDING); }
    public function scopeActive($query)     { return $query->whereIn('status', [self::STATUS_PENDING, self::STATUS_ACCEPTED, self::STATUS_ON_THE_WAY, self::STATUS_ARRIVED]); }
    public function scopeCompleted($query)  { return $query->where('status', self::STATUS_COMPLETED); }

    // Helpers
    public function isPending(): bool    { return $this->status === self::STATUS_PENDING; }
    public function isActive(): bool     { return in_array($this->status, [self::STATUS_PENDING, self::STATUS_ACCEPTED, self::STATUS_ON_THE_WAY, self::STATUS_ARRIVED]); }
    public function isCompleted(): bool  { return $this->status === self::STATUS_COMPLETED; }
    public function isCancelled(): bool  { return $this->status === self::STATUS_CANCELLED; }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->request_code)) {
                $model->request_code = 'SR-' . now()->format('Ymd') . '-' . strtoupper(substr(uniqid(), -4));
            }
        });
    }
}
