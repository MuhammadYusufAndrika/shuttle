<?php

use App\Models\ShuttleRequest;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

// Admin can see all requests channel
Broadcast::channel('requests', function ($user) {
    return in_array($user->role, ['admin', 'driver']);
});

// User can listen to their own request updates
Broadcast::channel('request.{requestId}', function ($user, $requestId) {
    $request = ShuttleRequest::find($requestId);
    return $request && (
        $request->user_id === $user->id ||
        $request->driver_id === $user->id ||
        $user->isAdmin()
    );
});

// Driver-specific private channel
Broadcast::channel('driver.{driverId}', function ($user, $driverId) {
    return (int) $user->id === (int) $driverId || $user->isAdmin();
});
