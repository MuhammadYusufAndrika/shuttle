<?php

namespace App\Services;

use App\Models\User;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class PushNotificationService
{
    protected WebPush $webPush;

    public function __construct()
    {
        $auth = [
            'VAPID' => [
                'subject'    => config('app.url'),
                'publicKey'  => config('app.vapid_public_key'),
                'privateKey' => config('app.vapid_private_key'),
            ],
        ];
        $this->webPush = new WebPush($auth);
    }

    /**
     * Send push notification to a single user.
     */
    public function sendToUser(User $user, string $title, string $body, array $data = []): bool
    {
        if (empty($user->push_subscription)) {
            return false;
        }

        try {
            $subscription = Subscription::create($user->push_subscription);
            $payload = json_encode([
                'title' => $title,
                'body'  => $body,
                'data'  => $data,
                'icon'  => '/icons/icon-192.png',
                'badge' => '/icons/badge-72.png',
            ]);

            $this->webPush->queueNotification($subscription, $payload);

            foreach ($this->webPush->flush() as $report) {
                if (!$report->isSuccess()) {
                    \Log::warning("Push notification failed for user {$user->id}: " . $report->getReason());
                }
            }
            return true;
        } catch (\Throwable $e) {
            \Log::error("Push notification error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send push notification to all available drivers.
     */
    public function notifyAvailableDrivers(string $title, string $body, array $data = []): void
    {
        $drivers = User::where('role', 'driver')
            ->where('is_active', true)
            ->whereNotNull('push_subscription')
            ->whereHas('driverStatus', fn($q) => $q->where('status', 'available'))
            ->get();

        foreach ($drivers as $driver) {
            $this->sendToUser($driver, $title, $body, $data);
        }
    }
}
