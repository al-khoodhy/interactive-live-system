<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommentSession extends Model
{
    use HasUuids;

    protected $guarded = [];

    /**
     * Relasi Balik ke Sequence
     */
    public function sequence(): BelongsTo
    {
        return $this->belongsTo(Sequence::class);
    }

    /**
     * Relasi Many-to-Many (Pivot): Daftar video pose tunggu/looping
     */
    public function loopAssets(): BelongsToMany
    {
        return $this->belongsToMany(Asset::class, 'session_loop_assets', 'session_id', 'asset_id');
    }

    /**
     * Relasi One-to-Many: Daftar kata kunci (trigger) yang aktif di sesi ini
     */
    public function triggers(): HasMany
    {
        return $this->hasMany(Trigger::class, 'session_id');
    }
}