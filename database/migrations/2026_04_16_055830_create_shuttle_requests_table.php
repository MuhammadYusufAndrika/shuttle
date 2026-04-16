<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shuttle_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_code', 20)->unique()->comment('SR-YYYYMMDD-XXXX');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('location_id')->constrained('locations');
            $table->string('destination')->nullable();
            $table->foreignId('driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending')
                ->comment('pending|accepted|on_the_way|arrived|completed|cancelled');
            $table->tinyInteger('priority')->default(0)->comment('0=normal, 1=urgent');
            $table->tinyInteger('passenger_count')->default(1);
            $table->text('notes')->nullable();
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('on_the_way_at')->nullable();
            $table->timestamp('arrived_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancel_reason')->nullable();
            $table->unsignedInteger('response_time_seconds')->nullable()->comment('SLA tracking');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shuttle_requests');
    }
};
