<?php

namespace App\Events;

use App\Models\ShuttleRequest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RequestStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ShuttleRequest $request)
    {
        $this->request->load(['driver', 'location']);
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('requests'),
            new PrivateChannel('request.' . $this->request->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'request.status.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id'           => $this->request->id,
            'request_code' => $this->request->request_code,
            'status'       => $this->request->status,
            'driver_name'  => $this->request->driver?->name,
            'driver_phone' => $this->request->driver?->phone,
            'location'     => $this->request->location->name,
            'updated_at'   => now()->toISOString(),
        ];
    }
}
