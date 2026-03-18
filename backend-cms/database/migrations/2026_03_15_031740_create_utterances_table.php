<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('utterances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('intent_id')->constrained()->cascadeOnDelete();
            $table->string('text')->comment('Variasi pertanyaan penonton');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('utterances'); }
};