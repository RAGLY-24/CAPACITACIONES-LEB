<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Noticia;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class NoticiaController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if (!$user instanceof User || !$user->canAccessNews()) {
            return response()->json([
                'message' => 'Acceso denegado. No tienes permiso para ver noticias.'
            ], 403);
        }

        $noticias = Noticia::with(['author:id,name,lastname,usuario'])->orderByDesc('created_at')->get();
        return response()->json($noticias, 200);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user instanceof User || !$user->canAccessNews()) {
            return response()->json([
                'message' => 'Acceso denegado. No tienes permiso para crear noticias.'
            ], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'evidence' => 'nullable|string',
        ]);

        $noticia = Noticia::create([
            'title' => $request->title,
            'body' => $request->body,
            'evidence' => $request->evidence,
            'created_by' => $user->id,
        ]);

        return response()->json($noticia, 201);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();

        if (!$user instanceof User || !$user->canAccessNews()) {
            return response()->json([
                'message' => 'Acceso denegado. No tienes permiso para editar noticias.'
            ], 403);
        }

        $noticia = Noticia::findOrFail($id);

        if (!$user->canManageNews() && $user->id !== $noticia->created_by) {
            return response()->json([
                'message' => 'Acceso denegado. No tienes permiso para editar esta noticia.'
            ], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'evidence' => 'nullable|string',
        ]);

        $noticia->update([
            'title' => $request->title,
            'body' => $request->body,
            'evidence' => $request->evidence,
        ]);

        return response()->json($noticia, 200);
    }

    public function destroy($id)
    {
        $user = Auth::user();

        if (!$user instanceof User || !$user->canManageNews()) {
            return response()->json([
                'message' => 'Acceso denegado. No tienes permiso para eliminar noticias.'
            ], 403);
        }

        $noticia = Noticia::findOrFail($id);
        $noticia->delete();

        return response()->json([
            'message' => 'Noticia eliminada correctamente'
        ], 200);
    }
}
