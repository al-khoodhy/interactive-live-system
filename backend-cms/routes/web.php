<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;

// Membuka gerbang CORS khusus untuk folder animasi Lottie
Route::get('uploads/animations/{filename}', function ($filename) {
    $path = public_path('uploads/animations/' . $filename);

    if (!File::exists($path)) {
        abort(404);
    }

    $file = File::get($path);
    $type = File::mimeType($path);

    // Menyuntikkan Header CORS agar React bisa mengunduh JSON-nya
    $response = Response::make($file, 200);
    $response->header("Content-Type", $type);
    $response->header("Access-Control-Allow-Origin", "*"); // Mengizinkan semua domain
    $response->header("Access-Control-Allow-Methods", "GET, OPTIONS");

    return $response;
});