<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class AnimationController extends Controller
{
    public function index()
    {
        $path = public_path('uploads/animations');
        if (!File::exists($path)) File::makeDirectory($path, 0755, true);
        
        $files = File::files($path);
        $data = [];
        foreach ($files as $file) {
            $data[] = [
                'filename' => $file->getFilename(),
                'url' => url('uploads/animations/' . $file->getFilename())
            ];
        }
        return response()->json(['data' => $data]);
    }

    public function store(Request $request)
    {
        // Validasi khusus untuk file JSON Lottie
        $request->validate([
            'file' => 'required|file|max:5120' // Maksimal 5MB (JSON biasanya hanya ratusan KB)
        ]);
        
        $file = $request->file('file');
        
        // Memastikan ekstensinya adalah JSON
        if (strtolower($file->getClientOriginalExtension()) !== 'json') {
            return response()->json(['message' => 'Gagal: File animasi harus berformat .json (Lottie)'], 400);
        }

        $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '_', $file->getClientOriginalName());
        $file->move(public_path('uploads/animations'), $filename);
        
        return response()->json(['message' => 'Animasi Lottie berhasil diunggah']);
    }

    public function destroy($filename)
    {
        $path = public_path('uploads/animations/' . $filename);
        if (File::exists($path)) {
            File::delete($path);
            return response()->json(['message' => 'Animasi berhasil dihapus']);
        }
        return response()->json(['message' => 'File tidak ditemukan'], 404);
    }
}