<?php

// app/Http/Requests/StoreTriggerRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTriggerRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'keyword' => ['required', 'string', 'max:100'],
            'match_type' => ['required', 'in:exact,contains'],
            'priority' => ['integer', 'min:0'],
            
            // Validasi Array Aset Jawaban (Minimal harus ada 1 video)
            'response_assets' => ['required', 'array', 'min:1'],
            'response_assets.*.asset_id' => ['required', 'uuid', 'exists:assets,id'],
            'response_assets.*.weight' => ['required', 'integer', 'min:1', 'max:100'],
        ];
    }
}