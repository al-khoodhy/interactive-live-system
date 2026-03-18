<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SequenceController;
use App\Http\Controllers\Api\TriggerController;
use App\Http\Controllers\Api\IntentController;
use App\Models\CommentSession;

Route::prefix('v1')->group(function () {
    
    // Manajemen Pustaka Video
    Route::apiResource('assets', AssetController::class);
    
    // Manajemen Project & Sequence
    Route::apiResource('projects', ProjectController::class);
    Route::put('projects/{project}/flow', [ProjectController::class, 'updateFlow']);
    Route::post('projects/{project}/activate', [ProjectController::class, 'activate']);
    Route::apiResource('projects.sequences', SequenceController::class)->shallow();
    Route::post('projects/{project}/triggers', [App\Http\Controllers\Api\TriggerController::class, 'storeGlobal']);
    Route::get('projects/{project}/triggers', [App\Http\Controllers\Api\TriggerController::class, 'index']);
    Route::delete('projects/{project}/triggers/{trigger}', [App\Http\Controllers\Api\TriggerController::class, 'destroy']);
    // RUTE BARU
    // Suplai Data Dropdown untuk CMS React
    Route::get('/sessions', function () {
        return response()->json([
            'data' => CommentSession::with(['sequence.project'])->get()
        ]);
    });

    Route::post('intents/import', [App\Http\Controllers\Api\IntentController::class, 'import']);
    // Manajemen Kamus AI (NLP Intents)
    Route::apiResource('intents', IntentController::class)->only(['index', 'store']);

    // Menyimpan Mapping Aturan AI ke Video
    Route::post('/sessions/{session}/triggers', [TriggerController::class, 'store']);
});