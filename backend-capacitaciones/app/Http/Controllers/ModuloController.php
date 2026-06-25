<?php

namespace App\Http\Controllers;

use App\Models\Modulo;
use App\Models\User;
use App\Models\ProgresoModulo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ModuloController extends Controller
{
    private function esAdmin(): bool
    {
        $user = Auth::user();
        return $user instanceof User && ($user->puesto?->nombre === 'SistemasAdmin' || $user->hasPermission('edit_trainings'));
    }

    public function index()
    {
        $user = Auth::user();
        if (!$user instanceof User) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        if ($this->esAdmin()) {
            $modulos = Modulo::with('creator:id,name')
                ->withCount('preguntas')
                ->get();
        } else {
            $modulos = Modulo::where('estado', 'Activo')
                ->withCount('preguntas')
                ->get();
        }

        return response()->json($modulos, 200);
    }

    public function show($id)
    {
        $user = Auth::user();
        if (!$user instanceof User) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $modulo = Modulo::with(['preguntas.opciones'])->findOrFail($id);

        if (!$this->esAdmin() && $modulo->estado === 'Inactivo') {
            return response()->json(['message' => 'Módulo no disponible.'], 403);
        }

        if (!$this->esAdmin()) {
            $modulo->preguntas->each(function ($pregunta) {
                $pregunta->opciones->each(function ($opcion) {
                    unset($opcion->es_correcta);
                });
            });
        }

        return response()->json($modulo, 200);
    }

    public function store(Request $request)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $request->validate([
            'seccion_id'  => 'nullable|exists:secciones,id',
            'nombre'      => 'required|string|min:5|max:150',
            'descripcion' => 'required|string|min:10|max:2000',
            'estado'      => 'required|in:Activo,Inactivo',
            'archivo'     => 'nullable|file|mimes:pdf,mp4,webm|max:204800',
        ], [
            'nombre.min'       => 'El nombre debe tener al menos 5 caracteres.',
            'nombre.max'       => 'El nombre no puede exceder 150 caracteres.',
            'descripcion.min'  => 'La descripción debe tener al menos 10 caracteres.',
            'descripcion.max'  => 'La descripción no puede exceder 2000 caracteres.',
            'archivo.mimes'    => 'Solo se permiten archivos PDF, MP4 o WEBM.',
            'archivo.max'      => 'El archivo no puede superar los 200 MB.',
        ]);

        $filePath = null;
        $fileType = null;

        if ($request->hasFile('archivo')) {
            [$filePath, $fileType] = $this->guardarArchivo($request->file('archivo'));
        }

        $modulo = Modulo::create([
            'seccion_id'  => $request->seccion_id,
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
            'estado'      => $request->estado,
            'file_path'   => $filePath,
            'file_type'   => $fileType,
            'created_by'  => Auth::id(),
        ]);

        return response()->json([
            'message' => 'Módulo creado exitosamente.',
            'modulo'  => $modulo->load('creator:id,name'),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $modulo = Modulo::findOrFail($id);

        $request->validate([
            'nombre'      => 'required|string|min:5|max:150',
            'descripcion' => 'required|string|min:10|max:2000',
            'estado'      => 'required|in:Activo,Inactivo',
            'archivo'     => 'nullable|file|mimes:pdf,mp4,webm|max:204800',
        ], [
            'nombre.min'      => 'El nombre debe tener al menos 5 caracteres.',
            'nombre.max'      => 'El nombre no puede exceder 150 caracteres.',
            'descripcion.min' => 'La descripción debe tener al menos 10 caracteres.',
            'descripcion.max' => 'La descripción no puede exceder 2000 caracteres.',
            'archivo.mimes'   => 'Solo se permiten archivos PDF, MP4 o WEBM.',
            'archivo.max'     => 'El archivo no puede superar los 200 MB.',
        ]);

        $datos = [
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
            'estado'      => $request->estado,
        ];

        if ($request->hasFile('archivo')) {
            $this->eliminarArchivoFisico($modulo->file_path);
            [$filePath, $fileType] = $this->guardarArchivo($request->file('archivo'));
            $datos['file_path'] = $filePath;
            $datos['file_type'] = $fileType;
        }

        $modulo->update($datos);

        return response()->json([
            'message' => 'Módulo actualizado exitosamente.',
            'modulo'  => $modulo->load('creator:id,name'),
        ], 200);
    }

    public function destroy($id)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $modulo = Modulo::findOrFail($id);
        $this->eliminarArchivoFisico($modulo->file_path);
        $modulo->delete();

        return response()->json(['message' => 'Módulo eliminado exitosamente.'], 200);
    }

    private function guardarArchivo($file): array
    {
        $ext      = $file->getClientOriginalExtension();
        $fileType = $ext === 'pdf' ? 'pdf' : 'video';
        $filename = time() . '_' . Str::random(8) . '.' . $ext;

        $storedPath  = $file->storeAs('modulos', $filename, 'public');
        $frontendDir = base_path('../frontend-capacitaciones/public/modulos');
        File::ensureDirectoryExists($frontendDir);
        copy(storage_path('app/public/' . $storedPath), $frontendDir . '/' . $filename);

        return [$filename, $fileType];
    }

    private function eliminarArchivoFisico(?string $filename): void
    {
        if (!$filename) return;

        Storage::disk('public')->delete('modulos/' . $filename);
        $frontendPath = base_path('../frontend-capacitaciones/public/modulos/' . $filename);
        File::delete($frontendPath);
    }
}
