<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ArchivoStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PerfilController extends Controller
{
    private ArchivoStorageService $archivos;

    public function __construct(ArchivoStorageService $archivos)
    {
        $this->archivos = $archivos;
    }

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
        return $this->archivos->guardar($file, 'perfiles', 'perfil_');
    }

    private function eliminarFotoFisica(?string $filename): void
    {
        $this->archivos->eliminar($filename, 'perfiles');
    }
}
