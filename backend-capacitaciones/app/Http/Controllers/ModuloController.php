<?php

namespace App\Http\Controllers;

use App\Models\Modulo;
use App\Models\Seccion;
use App\Models\User;
use App\Models\ProgresoModulo;
use App\Services\ArchivoStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ModuloController extends Controller
{
    private ArchivoStorageService $archivos;

    public function __construct(ArchivoStorageService $archivos)
    {
        $this->archivos = $archivos;
    }

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
            'prerequisite_module_id' => 'nullable|exists:modulos,id',
            'archivo'     => 'nullable|file|mimes:pdf,mp4,webm|max:102400',
            'imagen'      => 'nullable|file|image|mimes:jpg,jpeg,png,webp|max:5120',
        ], [
            'nombre.min'       => 'El nombre debe tener al menos 5 caracteres.',
            'nombre.max'       => 'El nombre no puede exceder 150 caracteres.',
            'descripcion.min'  => 'La descripción debe tener al menos 10 caracteres.',
            'descripcion.max'  => 'La descripción no puede exceder 2000 caracteres.',
            'archivo.mimes'    => 'Solo se permiten archivos PDF, MP4 o WEBM.',
            'archivo.max'      => 'El archivo no puede superar los 100 MB.',
            'imagen.mimes'     => 'La imagen debe ser JPG, PNG o WEBP.',
            'imagen.max'       => 'La imagen no puede superar los 5 MB.',
        ]);

        $filePath = null;
        $fileType = null;
        $imagenPath = null;
        $carpeta = $this->carpetaParaSeccion($request->seccion_id);

        if ($request->hasFile('archivo')) {
            [$filePath, $fileType] = $this->guardarArchivo($request->file('archivo'), $carpeta);
        }
        if ($request->hasFile('imagen')) {
            $imagenPath = $this->guardarImagen($request->file('imagen'), $carpeta);
        }

        $modulo = Modulo::create([
            'seccion_id'  => $request->seccion_id,
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
            'estado'      => $request->estado,
            'prerequisite_module_id' => $request->prerequisite_module_id,
            'file_path'   => $filePath,
            'file_type'   => $fileType,
            'imagen'      => $imagenPath,
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
            'prerequisite_module_id' => 'nullable|exists:modulos,id',
            'archivo'     => 'nullable|file|mimes:pdf,mp4,webm|max:102400',
            'imagen'      => 'nullable|file|image|mimes:jpg,jpeg,png,webp|max:5120',
        ], [
            'nombre.min'      => 'El nombre debe tener al menos 5 caracteres.',
            'nombre.max'      => 'El nombre no puede exceder 150 caracteres.',
            'descripcion.min' => 'La descripción debe tener al menos 10 caracteres.',
            'descripcion.max' => 'La descripción no puede exceder 2000 caracteres.',
            'archivo.mimes'   => 'Solo se permiten archivos PDF, MP4 o WEBM.',
            'archivo.max'     => 'El archivo no puede superar los 100 MB.',
            'imagen.mimes'    => 'La imagen debe ser JPG, PNG o WEBP.',
            'imagen.max'      => 'La imagen no puede superar los 5 MB.',
        ]);

        $carpetaAnterior = $modulo->carpeta();
        $seccionNueva    = $request->seccion_id ?? $modulo->seccion_id;

        $datos = [
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
            'estado'      => $request->estado,
            'prerequisite_module_id' => $request->prerequisite_module_id,
            'seccion_id'  => $seccionNueva,
        ];

        $carpetaNueva = $this->carpetaParaSeccion($seccionNueva);

        if ($request->hasFile('archivo')) {
            $this->eliminarArchivoFisico($modulo->file_path, $carpetaAnterior);
            [$filePath, $fileType] = $this->guardarArchivo($request->file('archivo'), $carpetaNueva);
            $datos['file_path']         = $filePath;
            $datos['file_type']         = $fileType;
            $datos['presentacion_json'] = null; // el módulo deja de ser una presentación
        } elseif ($carpetaAnterior !== $carpetaNueva) {
            // Cambió de sección pero no subieron un archivo nuevo: reubicamos el existente.
            $this->archivos->mover($modulo->file_path, $carpetaAnterior, $carpetaNueva);
        }

        if ($request->hasFile('imagen')) {
            $this->eliminarImagenFisica($modulo->imagen, $carpetaAnterior);
            $datos['imagen'] = $this->guardarImagen($request->file('imagen'), $carpetaNueva);
        } elseif ($carpetaAnterior !== $carpetaNueva) {
            $this->archivos->mover($modulo->imagen, $carpetaAnterior, $carpetaNueva);
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
        $carpeta = $modulo->carpeta();
        $this->eliminarArchivoFisico($modulo->file_path, $carpeta);
        $this->eliminarImagenFisica($modulo->imagen, $carpeta);
        $modulo->delete();

        return response()->json(['message' => 'Módulo eliminado exitosamente.'], 200);
    }

    public function guardarPresentacion(Request $request, $id)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $modulo = Modulo::findOrFail($id);

        $request->validate([
            'contenido' => 'required|json',
        ], [
            'contenido.required' => 'No hay contenido de presentación para guardar.',
            'contenido.json'     => 'El contenido de la presentación no es válido.',
        ]);

        $this->eliminarArchivoFisico($modulo->file_path, $modulo->carpeta());

        $modulo->update([
            'file_path'         => null,
            'file_type'         => 'presentacion',
            'presentacion_json' => $request->input('contenido'),
        ]);

        return response()->json([
            'message' => 'Presentación guardada exitosamente.',
            'modulo'  => $modulo->load('creator:id,name'),
        ], 200);
    }

    // Carpeta "modulos/{id}-{nombre-sección}" (o "modulos/sin-seccion") para
    // una sección que todavía puede no estar guardada en un Modulo existente.
    private function carpetaParaSeccion(?int $seccionId): string
    {
        $nombre = $seccionId ? Seccion::find($seccionId)?->nombre : null;
        return 'modulos/' . $this->archivos->carpetaSeccion($seccionId, $nombre);
    }

    private function guardarArchivo($file, string $carpeta): array
    {
        $ext      = $file->getClientOriginalExtension();
        $fileType = $ext === 'pdf' ? 'pdf' : 'video';
        $filename = $this->archivos->guardar($file, $carpeta);

        return [$filename, $fileType];
    }

    private function eliminarArchivoFisico(?string $filename, string $carpeta): void
    {
        $this->archivos->eliminar($filename, $carpeta);
    }

    private function guardarImagen($file, string $carpeta): string
    {
        return $this->archivos->guardar($file, $carpeta, 'img_');
    }

    private function eliminarImagenFisica(?string $filename, string $carpeta): void
    {
        $this->archivos->eliminar($filename, $carpeta);
    }
}
