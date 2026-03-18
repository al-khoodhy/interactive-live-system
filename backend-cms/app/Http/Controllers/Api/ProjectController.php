<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index() {
        return response()->json(['data' => Project::orderBy('created_at', 'desc')->get()]);
    }

    public function store(Request $request) {
        $request->validate(['name' => 'required|string|max:255']);
        try {
            $project = Project::create([
                'name' => $request->name,
                'flow_data' => json_encode([]) // Default kosong
            ]);
            return response()->json(['data' => $project, 'message' => 'Profil berhasil dibuat.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal membuat profil: ' . $e->getMessage()], 500);
        }
    }

    // FUNGSI BARU: Menyimpan Alur Visual dari React (JSON)
    public function updateFlow(Request $request, $id) {
        try {
            $project = Project::findOrFail($id);
            $project->update([
                'template_mode' => $request->templateMode,
                'flow_data' => json_encode($request->flowData)
            ]);
            return response()->json(['message' => 'Alur Visual berhasil disimpan permanen ke Database.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal menyimpan alur: ' . $e->getMessage()], 500);
        }
    }
}