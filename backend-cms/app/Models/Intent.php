<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Intent extends Model
{
    use HasUuids;
    
    // Membuka kunci Mass Assignment untuk semua kolom
    protected $guarded = []; 
}