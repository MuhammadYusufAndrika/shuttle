<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Models\ShuttleRequest;
use App\Services\ShuttleRequestService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GuestBookingController extends Controller
{
    public function __construct(protected ShuttleRequestService $service) {}

    public function create(): Response
    {
        $guestRequestId = session('guest_request_id');

        $activeRequest = $guestRequestId
            ? ShuttleRequest::with(['location', 'driver'])
                ->where('id', $guestRequestId)
                ->whereIn('status', [
                    ShuttleRequest::STATUS_PENDING,
                    ShuttleRequest::STATUS_ACCEPTED,
                    ShuttleRequest::STATUS_ON_THE_WAY,
                    ShuttleRequest::STATUS_ARRIVED,
                ])
                ->first()
            : null;

        return Inertia::render('Guest/Book', [
            'locations' => Location::where('is_active', true)->orderBy('name')->get(),
            'activeRequest' => $activeRequest,
            'initialRequesterName' => session('guest_requester_name', ''),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'requester_name'  => 'required|string|max:100',
            'location_id'     => 'required|exists:locations,id',
            'destination'     => 'nullable|string|max:255',
            'priority'        => 'integer|in:0,1',
            'passenger_count' => 'integer|min:1|max:20',
            'notes'           => 'nullable|string|max:500',
        ]);

        $req = $this->service->createGuest($validated);

        session([
            'guest_request_id' => $req->id,
            'guest_requester_name' => $validated['requester_name'],
        ]);

        return back()->with('success', [
            'message' => 'Booking berhasil dikirim. Mohon tunggu driver.',
            'request_code' => $req->request_code,
        ]);
    }
}
