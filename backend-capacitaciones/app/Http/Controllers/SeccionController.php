<?php

namespace App\Http\Controllers;

use App\Models\Seccion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SeccionController extends Controller
{
    private function esAdmin(): bool
    {
        $user = Auth::user();
        return $user instanceof User && ($user->puesto?->nombre === 'SistemasAdmin' || $user->hasPermission('edit_trainings'));
    }

    // GET /secciones — lista todas las secciones con sus módulos
    public function index()
    {
        $user = Auth::user();
        if (!$user instanceof User) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        if ($this->esAdmin()) {
            $secciones = Seccion::with(['modulos' => fn($q) => $q->withCount('preguntas'), 'requiere'])
                ->orderBy('orden')
                ->get();
        } else {
            $secciones = Seccion::where('estado', 'Activo')
                ->with(['modulos' => fn($q) => $q->where('estado', 'Activo')->withCount('preguntas')->orderBy('orden'), 'requiere'])
                ->orderBy('orden')
                ->get();
        }

        return response()->json($secciones, 200);
    }

    // POST /secciones
    public function store(Request $request)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $request->validate([
            'nombre'      => 'required|string|min:3|max:150|unique:secciones,nombre',
            'descripcion' => 'nullable|string|max:1000',
            'estado'      => 'required|in:Activo,Inactivo',
            'seccion_requerida_id' => 'nullable|exists:secciones,id',
        ], [
            'nombre.unique' => 'Ya existe una sección con ese nombre.',
        ]);

        $orden = Seccion::max('orden') + 1;

        $seccion = Seccion::create([
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
            'orden'       => $orden,
            'estado'      => $request->estado,
            'seccion_requerida_id' => $request->seccion_requerida_id,
            'created_by'  => Auth::id(),
        ]);

        return response()->json(['message' => 'Sección creada.', 'seccion' => $seccion], 201);
    }

    // PUT /secciones/{id}
    public function update(Request $request, int $id)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $seccion = Seccion::findOrFail($id);

        $request->validate([
            'nombre'      => "required|string|min:3|max:150|unique:secciones,nombre,{$id}",
            'descripcion' => 'nullable|string|max:1000',
            'estado'      => 'required|in:Activo,Inactivo',
            'seccion_requerida_id' => 'nullable|exists:secciones,id',
        ], [
            'nombre.unique' => 'Ya existe una sección con ese nombre.',
        ]);

        $seccion->update([
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
            'estado'      => $request->estado,
            'seccion_requerida_id' => $request->seccion_requerida_id,
        ]);

        return response()->json(['message' => 'Sección actualizada.', 'seccion' => $seccion], 200);
    }

    // DELETE /secciones/{id}
    public function destroy(int $id)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $seccion = Seccion::findOrFail($id);

        if ($seccion->modulos()->count() > 0) {
            return response()->json([
                'message' => 'No puedes eliminar una sección que tiene módulos. Elimina primero los módulos o muévelos a otra sección.'
            ], 422);
        }

        $seccion->delete();

        return response()->json(['message' => 'Sección eliminada.'], 200);
    }
}
