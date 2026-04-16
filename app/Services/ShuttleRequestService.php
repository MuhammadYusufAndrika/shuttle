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
            broadcast(new RequestCreated($req))->toOthers();

            // Push notification to available drivers (async)
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
                'status'                 => ShuttleRequest::STATUS_ACCEPTED,
                'accepted_at'            => now(),
                'response_time_seconds'  => $responseTimeSeconds,
            ]);

            // Update driver status to busy
            DriverStatus::updateOrCreate(
                ['driver_id' => $driver->id],
                ['status' => DriverStatus::STATUS_BUSY, 'last_seen' => now()]
            );

            ActivityLog::record('request.accepted', $req, ['driver_id' => $driver->id]);
            broadcast(new RequestStatusUpdated($req->fresh()))->toOthers();

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

            // Free up driver if completed
            if ($status === ShuttleRequest::STATUS_COMPLETED) {
                DriverStatus::where('driver_id', $driver->id)
                    ->update(['status' => DriverStatus::STATUS_AVAILABLE]);
            }

            ActivityLog::record("request.{$status}", $req);
            broadcast(new RequestStatusUpdated($req->fresh()))->toOthers();

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
        broadcast(new RequestStatusUpdated($req->fresh()))->toOthers();

        return $req;
    }
}
