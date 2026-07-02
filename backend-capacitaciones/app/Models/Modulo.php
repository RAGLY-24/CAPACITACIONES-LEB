<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Modulo extends Model
{
    protected $fillable = ['seccion_id', 'orden', 'nombre', 'descripcion', 'estado', 'file_path', 'file_type', 'imagen', 'presentacion_json', 'created_by'];

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

    // Todos los módulos activos, en el orden en que deben cursarse (sección.orden, luego módulo.orden).
    public static function ordenGlobal()
    {
        return self::where('estado', 'Activo')
            ->whereHas('seccion', fn($q) => $q->where('estado', 'Activo'))
            ->with('seccion')
            ->get()
            ->sortBy(fn($m) => sprintf('%05d-%05d', $m->seccion->orden, $m->orden))
            ->values();
    }

    public function moduloAnterior(): ?self
    {
        $orden = self::ordenGlobal();
        $idx = $orden->search(fn($m) => $m->id === $this->id);
        if ($idx === false || $idx === 0) {
            return null;
        }
        return $orden[$idx - 1];
    }

    // Un módulo está bloqueado si el anterior en el orden del curso tiene examen
    // y el usuario aún no lo ha aprobado (calificación mínima 70%).
    public function estaBloqueadoPara(User $user): bool
    {
        $anterior = $this->moduloAnterior();
        if (!$anterior) {
            return false;
        }

        if ($anterior->preguntas()->count() === 0) {
            return false;
        }

        $progreso = $anterior->progresos()->where('user_id', $user->id)->first();

        return !($progreso && $progreso->estado === 'completado');
    }
}
