<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasUuids; // Karena kita menggunakan UUID
    
    // Membuka kunci Mass Assignment agar Asset::create() berfungsi
    protected $guarded = []; 
}