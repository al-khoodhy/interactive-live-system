<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class SfxController extends Controller
{
    public function index()
    {
        $path = public_path('uploads/sfx');
        if (!File::exists($path)) File::makeDirectory($path, 0755, true);
        
        $files = File::files($path);
        $data = [];
        foreach ($files as $file) {
            $data[] = [
                'filename' => $file->getFilename(),
                'url' => url('uploads/sfx/' . $file->getFilename())
            ];
        }
        return response()->json(['data' => $data]);
    }

    public function store(Request $request)
    {
        $request->validate(['file' => 'required|mimes:mp3,wav|max:5120']); // Maks 5MB
        
        $file = $request->file('file');
        // Bersihkan nama file agar aman dari karakter aneh
        $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '_', $file->getClientOriginalName());
        
        $file->move(public_path('uploads/sfx'), $filename);
        return response()->json(['message' => 'SFX berhasil diunggah']);
    }

    public function destroy($filename)
    {
        $path = public_path('uploads/sfx/' . $filename);
        if (File::exists($path)) {
            File::delete($path);
            return response()->json(['message' => 'SFX berhasil dihapus']);
        }
        return response()->json(['message' => 'File tidak ditemukan'], 404);
    }
}