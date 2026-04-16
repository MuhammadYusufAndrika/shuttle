<?php

namespace App\Events;

use App\Models\ShuttleRequest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RequestCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ShuttleRequest $request)
    {
        $this->request->load(['user', 'location']);
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('requests'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'request.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id'              => $this->request->id,
            'request_code'    => $this->request->request_code,
            'user_name'       => $this->request->user->name,
            'location'        => $this->request->location->name,
            'location_en'     => $this->request->location->name_en,
            'priority'        => $this->request->priority,
            'passenger_count' => $this->request->passenger_count,
            'notes'           => $this->request->notes,
            'requested_at'    => $this->request->requested_at->toISOString(),
        ];
    }
}
