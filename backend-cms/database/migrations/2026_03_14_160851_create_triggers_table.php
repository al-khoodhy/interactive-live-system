<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('triggers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id'); // Terhubung ke Profil/Project
            $table->string('keyword'); // Intensi AI
            $table->string('match_type')->default('contains');
            $table->integer('priority')->default(10);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('triggers'); }
};