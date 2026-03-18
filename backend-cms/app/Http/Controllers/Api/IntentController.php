<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Intent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; // INI ADALAH KUNCI YANG HILANG SEBELUMNYA

class IntentController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Intent::orderBy('created_at', 'desc')->get()]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'label' => 'required|string',
            'utterances' => 'required|array'
        ]);

        try {
            $intent = Intent::where('name', $request->name)->first();

            if ($intent) {
                $existingUtterances = is_string($intent->utterances) 
                    ? json_decode($intent->utterances, true) 
                    : ($intent->utterances ?? []);
                    
                if (!is_array($existingUtterances)) {
                    $existingUtterances = [];
                }

                $mergedUtterances = array_values(array_unique(array_merge($existingUtterances, $request->utterances)));

                $intent->update([
                    'label' => $request->label,
                    'utterances' => json_encode($mergedUtterances)
                ]);
                
                $message = 'Kalimat baru berhasil ditambahkan ke dalam memori Intensi yang sudah ada.';
            } else {
                $intent = Intent::create([
                    'name' => $request->name,
                    'label' => $request->label,
                    'utterances' => json_encode($request->utterances)
                ]);
                
                $message = 'Pola Intensi AI baru berhasil diciptakan.';
            }

            return response()->json(['data' => $intent, 'message' => $message]);
            
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal menyimpan ke database: ' . $e->getMessage()], 500);
        }
    }

    public function import(Request $request)
    {
        $request->validate([
            'intents' => 'required|array',
            'intents.*.name' => 'required|string',
            'intents.*.label' => 'required|string',
            'intents.*.utterances' => 'required|array'
        ]);

        try {
            DB::beginTransaction();

            foreach ($request->intents as $intentData) {
                $intent = Intent::where('name', $intentData['name'])->first();

                if ($intent) {
                    $existingUtterances = is_string($intent->utterances) 
                        ? json_decode($intent->utterances, true) : ($intent->utterances ?? []);
                    if (!is_array($existingUtterances)) $existingUtterances = [];

                    $mergedUtterances = array_values(array_unique(array_merge($existingUtterances, $intentData['utterances'])));

                    $intent->update([
                        'label' => $intentData['label'],
                        'utterances' => json_encode($mergedUtterances)
                    ]);
                } else {
                    Intent::create([
                        'name' => $intentData['name'],
                        'label' => $intentData['label'],
                        'utterances' => json_encode($intentData['utterances'])
                    ]);
                }
            }

            DB::commit();
            return response()->json(['message' => 'Ratusan Pola AI berhasil diimpor dan digabungkan!']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal mengimpor data: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $intent = Intent::findOrFail($id);
            $intent->delete();
            return response()->json(['message' => 'Intensi beserta seluruh kosakatanya berhasil dihapus.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal menghapus: ' . $e->getMessage()], 500);
        }
    }
}