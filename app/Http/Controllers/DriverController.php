<?php

namespace App\Http\Controllers;

use App\Events\DriverStatusChanged;
use App\Models\DriverStatus;
use App\Models\ShuttleRequest;
use App\Services\ShuttleRequestService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DriverController extends Controller
{
    public function __construct(protected ShuttleRequestService $service) {}

    /**
     * Driver board — shows queue.
     */
    public function index(): Response
    {
        $driver = auth()->user();
        $status = DriverStatus::firstOrCreate(
            ['driver_id' => $driver->id],
            ['status' => DriverStatus::STATUS_OFFLINE]
        );

        return Inertia::render('Driver/Index', [
            'driverStatus' => $status,
            'queue' => ShuttleRequest::with(['user', 'location'])
                ->pending()
                ->orderBy('priority', 'desc')
                ->orderBy('requested_at')
                ->get(),
            'activeRequest' => ShuttleRequest::with(['user', 'location'])
                ->where('driver_id', $driver->id)
                ->whereIn('status', ['accepted', 'on_the_way', 'arrived'])
                ->latest()
                ->first(),
        ]);
    }

    /**
     * Accept a pending request.
     */
    public function accept(ShuttleRequest $shuttleRequest)
    {
        abort_if(!$shuttleRequest->isPending(), 422, 'Request sudah diambil driver lain.');
        $req = $this->service->accept($shuttleRequest, auth()->user());
        return back()->with('success', ['message' => 'Request diterima!', 'request' => $req]);
    }

    /**
     * Update status (on_the_way, arrived, completed).
     */
    public function updateStatus(ShuttleRequest $shuttleRequest, Request $request)
    {
        $request->validate(['status' => 'required|in:on_the_way,arrived,completed']);
        $req = $this->service->updateStatus($shuttleRequest, $request->status, auth()->user());
        return back()->with('success', ['message' => 'Status diperbarui.', 'request' => $req]);
    }

    /**
     * Update driver availability status.
     */
    public function updateAvailability(Request $request)
    {
        $request->validate(['status' => 'required|in:available,offline']);
        $driver = auth()->user();

        $status = DriverStatus::updateOrCreate(
            ['driver_id' => $driver->id],
            ['status' => $request->status, 'last_seen' => now()]
        );

        broadcast(new DriverStatusChanged($driver, $status))->toOthers();

        return back()->with('success', ['message' => 'Status diperbarui.']);
    }

    /**
     * Update GPS location.
     */
    public function updateLocation(Request $request)
    {
        $request->validate([
            'lat'           => 'required|numeric',
            'lng'           => 'required|numeric',
            'location_name' => 'nullable|string',
        ]);

        $driver = auth()->user();
        $status = DriverStatus::updateOrCreate(
            ['driver_id' => $driver->id],
            [
                'current_lat'          => $request->lat,
                'current_lng'          => $request->lng,
                'current_location_name'=> $request->location_name,
                'last_seen'            => now(),
            ]
        );

        broadcast(new DriverStatusChanged($driver, $status))->toOthers();

        return response()->json(['ok' => true]);
    }
}
