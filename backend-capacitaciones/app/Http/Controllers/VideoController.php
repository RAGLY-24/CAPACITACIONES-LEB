<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VideoController extends Controller
{
    private function esAdmin(): bool
    {
        $user = Auth::user();
        return $user instanceof User && ($user->puesto?->nombre === 'SistemasAdmin' || $user->hasPermission('edit_trainings'));
    }

    public function index()
    {
        $videos = Video::orderBy('created_at')->get();
        return response()->json($videos, 200);
    }

    public function store(Request $request)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $request->validate([
            'titulo' => 'required|string|min:3|max:150',
            'url'    => 'required|url|max:500',
        ], [
            'titulo.min' => 'El título debe tener al menos 3 caracteres.',
            'titulo.max' => 'El título no puede exceder 150 caracteres.',
            'url.url'    => 'La URL no es válida.',
            'url.max'    => 'La URL no puede exceder 500 caracteres.',
        ]);

        $video = Video::create([
            'titulo'     => $request->titulo,
            'url'        => $request->url,
            'created_by' => Auth::id(),
        ]);

        return response()->json([
            'message' => 'Video agregado exitosamente.',
            'video'   => $video,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $video = Video::findOrFail($id);

        $request->validate([
            'titulo' => 'required|string|min:3|max:150',
            'url'    => 'required|url|max:500',
        ], [
            'titulo.min' => 'El título debe tener al menos 3 caracteres.',
            'titulo.max' => 'El título no puede exceder 150 caracteres.',
            'url.url'    => 'La URL no es válida.',
            'url.max'    => 'La URL no puede exceder 500 caracteres.',
        ]);

        $video->update([
            'titulo' => $request->titulo,
            'url'    => $request->url,
        ]);

        return response()->json([
            'message' => 'Video actualizado exitosamente.',
            'video'   => $video,
        ], 200);
    }

    public function destroy($id)
    {
        if (!$this->esAdmin()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $video = Video::findOrFail($id);
        $video->delete();

        return response()->json(['message' => 'Video eliminado exitosamente.'], 200);
    }
}
