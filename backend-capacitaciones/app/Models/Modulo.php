<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Modulo extends Model
{
    protected $fillable = ['seccion_id', 'orden', 'nombre', 'descripcion', 'estado', 'file_path', 'file_type', 'imagen', 'created_by'];

    public function preguntas()
    {
        return $this->hasMany(Pregunta::class)->orderBy('orden');
    }

    public function seccion()
    {
        return $this->belongsTo(Seccion::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function progresos()
    {
        return $this->hasMany(ProgresoModulo::class);
    }
}
