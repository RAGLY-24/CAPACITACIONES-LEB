<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pregunta extends Model
{
    protected $fillable = ['modulo_id', 'texto', 'orden'];

    public function opciones()
    {
        return $this->hasMany(Opcion::class);
    }

    public function modulo()
    {
        return $this->belongsTo(Modulo::class);
    }
}
