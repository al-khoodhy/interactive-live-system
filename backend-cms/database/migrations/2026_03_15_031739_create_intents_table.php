<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('intents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique(); // Kode Intensi
            $table->string('label'); // Nama Tampilan
            $table->json('utterances'); // INI ADALAH KOLOM YANG HILANG (Tempat menyimpan array kalimat)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('intents');
    }
};