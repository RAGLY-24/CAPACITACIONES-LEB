<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;

// Sirve los archivos del disco "public" (módulos, noticias, perfiles) a
// través del kernel de Laravel en vez del symlink estático de public/storage,
// para que el middleware de CORS se aplique (el servidor embebido de
// `artisan serve`, y algunos servidores en producción, sirven los archivos
// del symlink directamente sin pasar por Laravel).
class ArchivoController extends Controller
{
    public function servir(string $path)
    {
        // Evita salirse del disco público (p. ej. "../../.env").
        if (str_contains($path, '..')) {
            abort(404);
        }

        $disk = Storage::disk('public');
        if (!$disk->exists($path)) {
            abort(404);
        }

        return response()->file($disk->path($path));
    }
}
