<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name', 'employee_id', 'email', 'password',
        'role', 'phone', 'photo', 'device_token',
        'push_subscription', 'is_active',
    ];

    protected $hidden = ['password', 'remember_token', 'push_subscription'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'push_subscription' => 'array',
        'is_active' => 'boolean',
    ];

    // Role helpers
    public function isAdmin(): bool    { return $this->role === 'admin'; }
    public function isDriver(): bool   { return $this->role === 'driver'; }
    public function isEmployee(): bool { return $this->role === 'employee'; }

    // Relationships
    public function requests()
    {
        return $this->hasMany(ShuttleRequest::class, 'user_id');
    }

    public function driverRequests()
    {
        return $this->hasMany(ShuttleRequest::class, 'driver_id');
    }

    public function driverStatus()
    {
        return $this->hasOne(DriverStatus::class, 'driver_id');
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }
}
