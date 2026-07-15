<?php

namespace App\Http\Controllers;

use App\Models\Modulo;
use App\Models\Pregunta;
use App\Models\Opcion;
use App\Models\ProgresoModulo;
use App\Models\User;
use App\Services\ExamenCalificadorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ExamenController extends Controller
{
    public function __construct(private ExamenCalificadorService $calificador)
    {
    }
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
        if ($modulo->estaBloqueadoPara($user)) {
            $requerido = $modulo->moduloRequeridoPara();
            $mensaje = $requerido
                ? "Debes aprobar el examen de \"{$requerido->nombre}\" primero."
                : 'Debes aprobar el módulo requerido primero.';
            return response()->json(['message' => $mensaje], 403);
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
        if ($modulo->estaBloqueadoPara($user)) {
            $requerido = $modulo->moduloRequeridoPara();
            $mensaje = $requerido
                ? "Debes aprobar el examen de \"{$requerido->nombre}\" primero."
                : 'Debes aprobar el módulo requerido primero.';
            return response()->json(['message' => $mensaje], 403);
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
        ['aciertos' => $aciertos, 'total' => $total, 'resultados' => $resultados] =
            $this->calificador->calificar($modulo, $respuestasEnviadas);

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
        $progreso->respuestas  = $respuestasEnviadas;
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
            'total'      => $total,
            'resultados' => $resultados,
        ], 200);
    }

    // GET /modulos/{id}/examen/retroalimentacion — recupera lo que el usuario
    // respondió en su último intento, sin necesidad de volver a presentarlo.
    public function retroalimentacion($moduloId)
    {
        $user = Auth::user();
        if (!$user instanceof User) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $progreso = ProgresoModulo::where('user_id', $user->id)
            ->where('modulo_id', $moduloId)
            ->first();

        if (!$progreso || !$progreso->respuestas) {
            return response()->json(['message' => 'Aún no has contestado este examen.'], 404);
        }

        $modulo = Modulo::with('preguntas.opciones')->findOrFail($moduloId);
        ['aciertos' => $aciertos, 'total' => $total, 'resultados' => $resultados] =
            $this->calificador->calificar($modulo, $progreso->respuestas);

        return response()->json([
            'puntaje'    => $progreso->puntaje,
            'aprobado'   => $progreso->estado === 'completado',
            'estado'     => $progreso->estado,
            'aciertos'   => $aciertos,
            'total'      => $total,
            'resultados' => $resultados,
        ], 200);
    }
}
