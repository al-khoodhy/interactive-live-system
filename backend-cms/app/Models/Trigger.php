<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Trigger extends Model
{
    use HasUuids;

    protected $guarded = [];

    /**
     * Relasi Balik ke Sesi Komentar
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(CommentSession::class, 'session_id');
    }

    /**
     * Relasi Many-to-Many (Pivot): Daftar video jawaban acak beserta bobotnya
     */
    public function responseAssets(): BelongsToMany
    {
        return $this->belongsToMany(Asset::class, 'trigger_response_assets', 'trigger_id', 'asset_id')
                    ->withPivot('weight');
    }
}
