<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notificacion extends Model
{
    protected $table = 'notificaciones'; // Laravel pluralizaría "Notificacion" → "notificacions" (incorrecto)

    protected $fillable = ['user_id', 'tipo', 'titulo', 'mensaje', 'seccion_id', 'modulo_id', 'read_at'];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function seccion()
    {
        return $this->belongsTo(Seccion::class);
    }

    public function modulo()
    {
        return $this->belongsTo(Modulo::class);
    }
}
