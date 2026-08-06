<?php

namespace App\Http\Controllers;

use App\Models\EnlaceRegistro;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class EnlaceRegistroController extends Controller
{
    // --- Generar un enlace de registro temporal (un solo uso, expira en 30 min) ---
    public function store(Request $request)
    {
        $authUser = Auth::user();

        if (!$authUser instanceof User || !$authUser->hasPermission('create_users')) {
            return response()->json([
                'message' => 'Acceso denegado. No tienes permiso para generar enlaces de registro.'
            ], 403);
        }

        $enlace = EnlaceRegistro::create([
            'token' => Str::random(48),
            'expires_at' => now()->addMinutes(30),
            'created_by' => $authUser->id,
        ]);

        $url = URL::temporarySignedRoute(
            'registro.enlace.validar',
            $enlace->expires_at,
            ['token' => $enlace->token]
        );

        return response()->json([
            'message' => 'Enlace generado correctamente',
            'url' => $url,
            'expires_at' => $enlace->expires_at,
        ], 201);
    }

    // 
    public function validar(Request $request, string $token)
    {
        $frontend = rtrim(config('app.frontend_url'), '/');
        $enlace = EnlaceRegistro::where('token', $token)->first();

        if (!$enlace || !$enlace->estaVigente()) {
            return redirect()->away("{$frontend}/registro?enlace_invalido=1");
        }

        return redirect()->away("{$frontend}/registro?enlace={$enlace->token}");
    }

    // 
    public function estado(string $token)
    {
        $enlace = EnlaceRegistro::where('token', $token)->first();

        if (!$enlace) {
            return response()->json(['valido' => false, 'motivo' => 'no_encontrado'], 404);
        }

        if ($enlace->used_at) {
            return response()->json(['valido' => false, 'motivo' => 'usado'], 410);
        }

        if ($enlace->expires_at->isPast()) {
            return response()->json(['valido' => false, 'motivo' => 'expirado'], 410);
        }

        return response()->json(['valido' => true], 200);
    }
}
