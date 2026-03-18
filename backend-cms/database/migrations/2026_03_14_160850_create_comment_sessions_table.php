<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('comment_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sequence_id')->constrained()->cascadeOnDelete();
            $table->integer('max_quota')->default(1)->comment('Jumlah maksimal komentar per sesi');
            $table->timestamps();
            
            // Memastikan relasi One-to-One
            $table->unique('sequence_id');
        });
    }

    public function down(): void {
        Schema::dropIfExists('comment_sessions');
    }
};