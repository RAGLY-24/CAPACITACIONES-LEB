<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pregunta extends Model
{
    const TIPO_OPCION_MULTIPLE = 'opcion_multiple';
    const TIPO_FEEDBACK = 'feedback';

    protected $fillable = ['modulo_id', 'texto', 'orden', 'tipo'];

    public function opciones()
    {
        return $this->hasMany(Opcion::class);
    }

    public function modulo()
    {
        return $this->belongsTo(Modulo::class);
    }
}
