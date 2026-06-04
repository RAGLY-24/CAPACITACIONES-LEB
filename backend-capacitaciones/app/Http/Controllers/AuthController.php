<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
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