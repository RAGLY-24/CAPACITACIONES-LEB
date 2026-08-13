<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

// Centraliza cómo se guardan/eliminan/mueven los archivos subidos (módulos,
// noticias, fotos de perfil) en el disco "public", para que cada controlador
// no repita la misma lógica de storeAs/delete. El identificador que vive en
// la base de datos es siempre solo el nombre de archivo; la carpeta se
// resuelve aparte según el origen (sección, noticia, perfil, etc.).
class ArchivoStorageService
{
    // Tope de peso final de cualquier imagen guardada en la plataforma.
    private const MAX_IMAGEN_BYTES = 5 * 1024 * 1024; // 5 MB

    public function guardar(UploadedFile $file, string $carpeta, string $prefijo = ''): string
    {
        $ext = $file->getClientOriginalExtension();
        $filename = $prefijo . time() . '_' . Str::random(8) . '.' . $ext;
        $file->storeAs($carpeta, $filename, 'public');

        return $filename;
    }

    // Guarda una imagen comprimiéndola si hace falta para que nunca pese más
    // de 5 MB: si ya entra en el límite se guarda tal cual (sin recodificar,
    // para no perder calidad de balde); si no, se reencoda a JPEG bajando la
    // calidad y, si aun así no alcanza, reduciendo dimensiones, hasta que
    // el resultado quepa en el límite.
    public function guardarImagen(UploadedFile $file, string $carpeta, string $prefijo = ''): string
    {
        if ($file->getSize() <= self::MAX_IMAGEN_BYTES) {
            return $this->guardar($file, $carpeta, $prefijo);
        }

        $manager = new ImageManager(new Driver());
        $image = $manager->read($file->getRealPath());

        $quality = 85;
        $encoded = (string) $image->toJpeg($quality);
        $intentos = 0;

        while (strlen($encoded) > self::MAX_IMAGEN_BYTES && $intentos < 15) {
            if ($quality > 35) {
                $quality -= 10;
            } else {
                $image->scale(width: (int) ($image->width() * 0.8));
            }

            $encoded = (string) $image->toJpeg($quality);
            $intentos++;
        }

        $filename = $prefijo . time() . '_' . Str::random(8) . '.jpg';
        Storage::disk('public')->put($carpeta . '/' . $filename, $encoded);

        return $filename;
    }

    public function eliminar(?string $filename, string $carpeta): void
    {
        if (!$filename) return;

        Storage::disk('public')->delete($carpeta . '/' . $filename);
    }

    // Reubica un archivo ya guardado cuando cambia su carpeta de origen
    // (p. ej. un módulo se mueve a otra sección).
    public function mover(?string $filename, string $carpetaOrigen, string $carpetaDestino): void
    {
        if (!$filename || $carpetaOrigen === $carpetaDestino) return;

        $disk = Storage::disk('public');
        $origen = $carpetaOrigen . '/' . $filename;
        if ($disk->exists($origen)) {
            $disk->move($origen, $carpetaDestino . '/' . $filename);
        }
    }

    // Construye la URL a través de /archivos/... (ArchivoController), no del
    // symlink de /storage/..., para que la respuesta pase por el kernel de
    // Laravel y así lleve las cabeceras CORS.
    public function urlPublica(?string $filename, string $carpeta): ?string
    {
        if (!$filename) return null;

        return url('archivos/' . $carpeta . '/' . $filename);
    }

    // Nombre de carpeta legible y estable para agrupar los archivos de una
    // sección: "5-seguridad-basica". Si no hay sección, todo cae en "sin-seccion".
    public function carpetaSeccion(?int $seccionId, ?string $seccionNombre): string
    {
        if (!$seccionId) return 'sin-seccion';

        $slug = Str::slug($seccionNombre) ?: 'seccion';
        return "{$seccionId}-{$slug}";
    }
}
