<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;

class NotificacionController extends Controller
{
    public function index()
    {
        $notificaciones = Auth::user()->notificaciones()
            ->whereNull('read_at')
            ->with(['seccion:id,nombre', 'modulo:id,nombre,seccion_id'])
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json($notificaciones, 200);
    }

    // GET /notificaciones/no-leidas/count
    public function noLeidasCount()
    {
        $count = Auth::user()->notificaciones()->whereNull('read_at')->count();

        return response()->json(['count' => $count], 200);
    }

    // PUT /notificaciones/{id}/leer
    public function marcarLeida(int $id)
    {
        $notificacion = Auth::user()->notificaciones()->findOrFail($id);

        if (!$notificacion->read_at) {
            $notificacion->update(['read_at' => now()]);
        }

        return response()->json(['message' => 'Notificación marcada como leída.'], 200);
    }

    // PUT /notificaciones/leer-todas
    public function marcarTodasLeidas()
    {
        Auth::user()->notificaciones()->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['message' => 'Notificaciones marcadas como leídas.'], 200);
    }
}
