<?php

namespace App\Http\Controllers;

use App\Models\Socio;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class SocioController extends Controller
{
    private function esAdmin(): bool
    {
        $user = Auth::user();
        return $user instanceof User && ($user->puesto?->nombre === 'SistemasAdmin' || $user->hasPermission('create_users'));
    }

    // Oculta el teléfono dejando visibles solo los últimos 2 dígitos,
    // al estilo del login de Google (ej. 4921231212 -> xxxxxxxx12).
    private function ocultarTelefono(?string $telefono): ?string
    {
        if (!$telefono) {
            return $telefono;
        }

        $visible = substr($telefono, -2);
        return str_repeat('x', max(strlen($telefono) - 2, 0)) . $visible;
    }

    // Lista mínima (id + nombre) para el select de la pantalla pública de
    // registro: no requiere sesión y no expone teléfono/correo del socio.
    public function listaPublica()
    {
        $socios = Socio::where('estado', 'Activo')
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        return response()->json($socios, 200);
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

        $socios->each(function ($socio) {
            $socio->telefono = $this->ocultarTelefono($socio->telefono);
        });

        return response()->json($socios, 200);
    }

    public function store(Request $request)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $request->validate([
            'nombre' => 'required|string|min:3|max:150|unique:socios,nombre',
            'telefono' => 'nullable|regex:/^\d{10}$/',
            'correo' => 'required|email|max:150|unique:socios,correo',
            'empresa' => 'nullable|string|max:150',
            'estado' => 'required|in:Activo,Inactivo',
            'descripcion' => 'nullable|string|max:1000',
        ], [
            'nombre.unique' => 'Ya existe un socio registrado con ese nombre.',
            'correo.unique' => 'Ya existe un socio registrado con ese correo.',
            'telefono.regex' => 'Ingrese un número de teléfono válido de 10 dígitos.',
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
            'nombre' => ['required', 'string', 'min:3', 'max:150', Rule::unique('socios', 'nombre')->ignore($socio->id)],
            'telefono' => 'nullable|regex:/^\d{10}$/',
            'correo' => ['required', 'email', 'max:150', Rule::unique('socios', 'correo')->ignore($socio->id)],
            'empresa' => 'nullable|string|max:150',
            'estado' => 'required|in:Activo,Inactivo',
            'descripcion' => 'nullable|string|max:1000',
        ], [
            'nombre.unique' => 'Ya existe un socio registrado con ese nombre.',
            'correo.unique' => 'Ya existe un socio registrado con ese correo.',
            'telefono.regex' => 'Ingrese un número de teléfono válido de 10 dígitos.',
        ]);

        // El teléfono se devuelve oculto en los GETs, así que si el campo no
        // se envía (el usuario no lo tocó en el modal), se conserva el actual.
        $socio->update($request->only(['nombre', 'correo', 'empresa', 'estado', 'descripcion']));
        if ($request->has('telefono')) {
            $socio->update(['telefono' => $request->telefono]);
        }

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
