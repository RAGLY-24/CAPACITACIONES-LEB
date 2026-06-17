<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSistemasAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Verificamos si el usuario está autenticado
        $user = $request->user();

        // 2. Si no hay usuario o su puesto NO es SistemasAdmin
        if (!$user || $user->puesto_id !== 1) {
            return response()->json([
                'message' => 'Acceso denegado. Se requieren privilegios de Administrador de Sistemas.'
            ], 403);
        }

        // Si es admin, lo dejamos pasar a la ruta solicitada
        return $next($request);
    }
}


//matar sesion atraves de la cahe, (investigar)