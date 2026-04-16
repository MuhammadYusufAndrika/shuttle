<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shuttle_requests', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        DB::statement('ALTER TABLE shuttle_requests MODIFY user_id BIGINT UNSIGNED NULL');

        Schema::table('shuttle_requests', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->string('requester_name', 100)->nullable()->after('user_id');
            $table->boolean('is_guest')->default(false)->after('requester_name');
        });
    }

    public function down(): void
    {
        Schema::table('shuttle_requests', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['requester_name', 'is_guest']);
        });

        DB::statement('UPDATE shuttle_requests SET user_id = (SELECT id FROM users ORDER BY id LIMIT 1) WHERE user_id IS NULL');
        DB::statement('ALTER TABLE shuttle_requests MODIFY user_id BIGINT UNSIGNED NOT NULL');

        Schema::table('shuttle_requests', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
