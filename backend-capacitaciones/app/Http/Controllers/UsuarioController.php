<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Puesto;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UsuarioController extends Controller
{
    // --- 1. LEER: Listar todos los usuarios ---
    public function index()
    {
        $authUser = Auth::user();

        if (!$authUser instanceof User || !(
            $authUser->hasPermission('create_users') ||
            $authUser->hasPermission('delete_users') ||
            $authUser->hasPermission('assign_permissions')
        )) {
            return response()->json([
                'message' => 'Acceso denegado. No tienes permiso para ver los usuarios.'
            ], 403);
        }

        $usuarios = User::with('puesto')->get();
        return response()->json($usuarios, 200);
    }

    // --- 2. CREAR: Guardar un usuario nuevo ---
    public function store(Request $request)
    {
        $authUser = Auth::user();

        if (!$authUser instanceof User || !$authUser->hasPermission('create_users')) {
            return response()->json([
                'message' => 'Acceso denegado. No tienes permiso para crear usuarios.'
            ], 403);
        }

        // 1. Validaciones estrictas
        $request->validate([
            'name' => 'required|string|max:255',
            'lastname' => 'nullable|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'usuario' => 'required|string|max:255|unique:users',
            'puesto_id' => 'required|exists:puestos,id',
            'estado' => 'required|in:Activo,Inactivo',
            // El regex exige: min 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo
            'password' => [
                'required',
                'string',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/'
            ],
            'permissions' => 'sometimes|array',
        ], [
            // Mensajes personalizados de error (opcional, pero buena práctica)
            'email.unique' => 'El correo ya está registrado.',
            'usuario.unique' => 'El nombre de usuario ya existe.',
            'password.regex' => 'La contraseña no cumple con las políticas de seguridad.'
        ]);

        $puesto = Puesto::find($request->input('puesto_id'));
        $defaultPermissions = [];

        if ($puesto && $puesto->nombre === 'SistemasAdmin') {
            $defaultPermissions = [
                'manage_news' => true,
                'news_access' => true,
                'edit_capacitaciones_course' => true,
                'manage_passwords' => true,
                'create_users' => true,
                'delete_users' => true,
                'assign_permissions' => true,
            ];
        } elseif ($puesto && $puesto->nombre === 'Gerente') {
            $defaultPermissions = [
                'manage_news' => false,
                'news_access' => true,
                'edit_capacitaciones_course' => false,
                'manage_passwords' => true,
                'create_users' => true,
                'delete_users' => false,
                'assign_permissions' => false,
            ];
        } else {
            // Usuarios normales: no pueden publicar noticias ni editar capacitaciones por defecto
            $defaultPermissions = [
                'manage_news' => false,
                'news_access' => true,
                'edit_capacitaciones_course' => false,
            ];
        }

        $requestedPermissions = $request->input('permissions', []);
        if (!$authUser instanceof User || !$authUser->hasPermission('assign_permissions')) {
            $requestedPermissions = [];
        }

        $usuario = User::create([
            'name' => $request->name,
            'lastname' => $request->lastname,
            'email' => $request->email,
            'usuario' => $request->usuario,
            'puesto_id' => $request->puesto_id,
            'estado' => $request->estado,
            'password' => $request->password,
            'permissions' => array_merge($defaultPermissions, $requestedPermissions),
        ]);

        return response()->json([
            'message' => 'Usuario creado exitosamente',
            'user' => $usuario
        ], 201);
    }

    // --- 3. ACTUALIZAR: Modificar un usuario existente ---
    public function update(Request $request, $id)
    {
        $authUser = Auth::user();
        $usuario = User::findOrFail($id);

        if ($usuario->puesto?->nombre === 'SistemasAdmin' && $authUser->puesto?->nombre !== 'SistemasAdmin') {
            return response()->json([
                'message' => 'Acceso denegado. No puedes editar un Administrador de Sistemas.'
            ], 403);
        }

        if (!$authUser instanceof User || !$authUser->hasPermission('assign_permissions')) {
            return response()->json([
                'message' => 'Acceso denegado. No tienes permiso para actualizar usuarios.'
            ], 403);
        }

        // 1. Validaciones (Notar el uso de Rule::unique para ignorar al usuario actual)
        $request->validate([
            'name' => 'required|string|max:255',
            'lastname' => 'nullable|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($usuario->id),
            ],
            'usuario' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users')->ignore($usuario->id),
            ],
            'puesto_id' => 'required|exists:puestos,id',
            'estado' => 'required|in:Activo,Inactivo',
            'password' => [
                'nullable',
                'string',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/'
            ],
            'permissions' => 'sometimes|array',
        ]);

        // 2. Preparar los datos a actualizar
        $datosUpdate = [
            'name' => $request->name,
            'lastname' => $request->lastname,
            'email' => $request->email,
            'usuario' => $request->usuario,
            'puesto_id' => $request->puesto_id,
            'estado' => $request->estado,
        ];

        // Solo actualizar la contraseña si el usuario escribió una nueva
        if ($request->filled('password')) {
            $datosUpdate['password'] = $request->password;
        }

        // Control de permisos de asignación
        if ($authUser instanceof User && $authUser->hasPermission('assign_permissions')) {
            $datosUpdate['permissions'] = $request->input('permissions', []);
        }

        // 3. Ejecutar actualización
        $usuario->update($datosUpdate);

        return response()->json([
            'message' => 'Usuario actualizado correctamente',
            'user' => $usuario
        ], 200);
    }

    // --- 4. ELIMINAR: Borrar un usuario ---
    public function destroy($id)
    {
        $authUser = Auth::user();
        $usuario = User::findOrFail($id);

        if (!$authUser instanceof User || !$authUser->hasPermission('delete_users')) {
            return response()->json([
                'message' => 'Acceso denegado. No tienes permiso para eliminar usuarios.'
            ], 403);
        }

        // Protección 1: Prevención de suicidio de cuenta
        if ($authUser->id == $usuario->id) {
            return response()->json([
                'message' => 'Acción denegada: No puedes eliminar tu propia cuenta.'
            ], 403);
        }

        // Protección 2: Evitar borrar al único administrador que queda
        if ($usuario->puesto_id == 1) { // Suponiendo que 1 es SistemasAdmin
            $totalAdmins = User::where('puesto_id', 1)->count();
            if ($totalAdmins <= 1) {
                return response()->json([
                    'message' => 'Acción denegada: Debe existir al menos un Administrador en el sistema.'
                ], 403);
            }
        }

        // Si pasa las protecciones, lo eliminamos
        $usuario->delete();

        return response()->json([
            'message' => 'Usuario eliminado permanentemente'
        ], 200);
    }
}