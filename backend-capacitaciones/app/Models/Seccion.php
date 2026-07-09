<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Seccion extends Model
{
    protected $table = 'secciones'; // Laravel pluralizaría "Seccion" → "seccions" (incorrecto)

    protected $fillable = ['nombre', 'descripcion', 'orden', 'estado', 'created_by', 'seccion_requerida_id'];

    public function modulos()
    {
        return $this->hasMany(Modulo::class)->orderBy('orden');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function requiere()
    {
        return $this->belongsTo(Seccion::class, 'seccion_requerida_id');
    }

    public function dependientes()
    {
        return $this->hasMany(Seccion::class, 'seccion_requerida_id');
    }
}
