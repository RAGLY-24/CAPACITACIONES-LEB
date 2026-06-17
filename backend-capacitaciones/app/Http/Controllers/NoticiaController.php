<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Noticia;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class NoticiaController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if (!$user instanceof User || !$user->canAccessNews()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $noticias = Noticia::with(['author:id,name,lastname,usuario'])->orderByDesc('created_at')->get();
        return response()->json($noticias, 200);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user instanceof User || !$user->canAccessNews()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        // Fíjate cómo validamos el arreglo de archivos (files.*)
        $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'evidence' => 'nullable|string',
            'files' => 'nullable|array',
            'files.*' => 'file|mimes:jpg,jpeg,png|max:20480',
        ]);

        $paths = []; // Aquí guardaremos solo el nombre del archivo
        $frontendDir = base_path('../frontend-capacitaciones/public/noticias');
        File::ensureDirectoryExists($frontendDir);

        // Si enviaron múltiples archivos, los recorremos y guardamos uno por uno
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $filename = time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
                $storedPath = $file->storeAs('noticias', $filename, 'public');
                $paths[] = $filename;
                copy(storage_path('app/public/' . $storedPath), $frontendDir . '/' . $filename);
            }
        }

        $noticia = Noticia::create([
            'title' => $request->title,
            'body' => $request->body,
            'evidence' => $request->evidence,
            'file_paths' => empty($paths) ? null : $paths,
            'created_by' => $user->id,
        ]);

        return response()->json($noticia, 201);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $noticia = Noticia::findOrFail($id);

        if (!$user->canManageNews() && $user->id !== $noticia->created_by) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'evidence' => 'nullable|string',
            'files' => 'nullable|array',
            'files.*' => 'file|mimes:jpg,jpeg,png|max:20480',
        ]);

        $dataToUpdate = [
            'title' => $request->title,
            'body' => $request->body,
            'evidence' => $request->evidence,
        ];

        $frontendDir = base_path('../frontend-capacitaciones/public/noticias');
        File::ensureDirectoryExists($frontendDir);

        // Si subieron nuevos archivos, reemplazamos el álbum viejo
        if ($request->hasFile('files')) {

            // 1. Borramos todas las fotos viejas del servidor y del frontend
            if (!empty($noticia->file_paths)) {
                foreach ($noticia->file_paths as $oldPath) {
                    Storage::disk('public')->delete('noticias/' . $oldPath);
                    File::delete($frontendDir . '/' . $oldPath);
                }
            }

            // 2. Guardamos las nuevas fotos
            $paths = [];
            foreach ($request->file('files') as $file) {
                $filename = time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
                $storedPath = $file->storeAs('noticias', $filename, 'public');
                $paths[] = $filename;
                copy(storage_path('app/public/' . $storedPath), $frontendDir . '/' . $filename);
            }
            $dataToUpdate['file_paths'] = $paths;
        }

        $noticia->update($dataToUpdate);

        return response()->json($noticia, 200);
    }

    public function destroy($id)
    {
        $user = Auth::user();

        if (!$user instanceof User || !$user->canManageNews()) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $noticia = Noticia::findOrFail($id);

        // Si la noticia tenía una galería de fotos, borramos todas físicamente del servidor y del frontend
        if (!empty($noticia->file_paths)) {
            $frontendDir = base_path('../frontend-capacitaciones/public/noticias');
            foreach ($noticia->file_paths as $path) {
                Storage::disk('public')->delete('noticias/' . $path);
                File::delete($frontendDir . '/' . $path);
            }
        }

        $noticia->delete();

        return response()->json(['message' => 'Noticia eliminada correctamente'], 200);
    }
}