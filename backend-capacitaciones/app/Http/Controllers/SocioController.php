<?php

namespace App\Http\Controllers;

use App\Models\Socio;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SocioController extends Controller
{
    private function esAdmin(): bool
    {
        $user = Auth::user();
        return $user instanceof User && ($user->puesto?->nombre === 'SistemasAdmin' || $user->hasPermission('create_users'));
    }

    public function index()
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $socios = Socio::withCount('usuarios')
            ->with(['usuarios' => fn($q) => $q->select('id', 'name', 'lastname', 'socio_id', 'puesto_id')->with('puesto:id,nombre')])
            ->orderBy('nombre')
            ->get();

        return response()->json($socios, 200);
    }

    public function store(Request $request)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $request->validate([
            'nombre' => 'required|string|min:3|max:150',
            'telefono' => 'required|string|max:30',
            'correo' => 'required|email|max:150',
            'empresa' => 'nullable|string|max:150',
            'estado' => 'required|in:Activo,Inactivo',
            'descripcion' => 'nullable|string|max:1000',
        ]);

        $socio = Socio::create([
            'nombre' => $request->nombre,
            'telefono' => $request->telefono,
            'correo' => $request->correo,
            'empresa' => $request->empresa,
            'estado' => $request->estado,
            'descripcion' => $request->descripcion,
            'created_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Socio creado.', 'socio' => $socio], 201);
    }

    public function update(Request $request, $id)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $socio = Socio::findOrFail($id);
        $request->validate([
            'nombre' => 'required|string|min:3|max:150',
            'telefono' => 'required|string|max:30',
            'correo' => 'required|email|max:150',
            'empresa' => 'nullable|string|max:150',
            'estado' => 'required|in:Activo,Inactivo',
            'descripcion' => 'nullable|string|max:1000',
        ]);

        $socio->update($request->only(['nombre', 'telefono', 'correo', 'empresa', 'estado', 'descripcion']));

        return response()->json(['message' => 'Socio actualizado.', 'socio' => $socio], 200);
    }

    public function destroy($id)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $socio = Socio::findOrFail($id);
        if ($socio->usuarios()->exists()) {
            return response()->json(['message' => 'No se puede eliminar un socio con usuarios asociados.'], 422);
        }

        $socio->delete();

        return response()->json(['message' => 'Socio eliminado.'], 200);
    }
}
