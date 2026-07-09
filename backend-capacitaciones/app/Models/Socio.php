<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Socio extends Model
{
    protected $table = 'socios';

    protected $fillable = ['nombre', 'telefono', 'correo', 'empresa', 'estado', 'descripcion', 'created_by'];

    public function usuarios()
    {
        return $this->hasMany(User::class, 'socio_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
