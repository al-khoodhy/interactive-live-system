<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Asset;
use Illuminate\Support\Facades\File;

class AssetController extends Controller
{
    public function index() { 
        return response()->json(['data' => Asset::all()]); 
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimetypes:video/mp4,video/quicktime,video/webm',
            'category' => 'nullable|string'
        ]);

        try {
            $file = $request->file('file');
            $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '_', $file->getClientOriginalName());
            
            // 1. Simpan LANGSUNG ke folder tujuan akhir
            $destination = public_path('uploads/videos');
            if (!File::exists($destination)) {
                File::makeDirectory($destination, 0755, true);
            }
            $file->move($destination, $filename);

            // 2. Simpan URL final ke database 
            $asset = Asset::create([
                'file_path' => url('/uploads/videos/' . $filename),
                'category' => $request->category ?? 'general',
            ]);

            // 3. Lempar nama file ke FFmpeg untuk "Dicuci di tempat"
            \App\Jobs\OptimizeVideo::dispatch($asset->id, $filename);

            return response()->json([
                'message' => 'Video berhasil diunggah dan sedang dioptimasi di latar belakang.',
                'data' => $asset
            ]);
            
        } catch (\Exception $e) {
            return response()->json(['message' => 'Kesalahan internal', 'error' => $e->getMessage()], 500);
        }
    }
}