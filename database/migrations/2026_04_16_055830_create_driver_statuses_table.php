<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('driver_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('offline')->comment('available|busy|offline');
            $table->decimal('current_lat', 10, 8)->nullable();
            $table->decimal('current_lng', 11, 8)->nullable();
            $table->string('current_location_name')->nullable();
            $table->timestamp('last_seen')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_statuses');
    }
};
