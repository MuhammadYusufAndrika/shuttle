<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Root redirect based on role
Route::get('/', function () {
    if (!auth()->check()) return redirect()->route('login');
    return match (auth()->user()->role) {
        'admin'  => redirect()->route('admin.index'),
        'driver' => redirect()->route('driver.index'),
        default  => redirect()->route('employee.index'),
    };
})->name('home');

// ── Employee routes ────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:employee,admin'])->prefix('employee')->name('employee.')->group(function () {
    Route::get('/', [EmployeeController::class, 'index'])->name('index');
    Route::post('/requests', [EmployeeController::class, 'store'])->name('requests.store');
    Route::delete('/requests/{shuttleRequest}', [EmployeeController::class, 'cancel'])->name('requests.cancel');
    Route::post('/push-subscribe', [EmployeeController::class, 'subscribePush'])->name('push.subscribe');
});

// ── Driver routes ──────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:driver'])->prefix('driver')->name('driver.')->group(function () {
    Route::get('/', [DriverController::class, 'index'])->name('index');
    Route::post('/requests/{shuttleRequest}/accept', [DriverController::class, 'accept'])->name('requests.accept');
    Route::patch('/requests/{shuttleRequest}/status', [DriverController::class, 'updateStatus'])->name('requests.status');
    Route::patch('/availability', [DriverController::class, 'updateAvailability'])->name('availability');
    Route::post('/location', [DriverController::class, 'updateLocation'])->name('location');
    Route::post('/push-subscribe', [EmployeeController::class, 'subscribePush'])->name('push.subscribe');
});

// ── Admin routes ───────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'index'])->name('index');
    Route::get('/requests', [AdminController::class, 'requests'])->name('requests');
    Route::get('/users', [AdminController::class, 'users'])->name('users');
    Route::post('/users', [AdminController::class, 'storeUser'])->name('users.store');
    Route::patch('/users/{user}', [AdminController::class, 'updateUser'])->name('users.update');
    Route::get('/locations', [AdminController::class, 'locations'])->name('locations');
    Route::post('/locations', [AdminController::class, 'storeLocation'])->name('locations.store');
    Route::patch('/locations/{location}', [AdminController::class, 'updateLocation'])->name('locations.update');
    Route::get('/logs', [AdminController::class, 'logs'])->name('logs');
});

// ── Profile (Breeze default) ────────────────────────────────────────────────
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
