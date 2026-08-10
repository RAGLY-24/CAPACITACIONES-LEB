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

        // preguntas para poder sortear 5 distintas en cada intento.
        $banco = $modulo->preguntas->where('tipo', Pregunta::TIPO_OPCION_MULTIPLE)->values();
        if ($banco->count() < 15) {
            return response()->json([
                'message' => 'El banco de preguntas de este módulo debe tener al menos 15 preguntas de opción múltiple para generar el examen. Actualmente tiene ' . $banco->count() . '.',
            ], 422);
        }
        $feedback = $modulo->preguntas->where('tipo', Pregunta::TIPO_FEEDBACK)->values();

        $progreso = ProgresoModulo::firstOrCreate(
            ['user_id' => $user->id, 'modulo_id' => $moduloId],
            ['estado' => 'en_progreso', 'started_at' => now(), 'intentos' => 0]
        );

        if ($progreso->estado !== 'completado' && $progreso->intentos_ciclo >= 2) {
            return response()->json(['message' => 'Agotaste tus 2 intentos. Debes repasar el contenido (PDF o video) antes de volver a intentar el examen.'], 403);
        }

        // Si ya hay un intento en curso (el usuario solo recargó la página),
        // se reutilizan las mismas 5 preguntas. Si no, se sortea un set
        // nuevo, evitando repetir las que ya se mostraron en este ciclo.
        if (!$progreso->intento_pendiente || empty($progreso->preguntas_examen_actual)) {
            $usadas = $progreso->preguntas_usadas_ciclo ?? [];
            $disponibles = $banco->whereNotIn('id', $usadas)->values();
            $seleccion = $disponibles->count() >= 5
                ? $disponibles->shuffle()->take(5)
                : $disponibles->concat(
                    $banco->whereIn('id', $usadas)->shuffle()->take(5 - $disponibles->count())
                );
            $idsSeleccion = $seleccion->pluck('id')->values()->all();

            $progreso->preguntas_examen_actual = $idsSeleccion;
            $progreso->preguntas_usadas_ciclo  = array_values(array_unique(array_merge($usadas, $idsSeleccion)));
            $progreso->intento_pendiente = true;
            $progreso->save();
        } else {
            $idsSeleccion = $progreso->preguntas_examen_actual;
        }

        $aMostrar = $banco->whereIn('id', $idsSeleccion)->concat($feedback)->sortBy('orden')->values();

        // Ocultar cuál es correcta para el empleado, y barajar el orden de
        // las opciones en cada despliegue.
        $preguntas = $aMostrar->map(function ($pregunta) {
            return [
                'id'      => $pregunta->id,
                'texto'   => $pregunta->texto,
                'orden'   => $pregunta->orden,
                'tipo'    => $pregunta->tipo, // 'opcion_multiple' o 'feedback' (no se califica)
                'opciones' => $pregunta->opciones->shuffle()->values()->map(fn($op) => [
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

        $progreso = ProgresoModulo::firstOrNew([
            'user_id'   => $user->id,
            'modulo_id' => $moduloId,
        ]);

        if ($progreso->exists && $progreso->estado !== 'completado' && $progreso->intentos_ciclo >= 2) {
            return response()->json(['message' => 'Agotaste tus 2 intentos. Debes repasar el contenido (PDF o video) antes de volver a intentar el examen.'], 403);
        }

        if (!$progreso->intento_pendiente || empty($progreso->preguntas_examen_actual)) {
            return response()->json(['message' => 'Debes cargar el examen antes de enviarlo.'], 422);
        }

        // El intento solo cubre las preguntas de opción múltiple que se le
        // mostraron a este usuario (el set aleatorio elegido por getExamen),
        // más las de tipo "feedback" (siempre presentes, texto libre y
        // opcionales, ya que no se califican).
        $idsExamenActual = $progreso->preguntas_examen_actual;
        $feedbackIds = $modulo->preguntas->where('tipo', Pregunta::TIPO_FEEDBACK)->pluck('id')->all();
        $preguntasDelIntento = $modulo->preguntas->whereIn('id', array_merge($idsExamenActual, $feedbackIds));

        $rules = ['respuestas' => 'required|array'];
        foreach ($preguntasDelIntento as $pregunta) {
            $rules["respuestas.{$pregunta->id}"] = $pregunta->tipo === Pregunta::TIPO_FEEDBACK
                ? 'nullable|string|max:2000'
                : 'required|integer|exists:opciones,id';
        }

        $request->validate($rules, [
            'respuestas.required' => 'Debes responder todas las preguntas antes de enviar.',
        ]);

        $totalPreguntas = count($idsExamenActual);

        $respuestasEnviadas = $request->respuestas; // [pregunta_id => opcion_id]
        ['aciertos' => $aciertos, 'total' => $total, 'resultados' => $resultados] =
            $this->calificador->calificar($preguntasDelIntento, $respuestasEnviadas);

        $puntaje   = round(($aciertos / $totalPreguntas) * 100, 2);
        $aprobado  = $puntaje >= 70;
        $estadoNuevo = $aprobado ? 'completado' : 'reprobado';

        $progreso->estado       = $estadoNuevo;
        $progreso->puntaje      = $puntaje;
        $progreso->intentos     = ($progreso->intentos ?? 0) + 1;
        $progreso->intentos_ciclo = $aprobado ? 0 : ($progreso->intentos_ciclo ?? 0) + 1;
        $progreso->respuestas   = $respuestasEnviadas;
        $progreso->intento_pendiente = false;
        if ($aprobado) {
            $progreso->preguntas_usadas_ciclo = [];
        }
        $progreso->completed_at = now();
        if (!$progreso->started_at) {
            $progreso->started_at = now();
        }
        $progreso->save();

        return response()->json([
            'puntaje'          => $puntaje,
            'aprobado'         => $aprobado,
            'estado'           => $estadoNuevo,
            'aciertos'         => $aciertos,
            'total'            => $total,
            'resultados'       => $resultados,
            'intentos_restantes' => max(0, 2 - $progreso->intentos_ciclo),
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

        // Reconstruir exactamente el subconjunto de preguntas que se mostró
        // en el último intento. Si el registro es anterior a esta migración
        // (preguntas_examen_actual aún no existía), se recurre a las llaves
        // de `respuestas`, que antes cubrían siempre todas las preguntas del
        // módulo.
        $idsExamenActual = $progreso->preguntas_examen_actual ?? array_keys($progreso->respuestas);
        $feedbackIds = $modulo->preguntas->where('tipo', Pregunta::TIPO_FEEDBACK)->pluck('id')->all();
        $preguntasDelIntento = $modulo->preguntas->whereIn('id', array_merge($idsExamenActual, $feedbackIds));

        ['aciertos' => $aciertos, 'total' => $total, 'resultados' => $resultados] =
            $this->calificador->calificar($preguntasDelIntento, $progreso->respuestas);

        return response()->json([
            'puntaje'    => $progreso->puntaje,
            'aprobado'   => $progreso->estado === 'completado',
            'estado'     => $progreso->estado,
            'aciertos'   => $aciertos,
            'total'      => $total,
            'resultados' => $resultados,
            'intentos_restantes' => max(0, 2 - $progreso->intentos_ciclo),
        ], 200);
    }
}
