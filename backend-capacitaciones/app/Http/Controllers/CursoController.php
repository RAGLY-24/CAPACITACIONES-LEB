<?php

namespace App\Http\Controllers;

use App\Models\Curso;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class CursoController extends Controller
{
    // --- 1. LEER: Listar todos los cursos ---
    public function index()
    {
        $authUser = Auth::user();

        if (!$authUser instanceof User || !$authUser->hasPermission('edit_capacitaciones_course')) {
            return response()->json([
                'message' => 'Acceso denegado. No tienes permiso para acceder a los cursos.'
            ], 403);
        }

        $cursos = Curso::with('creator')->get();
        return response()->json($cursos, 200);
    }

    // --- 2. CREAR: Guardar un curso nuevo ---
    public function store(Request $request)
    {
        $authUser = Auth::user();

        if (!$authUser instanceof User || !$authUser->hasPermission('edit_capacitaciones_course')) {
            return response()->json([
                'message' => 'Acceso denegado. No tienes permiso para crear cursos.'
            ], 403);
        }

        // Validaciones estrictas según los requisitos
        $request->validate([
            'nombre' => [
                'required',
                'string',
                'min:5',
                'max:150',
                'unique:cursos,nombre',
                'regex:/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-\.\,]+$/'
            ],
            'descripcion' => [
                'required',
                'string',
                'min:10',
                'max:2000',
                'regex:/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-\.\,\:\;\(\)]+$/'
            ],
            'estado' => 'required|in:Activo,Inactivo',
            'indicador_importancia' => 'nullable|in:Obligatorio,Prioritario',
        ], [
            'nombre.required' => 'El nombre del curso es obligatorio.',
            'nombre.min' => 'El nombre debe tener al menos 5 caracteres.',
            'nombre.max' => 'El nombre no puede exceder 150 caracteres.',
            'nombre.unique' => 'El nombre del curso ya existe.',
            'nombre.regex' => 'El nombre no puede contener caracteres especiales no válidos.',
            'descripcion.required' => 'La descripción es obligatoria.',
            'descripcion.min' => 'La descripción debe tener al menos 10 caracteres.',
            'descripcion.max' => 'La descripción no puede exceder 2000 caracteres.',
            'descripcion.regex' => 'La descripción contiene caracteres especiales no válidos.',
            'estado.required' => 'El estado es obligatorio.',
            'estado.in' => 'El estado debe ser Activo o Inactivo.',
            'indicador_importancia.in' => 'El indicador debe ser Obligatorio o Prioritario.',
        ]);

        // Si es obligatorio, debe quedar registrado quién realizó el cambio
        $curso = Curso::create([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
            'estado' => $request->estado,
            'indicador_importancia' => $request->indicador_importancia,
            'created_by' => $authUser->id,
        ]);

        return response()->json([
            'message' => 'Curso creado exitosamente',
            'curso' => $curso->load('creator')
        ], 201);
    }

    // --- 3. ACTUALIZAR: Modificar un curso existente ---
    public function update(Request $request, $id)
    {
        $authUser = Auth::user();

        if (!$authUser instanceof User || !$authUser->hasPermission('edit_capacitaciones_course')) {
            return response()->json([
                'message' => 'Acceso denegado. No tienes permiso para editar cursos.'
            ], 403);
        }

        $curso = Curso::findOrFail($id);

        // Validaciones (con Rule::unique para ignorar el curso actual)
        $request->validate([
            'nombre' => [
                'required',
                'string',
                'min:5',
                'max:150',
                Rule::unique('cursos')->ignore($curso->id),
                'regex:/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-\.\,]+$/'
            ],
            'descripcion' => [
                'required',
                'string',
                'min:10',
                'max:2000',
                'regex:/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-\.\,\:\;\(\)]+$/'
            ],
            'estado' => 'required|in:Activo,Inactivo',
            'indicador_importancia' => 'nullable|in:Obligatorio,Prioritario',
        ], [
            'nombre.required' => 'El nombre del curso es obligatorio.',
            'nombre.min' => 'El nombre debe tener al menos 5 caracteres.',
            'nombre.max' => 'El nombre no puede exceder 150 caracteres.',
            'nombre.unique' => 'El nombre del curso ya existe.',
            'nombre.regex' => 'El nombre no puede contener caracteres especiales no válidos.',
            'descripcion.required' => 'La descripción es obligatoria.',
            'descripcion.min' => 'La descripción debe tener al menos 10 caracteres.',
            'descripcion.max' => 'La descripción no puede exceder 2000 caracteres.',
            'descripcion.regex' => 'La descripción contiene caracteres especiales no válidos.',
            'estado.required' => 'El estado es obligatorio.',
            'estado.in' => 'El estado debe ser Activo o Inactivo.',
            'indicador_importancia.in' => 'El indicador debe ser Obligatorio o Prioritario.',
        ]);

        $curso->update([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
            'estado' => $request->estado,
            'indicador_importancia' => $request->indicador_importancia,
        ]);

        return response()->json([
            'message' => 'Curso actualizado exitosamente',
            'curso' => $curso->load('creator')
        ], 200);
    }

    // --- 4. ELIMINAR: Borrar un curso ---
    public function destroy($id)
    {
        $authUser = Auth::user();

        if (!$authUser instanceof User || !$authUser->hasPermission('edit_capacitaciones_course')) {
            return response()->json([
                'message' => 'Acceso denegado. No tienes permiso para eliminar cursos.'
            ], 403);
        }

        $curso = Curso::findOrFail($id);

        // Verificar si tiene módulos asociados (validación preventiva)
        // Por ahora solo verificamos que exista
        if (!$curso) {
            return response()->json([
                'message' => 'El curso no existe.'
            ], 404);
        }

        $curso->delete();

        return response()->json([
            'message' => 'Curso eliminado exitosamente'
        ], 200);
    }

    // --- 5. OBTENER un curso específico ---
    public function show($id)
    {
        $authUser = Auth::user();

        if (!$authUser instanceof User || !$authUser->hasPermission('edit_capacitaciones_course')) {
            return response()->json([
                'message' => 'Acceso denegado. No tienes permiso para ver este curso.'
            ], 403);
        }

        $curso = Curso::with('creator')->findOrFail($id);
        return response()->json($curso, 200);
    }
}
