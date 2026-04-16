<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Models\ShuttleRequest;
use App\Services\ShuttleRequestService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function __construct(protected ShuttleRequestService $service) {}

    /**
     * Employee dashboard — main page.
     */
    public function index(): Response
    {
        $user = auth()->user();

        return Inertia::render('User/Index', [
            'locations'   => Location::where('is_active', true)->orderBy('name')->get(),
            'activeRequest' => ShuttleRequest::with(['location', 'driver'])
                ->where('user_id', $user->id)
                ->active()
                ->latest()
                ->first(),
            'recentRequests' => ShuttleRequest::with(['location', 'driver'])
                ->where('user_id', $user->id)
                ->whereNotIn('status', ['pending', 'accepted', 'on_the_way', 'arrived'])
                ->latest()
                ->limit(5)
                ->get(),
        ]);
    }

    /**
     * Create a new shuttle request.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'location_id'     => 'required|exists:locations,id',
            'destination'     => 'nullable|string|max:255',
            'priority'        => 'integer|in:0,1',
            'passenger_count' => 'integer|min:1|max:20',
            'notes'           => 'nullable|string|max:500',
        ]);

        $req = $this->service->create(auth()->user(), $validated);

        return back()->with('success', [
            'message'      => 'Permintaan shuttle berhasil dikirim!',
            'request_code' => $req->request_code,
        ]);
    }

    /**
     * Cancel a pending request.
     */
    public function cancel(ShuttleRequest $shuttleRequest, Request $request)
    {
        abort_if($shuttleRequest->user_id !== auth()->id(), 403);

        $reason = $request->input('reason', '');
        $this->service->cancel($shuttleRequest, $reason);

        return back()->with('success', ['message' => 'Permintaan dibatalkan.']);
    }

    /**
     * Subscribe to Web Push.
     */
    public function subscribePush(Request $request)
    {
        $request->validate(['subscription' => 'required|array']);
        auth()->user()->update(['push_subscription' => $request->subscription]);
        return response()->json(['ok' => true]);
    }
}
