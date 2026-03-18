<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('projects', function (Blueprint $table) {
            $table->uuid('id')->primary(); 
            $table->string('name');
            $table->string('template_mode')->default('digital'); // Menyimpan jenis template
            $table->json('flow_data')->nullable(); // MENYIMPAN STRUKTUR ALUR VISUAL (JSON)
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('projects'); }
};