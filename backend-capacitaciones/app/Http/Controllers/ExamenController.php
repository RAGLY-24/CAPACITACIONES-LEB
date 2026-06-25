<?php

namespace App\Http\Controllers;

use App\Models\Modulo;
use App\Models\Pregunta;
use App\Models\Opcion;
use App\Models\ProgresoModulo;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ExamenController extends Controller
{
    // GET /modulos/{id}/examen  — devuelve preguntas SIN marcar cuál es correcta
    public function getExamen($moduloId)
    {
        $user = Auth::user();
        if (!$user instanceof User) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $modulo = Modulo::with(['preguntas.opciones'])->findOrFail($moduloId);

        if ($modulo->estado === 'Inactivo') {
            return response()->json(['message' => 'Este módulo no está disponible.'], 403);
        }

        if ($modulo->preguntas->isEmpty()) {
            return response()->json(['message' => 'Este módulo aún no tiene examen configurado.'], 404);
        }

        // Ocultar cuál es correcta para el empleado
        $preguntas = $modulo->preguntas->map(function ($pregunta) {
            return [
                'id'      => $pregunta->id,
                'texto'   => $pregunta->texto,
                'orden'   => $pregunta->orden,
                'opciones' => $pregunta->opciones->map(fn($op) => [
                    'id'    => $op->id,
                    'texto' => $op->texto,
                ]),
            ];
        });

        return response()->json([
            'modulo_id' => $modulo->id,
            'nombre'    => $modulo->nombre,
            'preguntas' => $preguntas,
        ], 200);
    }

    // POST /modulos/{id}/examen  — enviar respuestas y calificar
    public function submit(Request $request, $moduloId)
    {
        $user = Auth::user();
        if (!$user instanceof User) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $modulo = Modulo::with('preguntas.opciones')->findOrFail($moduloId);

        if ($modulo->estado === 'Inactivo') {
            return response()->json(['message' => 'Este módulo no está disponible.'], 403);
        }

        $request->validate([
            'respuestas'   => 'required|array',
            'respuestas.*' => 'required|integer|exists:opciones,id',
        ], [
            'respuestas.required' => 'Debes responder todas las preguntas antes de enviar.',
        ]);

        $totalPreguntas = $modulo->preguntas->count();
        if ($totalPreguntas === 0) {
            return response()->json(['message' => 'Este módulo no tiene examen.'], 422);
        }

        $respuestasEnviadas = $request->respuestas; // [pregunta_id => opcion_id]
        $aciertos = 0;
        $resultados = [];

        foreach ($modulo->preguntas as $pregunta) {
            $opcionSeleccionadaId = $respuestasEnviadas[$pregunta->id] ?? null;
            $opcionCorrecta       = $pregunta->opciones->firstWhere('es_correcta', true);
            $acertada             = $opcionSeleccionadaId && $opcionCorrecta
                                     && (int) $opcionSeleccionadaId === $opcionCorrecta->id;

            if ($acertada) $aciertos++;

            $resultados[] = [
                'pregunta_id'        => $pregunta->id,
                'texto'              => $pregunta->texto,
                'opcion_seleccionada'=> $opcionSeleccionadaId,
                'opcion_correcta_id' => $opcionCorrecta?->id,
                'opcion_correcta'    => $opcionCorrecta?->texto,
                'acertada'           => $acertada,
                'opciones'           => $pregunta->opciones->map(fn($op) => [
                    'id'          => $op->id,
                    'texto'       => $op->texto,
                    'es_correcta' => $op->es_correcta,
                ]),
            ];
        }

        $puntaje   = round(($aciertos / $totalPreguntas) * 100, 2);
        $aprobado  = $puntaje >= 70;
        $estadoNuevo = $aprobado ? 'completado' : 'reprobado';

        $progreso = ProgresoModulo::firstOrNew([
            'user_id'   => $user->id,
            'modulo_id' => $moduloId,
        ]);

        $progreso->estado      = $estadoNuevo;
        $progreso->puntaje     = $puntaje;
        $progreso->intentos    = ($progreso->intentos ?? 0) + 1;
        $progreso->completed_at = now();
        if (!$progreso->started_at) {
            $progreso->started_at = now();
        }
        $progreso->save();

        return response()->json([
            'puntaje'    => $puntaje,
            'aprobado'   => $aprobado,
            'estado'     => $estadoNuevo,
            'aciertos'   => $aciertos,
            'total'      => $totalPreguntas,
            'resultados' => $resultados,
        ], 200);
    }
}
