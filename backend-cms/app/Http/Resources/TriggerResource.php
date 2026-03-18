<?php

// app/Http/Resources/TriggerResource.php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TriggerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'keyword' => $this->keyword,
            'match_type' => $this->match_type,
            'priority' => $this->priority,
            // Mengambil relasi video jawaban acak beserta bobotnya (weight)
            'response_assets' => $this->whenLoaded('responseAssets', function () {
                return $this->responseAssets->map(function ($asset) {
                    return [
                        'asset_id' => $asset->id,
                        'file_path' => $asset->file_path,
                        'weight' => $asset->pivot->weight, // Diambil dari tabel pivot
                    ];
                });
            }),
        ];
    }
}