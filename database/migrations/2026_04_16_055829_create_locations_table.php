<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('name_en', 100)->nullable();
            $table->string('code', 20)->unique();
            $table->string('zone', 50)->nullable()->comment('Ring 1, Ring 2, etc');
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lng', 11, 8)->nullable();
            $table->string('address')->nullable();
            $table->string('qr_token', 64)->nullable()->unique()->comment('Token for QR code login');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
