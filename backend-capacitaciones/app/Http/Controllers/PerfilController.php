<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PerfilController extends Controller
{
    // --- Actualizar el perfil del usuario autenticado ---
    public function update(Request $request)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $request->validate([
            'name'        => 'required|string|max:255',
            'lastname'    => 'nullable|string|max:255',
            'descripcion' => 'nullable|string|max:500',
            'foto'        => 'nullable|file|image|mimes:jpg,jpeg,png,webp|max:5120',
        ], [
            'name.required'      => 'El nombre es obligatorio.',
            'descripcion.max'    => 'La descripción no puede exceder 500 caracteres.',
            'foto.image'         => 'El archivo debe ser una imagen.',
            'foto.mimes'         => 'La imagen debe ser JPG, PNG o WEBP.',
            'foto.max'           => 'La imagen no puede superar los 5 MB.',
        ]);

        $datos = [
            'name'        => $request->name,
            'lastname'    => $request->lastname,
            'descripcion' => $request->descripcion,
        ];

        if ($request->hasFile('foto')) {
            $this->eliminarFotoFisica($user->foto);
            $datos['foto'] = $this->guardarFoto($request->file('foto'));
        }

        $user->update($datos);

        return response()->json([
            'message' => 'Perfil actualizado exitosamente.',
            'user'    => $user->load('puesto'),
        ], 200);
    }

    private function guardarFoto($file): string
    {
        $ext      = $file->getClientOriginalExtension();
        $filename = 'perfil_' . time() . '_' . Str::random(8) . '.' . $ext;

        $storedPath  = $file->storeAs('perfiles', $filename, 'public');
        $frontendDir = base_path('../frontend-capacitaciones/public/perfiles');
        File::ensureDirectoryExists($frontendDir);
        copy(storage_path('app/public/' . $storedPath), $frontendDir . '/' . $filename);

        return $filename;
    }

    private function eliminarFotoFisica(?string $filename): void
    {
        if (!$filename) return;

        Storage::disk('public')->delete('perfiles/' . $filename);
        $frontendPath = base_path('../frontend-capacitaciones/public/perfiles/' . $filename);
        File::delete($frontendPath);
    }
}
