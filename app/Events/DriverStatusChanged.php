<?php

namespace App\Events;

use App\Models\DriverStatus;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public User $driver, public DriverStatus $status) {}

    public function broadcastOn(): array
    {
        return [new Channel('requests')];
    }

    public function broadcastAs(): string
    {
        return 'driver.status.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'driver_id'    => $this->driver->id,
            'driver_name'  => $this->driver->name,
            'status'       => $this->status->status,
            'current_lat'  => $this->status->current_lat,
            'current_lng'  => $this->status->current_lng,
            'location'     => $this->status->current_location_name,
            'last_seen'    => $this->status->last_seen?->toISOString(),
        ];
    }
}
