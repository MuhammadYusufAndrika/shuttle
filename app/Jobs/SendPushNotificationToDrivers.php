<?php

namespace App\Jobs;

use App\Models\ShuttleRequest;
use App\Services\PushNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendPushNotificationToDrivers implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public ShuttleRequest $request) {}

    public function handle(PushNotificationService $pushService): void
    {
        $this->request->load(['user', 'location']);

        $title = $this->request->priority === 1
            ? '🚨 Permintaan Urgent!'
            : '🚌 Permintaan Shuttle Baru';

        $body = "Dari: {$this->request->user->name} · Lokasi: {$this->request->location->name}";
        if ($this->request->passenger_count > 1) {
            $body .= " · {$this->request->passenger_count} penumpang";
        }

        $pushService->notifyAvailableDrivers($title, $body, [
            'request_id'   => $this->request->id,
            'request_code' => $this->request->request_code,
            'url'          => '/driver',
        ]);
    }
}
