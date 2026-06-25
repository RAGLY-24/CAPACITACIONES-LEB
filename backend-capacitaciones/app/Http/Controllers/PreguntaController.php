<?php

namespace App\Http\Controllers;

use App\Models\Modulo;
use App\Models\Pregunta;
use App\Models\Opcion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PreguntaController extends Controller
{
    private function esAdmin(): bool
    {
        $user = Auth::user();
        return $user instanceof User && ($user->puesto?->nombre === 'SistemasAdmin' || $user->hasPermission('edit_trainings'));
    }

    // GET /modulos/{id}/preguntas  (admin: con respuestas correctas marcadas)
    public function index($moduloId)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $modulo = Modulo::findOrFail($moduloId);
        $preguntas = $modulo->preguntas()->with('opciones')->get();

        return response()->json($preguntas, 200);
    }

    // POST /modulos/{id}/preguntas  — crea pregunta con sus opciones
    public function store(Request $request, $moduloId)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        Modulo::findOrFail($moduloId);

        $request->validate([
            'texto'                   => 'required|string|max:500',
            'opciones'                => 'required|array|min:2|max:5',
            'opciones.*.texto'        => 'required|string|max:300',
            'opciones.*.es_correcta'  => 'required|boolean',
        ], [
            'texto.required'              => 'El texto de la pregunta es obligatorio.',
            'opciones.required'           => 'Debes agregar al menos 2 opciones.',
            'opciones.min'                => 'Cada pregunta debe tener al menos 2 opciones.',
            'opciones.max'                => 'Una pregunta puede tener como máximo 5 opciones.',
            'opciones.*.texto.required'   => 'El texto de cada opción es obligatorio.',
        ]);

        $correctas = collect($request->opciones)->where('es_correcta', true)->count();
        if ($correctas !== 1) {
            return response()->json([
                'message' => 'Cada pregunta debe tener exactamente una opción correcta.'
            ], 422);
        }

        $orden = Pregunta::where('modulo_id', $moduloId)->max('orden') + 1;

        $pregunta = Pregunta::create([
            'modulo_id' => $moduloId,
            'texto'     => $request->texto,
            'orden'     => $orden,
        ]);

        foreach ($request->opciones as $op) {
            Opcion::create([
                'pregunta_id' => $pregunta->id,
                'texto'       => $op['texto'],
                'es_correcta' => $op['es_correcta'],
            ]);
        }

        return response()->json([
            'message'  => 'Pregunta agregada.',
            'pregunta' => $pregunta->load('opciones'),
        ], 201);
    }

    // PUT /preguntas/{id}  — actualiza texto y reemplaza opciones
    public function update(Request $request, $id)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $pregunta = Pregunta::findOrFail($id);

        $request->validate([
            'texto'                   => 'required|string|max:500',
            'opciones'                => 'required|array|min:2|max:5',
            'opciones.*.texto'        => 'required|string|max:300',
            'opciones.*.es_correcta'  => 'required|boolean',
        ]);

        $correctas = collect($request->opciones)->where('es_correcta', true)->count();
        if ($correctas !== 1) {
            return response()->json([
                'message' => 'Cada pregunta debe tener exactamente una opción correcta.'
            ], 422);
        }

        $pregunta->update(['texto' => $request->texto]);

        // Reemplazar opciones
        $pregunta->opciones()->delete();
        foreach ($request->opciones as $op) {
            Opcion::create([
                'pregunta_id' => $pregunta->id,
                'texto'       => $op['texto'],
                'es_correcta' => $op['es_correcta'],
            ]);
        }

        return response()->json([
            'message'  => 'Pregunta actualizada.',
            'pregunta' => $pregunta->load('opciones'),
        ], 200);
    }

    // DELETE /preguntas/{id}
    public function destroy($id)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $pregunta = Pregunta::findOrFail($id);
        $pregunta->delete();

        return response()->json(['message' => 'Pregunta eliminada.'], 200);
    }
}
