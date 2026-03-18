<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TriggerController extends Controller {

    // 1. TAMPILKAN DAFTAR MAPPING
    public function index($projectId) {
        $triggers = DB::table('triggers')
            ->where('project_id', $projectId)
            ->orderBy('created_at', 'desc')
            ->get();

        // Menggabungkan data video untuk setiap intensi
        foreach ($triggers as $trigger) {
            $trigger->assets = DB::table('trigger_response_assets')
                ->join('assets', 'trigger_response_assets.asset_id', '=', 'assets.id')
                ->where('trigger_id', $trigger->id)
                ->select('trigger_response_assets.*', 'assets.file_path')
                ->get();
        }

        return response()->json(['data' => $triggers]);
    }

    // 2. SIMPAN & EDIT (UPSERT) MAPPING
    public function storeGlobal(Request $request, $projectId) {
        $request->validate(['keyword' => 'required|string', 'response_assets' => 'required|array']);

        try {
            DB::beginTransaction();
            
            $oldTriggers = DB::table('triggers')->where('project_id', $projectId)->where('keyword', $request->keyword)->pluck('id');
            if($oldTriggers->count() > 0) {
                DB::table('trigger_response_assets')->whereIn('trigger_id', $oldTriggers)->delete();
                DB::table('triggers')->whereIn('id', $oldTriggers)->delete();
            }

            $triggerId = (string) Str::uuid();
            DB::table('triggers')->insert([
                'id' => $triggerId, 'project_id' => $projectId, 'keyword' => $request->keyword,
                'priority' => $request->priority ?? 10, 'created_at' => now(), 'updated_at' => now()
            ]);

            foreach($request->response_assets as $asset) {
                DB::table('trigger_response_assets')->insert([
                    'id' => (string) Str::uuid(), 'trigger_id' => $triggerId, 'asset_id' => $asset['asset_id'],
                    'weight' => $asset['weight'] ?? 1, 'created_at' => now(), 'updated_at' => now()
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Mapping berhasil disimpan/diperbarui.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // 3. HAPUS MAPPING
    public function destroy($projectId, $triggerId) {
        try {
            DB::beginTransaction();
            DB::table('trigger_response_assets')->where('trigger_id', $triggerId)->delete();
            DB::table('triggers')->where('id', $triggerId)->delete();
            DB::commit();
            return response()->json(['message' => 'Mapping berhasil dihapus permanen.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}