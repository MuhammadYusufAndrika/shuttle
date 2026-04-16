<?php

namespace Database\Seeders;

use App\Models\DriverStatus;
use App\Models\Location;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Admin ─────────────────────────────────────────────────────────
        $admin = User::create([
            'name'        => 'Administrator',
            'employee_id' => 'ADM001',
            'email'       => 'admin@dahana.id',
            'password'    => Hash::make('admin123'),
            'role'        => 'admin',
            'is_active'   => true,
        ]);

        // ── Drivers ───────────────────────────────────────────────────────
        $drivers = [
            ['name' => 'Budi Santoso',   'employee_id' => 'DRV001', 'email' => 'budi@dahana.id',   'phone' => '08111234001'],
            ['name' => 'Ahmad Fauzi',    'employee_id' => 'DRV002', 'email' => 'ahmad@dahana.id',   'phone' => '08111234002'],
            ['name' => 'Sari Dewi',      'employee_id' => 'DRV003', 'email' => 'sari@dahana.id',    'phone' => '08111234003'],
        ];

        foreach ($drivers as $d) {
            $driver = User::create(array_merge($d, [
                'password'  => Hash::make('driver123'),
                'role'      => 'driver',
                'is_active' => true,
            ]));
            DriverStatus::create(['driver_id' => $driver->id, 'status' => 'offline']);
        }

        // ── Demo Employees ────────────────────────────────────────────────
        $employees = [
            ['name' => 'Eko Prasetyo',   'employee_id' => 'EMP001', 'email' => 'eko@dahana.id'],
            ['name' => 'Rini Kartika',   'employee_id' => 'EMP002', 'email' => 'rini@dahana.id'],
            ['name' => 'Wahyu Hidayat',  'employee_id' => 'EMP003', 'email' => 'wahyu@dahana.id'],
        ];

        foreach ($employees as $e) {
            User::create(array_merge($e, [
                'password'  => Hash::make('employee123'),
                'role'      => 'employee',
                'is_active' => true,
            ]));
        }

        // ── Locations (PT Dahana Ring 1) ──────────────────────────────────
        $locations = [
            ['name' => 'Gerbang Utama',         'name_en' => 'Main Gate',         'code' => 'GATE-A', 'zone' => 'Umum',   'lat' => -6.9175, 'lng' => 107.6191, 'address' => 'Jl. Raya Subang km 12'],
            ['name' => 'Area Produksi Ring 1',   'name_en' => 'Production Area R1','code' => 'RING-1', 'zone' => 'Ring 1', 'lat' => -6.9180, 'lng' => 107.6195],
            ['name' => 'Area Produksi Ring 2',   'name_en' => 'Production Area R2','code' => 'RING-2', 'zone' => 'Ring 2', 'lat' => -6.9185, 'lng' => 107.6200],
            ['name' => 'Kantor Pusat',           'name_en' => 'Head Office',       'code' => 'KANTOR', 'zone' => 'Kantor', 'lat' => -6.9170, 'lng' => 107.6188],
            ['name' => 'Gudang Bahan Baku',      'name_en' => 'Raw Material WH',   'code' => 'GUDANG', 'zone' => 'Ring 1', 'lat' => -6.9190, 'lng' => 107.6205],
            ['name' => 'Kantin Karyawan',        'name_en' => 'Staff Canteen',     'code' => 'KANTIN', 'zone' => 'Umum',   'lat' => -6.9172, 'lng' => 107.6192],
            ['name' => 'Klinik Perusahaan',      'name_en' => 'Company Clinic',    'code' => 'KLINIK', 'zone' => 'Umum',   'lat' => -6.9173, 'lng' => 107.6190],
            ['name' => 'Area Lab & QC',          'name_en' => 'Lab & QC Area',     'code' => 'LAB',    'zone' => 'Ring 1', 'lat' => -6.9182, 'lng' => 107.6198],
        ];

        foreach ($locations as $loc) {
            Location::create(array_merge($loc, [
                'qr_token'  => bin2hex(random_bytes(16)),
                'is_active' => true,
            ]));
        }
    }
}
