<?php

namespace App\Services;

use App\Events\RequestCreated;
use App\Events\RequestStatusUpdated;
use App\Jobs\SendPushNotificationToDrivers;
use App\Models\ActivityLog;
use App\Models\DriverStatus;
use App\Models\ShuttleRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class ShuttleRequestService
{
    /**
     * Create a new shuttle request for an employee.
     */
    public function create(User $user, array $data): ShuttleRequest
    {
        return DB::transaction(function () use ($user, $data) {
            $req = ShuttleRequest::create([
                'user_id'         => $user->id,
                'requester_name'  => $user->name,
                'is_guest'        => false,
                'location_id'     => $data['location_id'],
                'destination'     => $data['destination'] ?? null,
                'priority'        => $data['priority'] ?? 0,
                'passenger_count' => $data['passenger_count'] ?? 1,
                'notes'           => $data['notes'] ?? null,
                'requested_at'    => now(),
                'status'          => ShuttleRequest::STATUS_PENDING,
            ]);

            ActivityLog::record('request.created', $req);

            // Broadcast to admin + driver boards
            $this->broadcastToOthers(new RequestCreated($req));

            // Push notification to available drivers (async)
            SendPushNotificationToDrivers::dispatch($req);

            return $req;
        });
    }

    /**
     * Create a new shuttle request from a guest (no login required).
     */
    public function createGuest(array $data): ShuttleRequest
    {
        return DB::transaction(function () use ($data) {
            $req = ShuttleRequest::create([
                'user_id'         => null,
                'requester_name'  => $data['requester_name'],
                'is_guest'        => true,
                'location_id'     => $data['location_id'],
                'destination'     => $data['destination'] ?? null,
                'priority'        => $data['priority'] ?? 0,
                'passenger_count' => $data['passenger_count'] ?? 1,
                'notes'           => $data['notes'] ?? null,
                'requested_at'    => now(),
                'status'          => ShuttleRequest::STATUS_PENDING,
            ]);

            ActivityLog::record('request.created.guest', $req, [
                'requester_name' => $req->requester_name,
            ]);

            $this->broadcastToOthers(new RequestCreated($req));

            SendPushNotificationToDrivers::dispatch($req);

            return $req;
        });
    }

    /**
     * Driver accepts a request.
     */
    public function accept(ShuttleRequest $req, User $driver): ShuttleRequest
    {
        return DB::transaction(function () use ($req, $driver) {
            $requestedAt = $req->requested_at;
            $responseTimeSeconds = $requestedAt
                ? max(0, (int) $requestedAt->diffInSeconds(now(), true))
                : 0;

            $req->update([
                'driver_id'              => $driver->id,
                'status'                 => ShuttleRequest::STATUS_ON_THE_WAY,
                'accepted_at'            => now(),
                'on_the_way_at'          => now(),
                'response_time_seconds'  => $responseTimeSeconds,
            ]);

            // Update driver status to busy
            DriverStatus::updateOrCreate(
                ['driver_id' => $driver->id],
                ['status' => DriverStatus::STATUS_BUSY, 'last_seen' => now()]
            );

            ActivityLog::record('request.accepted', $req, ['driver_id' => $driver->id]);
            ActivityLog::record('request.on_the_way', $req);
            $this->broadcastToOthers(new RequestStatusUpdated($req->fresh()));

            return $req;
        });
    }

    /**
     * Update request status (on_the_way, arrived, completed).
     */
    public function updateStatus(ShuttleRequest $req, string $status, User $driver): ShuttleRequest
    {
        $allowedTransitions = [
            ShuttleRequest::STATUS_ACCEPTED   => ShuttleRequest::STATUS_ON_THE_WAY,
            ShuttleRequest::STATUS_ON_THE_WAY => ShuttleRequest::STATUS_ARRIVED,
            ShuttleRequest::STATUS_ARRIVED    => ShuttleRequest::STATUS_COMPLETED,
        ];

        abort_if(!isset($allowedTransitions[$req->status]) || $allowedTransitions[$req->status] !== $status, 422, 'Invalid status transition');

        return DB::transaction(function () use ($req, $status, $driver) {
            $timestampField = match ($status) {
                ShuttleRequest::STATUS_ON_THE_WAY => 'on_the_way_at',
                ShuttleRequest::STATUS_ARRIVED    => 'arrived_at',
                ShuttleRequest::STATUS_COMPLETED  => 'completed_at',
            };

            $req->update(['status' => $status, $timestampField => now()]);

            // Free up driver only if no other active requests remain.
            if ($status === ShuttleRequest::STATUS_COMPLETED) {
                $hasOtherActiveRequests = ShuttleRequest::where('driver_id', $driver->id)
                    ->where('id', '!=', $req->id)
                    ->whereIn('status', [
                        ShuttleRequest::STATUS_ACCEPTED,
                        ShuttleRequest::STATUS_ON_THE_WAY,
                        ShuttleRequest::STATUS_ARRIVED,
                    ])
                    ->exists();

                DriverStatus::where('driver_id', $driver->id)
                    ->update([
                        'status' => $hasOtherActiveRequests
                            ? DriverStatus::STATUS_BUSY
                            : DriverStatus::STATUS_AVAILABLE,
                    ]);
            }

            ActivityLog::record("request.{$status}", $req);
            $this->broadcastToOthers(new RequestStatusUpdated($req->fresh()));

            return $req;
        });
    }

    /**
     * Cancel a request.
     */
    public function cancel(ShuttleRequest $req, string $reason = ''): ShuttleRequest
    {
        abort_if(!$req->isPending(), 422, 'Only pending requests can be cancelled');

        $req->update([
            'status'       => ShuttleRequest::STATUS_CANCELLED,
            'cancelled_at' => now(),
            'cancel_reason'=> $reason,
        ]);

        ActivityLog::record('request.cancelled', $req, ['reason' => $reason]);
        $this->broadcastToOthers(new RequestStatusUpdated($req->fresh()));

        return $req;
    }

    private function broadcastToOthers(object $event): void
    {
        try {
            broadcast($event)->toOthers();
        } catch (Throwable $e) {
            Log::warning('Broadcast failed in ShuttleRequestService', [
                'event' => $event::class,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
