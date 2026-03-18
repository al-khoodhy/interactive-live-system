<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Sequence extends Model
{
    use HasUuids;

    protected $guarded = [];

    /**
     * Relasi Balik: Sequence ini milik Project apa?
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Relasi ke Asset: Video materi mana yang diputar?
     */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    /**
     * Relasi One-to-One: Sequence ini punya sesi tanya jawab atau tidak?
     */
    public function commentSession(): HasOne
    {
        return $this->hasOne(CommentSession::class);
    }
}