<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('session_loop_assets', function (Blueprint $table) {
            $table->foreignUuid('session_id')->references('id')->on('comment_sessions')->cascadeOnDelete();
            $table->foreignUuid('asset_id')->constrained('assets')->restrictOnDelete();
            
            // Composite Primary Key
            $table->primary(['session_id', 'asset_id']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('session_loop_assets');
    }
};