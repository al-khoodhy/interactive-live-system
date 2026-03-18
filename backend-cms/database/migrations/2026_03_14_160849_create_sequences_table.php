<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sequences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained()->cascadeOnDelete();
            // Jika asset dihapus, tolak (restrict) jika masih dipakai di sequence
            $table->foreignUuid('asset_id')->constrained('assets')->restrictOnDelete();
            $table->integer('order_index');
            $table->timestamps();
            
            // Konstrain Unik: Tidak boleh ada 2 video dengan urutan yang sama di 1 project
            $table->unique(['project_id', 'order_index']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('sequences');
    }
};