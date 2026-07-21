<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Puesto;
use App\Models\User;

class AuthController extends Controller
{
    // Registro público desde la pantalla de Login. A diferencia de cuando un
    // admin crea un usuario, aquí no se puede elegir puesto ni permisos: la
    // cuenta siempre nace como "Operador" con acceso solo a noticias y a
    // realizar capacitaciones (mismos permisos por defecto que UsuarioController
    // asigna a cualquier puesto que no sea SistemasAdmin/Gerente). Para acceder
    // a más secciones, un admin debe editar sus permisos después, como a
    // cualquier otro usuario.
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'lastname' => 'nullable|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'usuario' => 'required|string|max:255|unique:users',
            'socio_id' => 'nullable|exists:socios,id',
            'password' => [
                'required',
                'string',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/'
            ],
        ], [
            'email.unique' => 'El correo ya está registrado.',
            'usuario.unique' => 'El nombre de usuario ya existe.',
            'password.regex' => 'La contraseña no cumple con las políticas de seguridad.'
        ]);

        $puestoOperador = Puesto::firstOrCreate(['nombre' => 'Operador']);

        $user = User::create([
            'name' => $request->name,
            'lastname' => $request->lastname,
            'email' => $request->email,
            'usuario' => $request->usuario,
            'puesto_id' => $puestoOperador->id,
            'socio_id' => $request->socio_id,
            'estado' => 'Activo',
            'password' => $request->password,
            'permissions' => [
                'manage_news' => false,
                'news_access' => true,
                'edit_capacitaciones_course' => false,
                'view_reports' => false,
                'manage_content' => false,
            ],
        ]);

        $token = $user->createToken('token-auth')->plainTextToken;
        $user->load('puesto');

        return response()->json([
            'status' => 'success',
            'message' => 'Registro exitoso',
            'token' => $token,
            'user' => $user,
        ], 201);
    }

    public function login(Request $request)
    {
        // 1. Validar que React nos mande los datos
        $request->validate([
            'usuario' => 'required|string',
            'password' => 'required|string',
        ]);

        // 2. Buscar el usuario por su nombre de usuario
        $user = User::where('usuario', $request->usuario)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Usuario o contraseña incorrectos'
            ], 401);
        }

        // 3. Borramos tokens anteriores por seguridad
        $user->tokens()->delete();

        // 4. Generamos el token para React
        $token = $user->createToken('token-auth')->plainTextToken;
        // Cargar relación puesto para que el frontend pueda leer el rol
        $user->load('puesto');

        return response()->json([
            'status' => 'success',
            'message' => 'Login correcto',
            'token' => $token,
            'user' => $user
        ], 200);
    }

    public function me(Request $request)
    {
        return response()->json($request->user(), 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logout correcto'
        ], 200);
    }
}