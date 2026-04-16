<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\DriverStatus;
use App\Models\Location;
use App\Models\ShuttleRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    /**
     * Admin dashboard.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/Index', [
            'stats'          => $this->getStats(),
            'activeRequests' => ShuttleRequest::with(['user', 'driver', 'location'])
                ->active()
                ->orderBy('priority', 'desc')
                ->orderBy('requested_at')
                ->get(),
            'drivers' => User::where('role', 'driver')
                ->where('is_active', true)
                ->with('driverStatus')
                ->get(),
            'locations' => Location::where('is_active', true)->get(),
        ]);
    }

    private function getStats(): array
    {
        $today = now()->startOfDay();
        return [
            'total_requests_today'     => ShuttleRequest::where('requested_at', '>=', $today)->count(),
            'pending_requests'         => ShuttleRequest::pending()->count(),
            'completed_today'          => ShuttleRequest::completed()->where('completed_at', '>=', $today)->count(),
            'available_drivers'        => DriverStatus::where('status', 'available')->count(),
            'avg_response_time'        => round(ShuttleRequest::where('requested_at', '>=', $today)
                ->whereNotNull('response_time_seconds')
                ->avg('response_time_seconds') ?? 0),
        ];
    }

    // ── Requests management ───────────────────────────────────────────────

    public function requests(Request $request): Response
    {
        $query = ShuttleRequest::with(['user', 'driver', 'location'])
            ->latest('requested_at');

        if ($request->status)   $query->where('status', $request->status);
        if ($request->date)     $query->whereDate('requested_at', $request->date);
        if ($request->driver)   $query->where('driver_id', $request->driver);

        return Inertia::render('Admin/Requests', [
            'requests'   => $query->paginate(20)->withQueryString(),
            'drivers'    => User::where('role', 'driver')->get(['id', 'name']),
            'filters'    => $request->only('status', 'date', 'driver'),
        ]);
    }

    // ── Users management ─────────────────────────────────────────────────

    public function users(): Response
    {
        return Inertia::render('Admin/Users', [
            'users' => User::orderBy('name')->paginate(20),
        ]);
    }

    public function storeUser(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:100',
            'employee_id' => 'nullable|string|max:50|unique:users',
            'email'       => 'required|email|unique:users',
            'password'    => 'required|min:6',
            'role'        => 'required|in:employee,driver,admin',
            'phone'       => 'nullable|string|max:20',
        ]);

        $validated['password'] = bcrypt($validated['password']);
        $user = User::create($validated);

        if ($user->isDriver()) {
            DriverStatus::create(['driver_id' => $user->id, 'status' => 'offline']);
        }

        return back()->with('success', ['message' => 'User berhasil ditambahkan.']);
    }

    public function updateUser(Request $request, User $user)
    {
        $validated = $request->validate([
            'name'      => 'string|max:100',
            'role'      => 'in:employee,driver,admin',
            'is_active' => 'boolean',
            'phone'     => 'nullable|string|max:20',
        ]);

        $user->update($validated);
        return back()->with('success', ['message' => 'User diperbarui.']);
    }

    // ── Locations management ──────────────────────────────────────────────

    public function locations(): Response
    {
        return Inertia::render('Admin/Locations', [
            'locations' => Location::orderBy('name')->get(),
        ]);
    }

    public function storeLocation(Request $request)
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:100',
            'name_en' => 'nullable|string|max:100',
            'code'    => 'required|string|max:20|unique:locations',
            'zone'    => 'nullable|string|max:50',
            'lat'     => 'nullable|numeric',
            'lng'     => 'nullable|numeric',
            'address' => 'nullable|string',
        ]);

        $validated['qr_token'] = bin2hex(random_bytes(16));
        Location::create($validated);
        return back()->with('success', ['message' => 'Lokasi ditambahkan.']);
    }

    public function updateLocation(Request $request, Location $location)
    {
        $validated = $request->validate([
            'name'      => 'string|max:100',
            'name_en'   => 'nullable|string|max:100',
            'zone'      => 'nullable|string|max:50',
            'lat'       => 'nullable|numeric',
            'lng'       => 'nullable|numeric',
            'is_active' => 'boolean',
        ]);
        $location->update($validated);
        return back()->with('success', ['message' => 'Lokasi diperbarui.']);
    }

    // ── Activity logs ─────────────────────────────────────────────────────

    public function logs(): Response
    {
        return Inertia::render('Admin/Logs', [
            'logs' => ActivityLog::with('user')->latest()->paginate(50),
        ]);
    }
}
