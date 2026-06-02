<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UsuarioController extends Controller
{
    // --- 1. LEER: Listar todos los usuarios ---
    public function index()
    {
        $usuarios = User::with('puesto')->get();
        return response()->json($usuarios, 200);
    }

    // --- 2. CREAR: Guardar un usuario nuevo ---
    public function store(Request $request)
    {
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
        ], [
            // Mensajes personalizados de error (opcional, pero buena práctica)
            'email.unique' => 'El correo ya está registrado.',
            'usuario.unique' => 'El nombre de usuario ya existe.',
            'password.regex' => 'La contraseña no cumple con las políticas de seguridad.'
        ]);

        // 2. Creación en base de datos
        $usuario = User::create([
            'name' => $request->name,
            'lastname' => $request->lastname,
            'email' => $request->email,
            'usuario' => $request->usuario,
            'puesto_id' => $request->puesto_id,
            'estado' => $request->estado,
            'password' => Hash::make($request->password), // ¡NUNCA guardar contraseñas en texto plano!
        ]);

        // 3. Respuesta de éxito
        return response()->json([
            'message' => 'Usuario creado exitosamente',
            'user' => $usuario
        ], 201);
    }

    // --- 3. ACTUALIZAR: Modificar un usuario existente ---
    public function update(Request $request, $id)
    {
        $usuario = User::findOrFail($id);

        // 1. Validaciones (Notar el uso de Rule::unique para ignorar al usuario actual)
        $request->validate([
            'name' => 'required|string|max:255',
            'lastname' => 'nullable|string|max:255',
            'email' => [
                'required', 'string', 'email', 'max:255',
                Rule::unique('users')->ignore($usuario->id),
            ],
            'usuario' => [
                'required', 'string', 'max:255',
                Rule::unique('users')->ignore($usuario->id),
            ],
            'puesto_id' => 'required|exists:puestos,id',
            'estado' => 'required|in:Activo,Inactivo',
            'password' => [
                'nullable', // Es opcional al editar
                'string',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/'
            ],
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
            $datosUpdate['password'] = Hash::make($request->password);
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
        $usuario = User::findOrFail($id);

        // Protección 1: Prevención de suicidio de cuenta
        // (Asumiendo que estás usando autenticación por token en el futuro)
        if (Auth::id() == $usuario->id) {
            return response()->json([
                'message' => 'Acción denegada: No puedes eliminar tu propia cuenta.'
            ], 403); // El 403 lo atrapa tu React para mostrar el Alert
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