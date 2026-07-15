<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgresoModulo extends Model
{
    protected $table = 'progreso_modulos';

    protected $fillable = ['user_id', 'modulo_id', 'estado', 'puntaje', 'intentos', 'respuestas', 'started_at', 'completed_at'];

    protected $casts = [
        'respuestas' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function modulo()
    {
        return $this->belongsTo(Modulo::class);
    }
}
