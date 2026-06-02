<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        // 2. Intentar iniciar sesión
        if (Auth::attempt(['usuario' => $request->usuario, 'password' => $request->password])) {
            $user = Auth::user();

            return response()->json([
                'status' => 'success',
                'message' => 'Login correcto',
                'user' => $user
            ], 200);
        }

        // 3. Si las credenciales están mal
        return response()->json([
            'status' => 'error',
            'message' => 'Usuario o contraseña incorrectos'
        ], 401);
    }
}