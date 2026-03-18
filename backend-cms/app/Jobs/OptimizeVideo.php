<?php

namespace App\Jobs;

use App\Models\Asset;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use ProtoneMedia\LaravelFFMpeg\Support\FFMpeg;
use FFMpeg\Format\Video\X264;
use Illuminate\Support\Facades\File;

class OptimizeVideo implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $assetId;
    protected $fileName;

    public $timeout = 600; 

    public function __construct($assetId, $fileName)
    {
        $this->assetId = $assetId;
        $this->fileName = $fileName;
    }

    public function handle(): void
    {
        try {
            $format = new X264('aac', 'libx264');
            $format->setAdditionalParameters([
                '-movflags', 'faststart', 
                '-r', '30',               
                '-profile:v', 'main',     
                '-preset', 'fast',        
                '-crf', '28'              
            ]);

            // Jalur file asli dan file sementara (temp)
            $originalPath = 'uploads/videos/' . $this->fileName;
            $tempPath = 'uploads/videos/temp_' . $this->fileName;

            // 1. Proses dan simpan sebagai file temp terlebih dahulu
            FFMpeg::fromDisk('real_public')
                ->open($originalPath)
                ->export()
                ->toDisk('real_public')
                ->inFormat($format)
                ->save($tempPath);

            // 2. Musnahkan file mentah asli
            if (File::exists(public_path($originalPath))) {
                File::delete(public_path($originalPath));
            }

            // 3. Sulap nama file temp kembali menjadi nama file asli
            if (File::exists(public_path($tempPath))) {
                File::move(public_path($tempPath), public_path($originalPath));
            }

            // DATABASE TIDAK PERLU DIUBAH SAMA SEKALI! 
            // Karena URL di database masih mengarah ke nama file yang sama.

        } catch (\Exception $e) {
            \Log::error('FFmpeg Transcoding Gagal: ' . $e->getMessage());
        }
    }
}