<?php

namespace App\Http\Controllers;

use App\Models\AvisoEmergencia;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AvisoEmergenciaController extends Controller
{
    // GET /aviso-emergencia — visible para quien puede ver noticias.
    public function show()
    {
        $user = Auth::user();
        if (!$user instanceof User || !$user->canAccessNews()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        // Singleton: siempre se opera sobre la única fila existente, sin
        // asumir que su id sea 1 (un delete manual puede haber avanzado el
        // auto_increment, lo que dejaría huérfano un firstOrCreate(['id'=>1])).
        $aviso = AvisoEmergencia::firstOrCreate([], ['mensaje' => null]);

        return response()->json($aviso, 200);
    }

    // PUT /aviso-emergencia — solo quien administra noticias puede editarlo.
    public function update(Request $request)
    {
        $user = Auth::user();
        if (!$user instanceof User || !$user->canManageNews()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $request->validate([
            'mensaje' => 'required|string|max:1000',
        ]);

        $aviso = AvisoEmergencia::firstOrCreate([]);
        $aviso->mensaje = $request->mensaje;
        $aviso->updated_by = $user->id;
        $aviso->save();

        return response()->json($aviso, 200);
    }
}
