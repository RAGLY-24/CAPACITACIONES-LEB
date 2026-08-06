<?php

namespace App\Http\Controllers;

use App\Models\Puesto;
use App\Support\PermissionCatalog;
use Illuminate\Http\Request;

class PuestoController extends Controller
{
    public function index()
    {
        $puestos = Puesto::orderBy('nombre')->get();

        return response()->json($puestos, 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => ['required', 'string', 'max:255', 'unique:puestos,nombre', 'not_in:SistemasAdmin,sistemasadmin'],
            'default_permissions' => ['sometimes', 'array'],
            'default_permissions.*' => ['boolean'],
        ], [
            'nombre.not_in' => 'No puedes crear un puesto con privilegios de SistemasAdmin.',
        ]);

        $puesto = Puesto::create([
            'nombre' => $request->nombre,
            'default_permissions' => $this->filtrarPermisosValidos($request->input('default_permissions', [])),
        ]);

        return response()->json([
            'message' => 'Puesto creado correctamente',
            'puesto' => $puesto,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $puesto = Puesto::findOrFail($id);

        // No permitir modificar el puesto SistemasAdmin
        if (strtolower($puesto->nombre) === 'sistemasadmin') {
            return response()->json(['message' => 'No se puede modificar el puesto SistemasAdmin.'], 403);
        }

        $request->validate([
            'nombre' => ['required', 'string', 'max:255', "unique:puestos,nombre,{$id}", 'not_in:SistemasAdmin,sistemasadmin'],
            'default_permissions' => ['sometimes', 'array'],
            'default_permissions.*' => ['boolean'],
        ], [
            'nombre.not_in' => 'No puedes asignar el nombre SistemasAdmin a este puesto.',
        ]);

        $puesto->nombre = $request->nombre;
        // Solo se toca si el request la manda explícitamente, para que la
        // edición rápida de solo-nombre (tabla de puestos) no borre los
        // permisos por defecto ya configurados.
        if ($request->has('default_permissions')) {
            $puesto->default_permissions = $this->filtrarPermisosValidos($request->input('default_permissions', []));
        }
        $puesto->save();

        return response()->json([
            'message' => 'Puesto actualizado correctamente',
            'puesto' => $puesto,
        ], 200);
    }

    private function filtrarPermisosValidos(array $permisos): array
    {
        return array_intersect_key($permisos, array_flip(PermissionCatalog::KEYS));
    }

    public function destroy($id)
    {
        $puesto = Puesto::findOrFail($id);

        // Protegemos el puesto SistemasAdmin
        if (strtolower($puesto->nombre) === 'sistemasadmin') {
            return response()->json(['message' => 'No se puede eliminar el puesto SistemasAdmin.'], 403);
        }

        // Eliminar (las FK en users hacen set null)
        $puesto->delete();

        return response()->json(['message' => 'Puesto eliminado correctamente'], 200);
    }
}
