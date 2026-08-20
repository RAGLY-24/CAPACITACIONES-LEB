<?php

namespace App\Services;

use App\Models\Notificacion;
use App\Models\User;

// Centraliza el "fan-out" de notificaciones de contenido: crea una fila por
// cada usuario activo (menos el autor del cambio) en un solo insert masivo,
// ya que el proyecto no tiene un worker de colas garantizado en producción
// para hacerlo de forma asíncrona.
class NotificacionService
{
    public function notificarContenido(
        string $tipo,
        string $titulo,
        ?string $mensaje,
        ?int $seccionId,
        ?int $moduloId,
        int $actorId
    ): void {
        $destinatarios = User::where('estado', 'Activo')
            ->where('id', '!=', $actorId)
            ->pluck('id');

        if ($destinatarios->isEmpty()) return;

        $ahora = now();

        $filas = $destinatarios->map(fn ($userId) => [
            'user_id'    => $userId,
            'tipo'       => $tipo,
            'titulo'     => $titulo,
            'mensaje'    => $mensaje,
            'seccion_id' => $seccionId,
            'modulo_id'  => $moduloId,
            'read_at'    => null,
            'created_at' => $ahora,
            'updated_at' => $ahora,
        ])->all();

        foreach (array_chunk($filas, 500) as $lote) {
            Notificacion::insert($lote);
        }
    }

    public function eliminarPorSeccion(int $seccionId): void
    {
        Notificacion::where('seccion_id', $seccionId)->delete();
    }

    public function eliminarPorModulo(int $moduloId): void
    {
        Notificacion::where('modulo_id', $moduloId)->delete();
    }
}
