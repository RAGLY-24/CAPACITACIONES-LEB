<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EnlaceRegistro extends Model
{
    protected $table = 'enlaces_registro';

    protected $fillable = [
        'token',
        'expires_at',
        'used_at',
        'created_by',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    public function creador()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function estaVigente(): bool
    {
        return !$this->used_at && $this->expires_at->isFuture();
    }
}
