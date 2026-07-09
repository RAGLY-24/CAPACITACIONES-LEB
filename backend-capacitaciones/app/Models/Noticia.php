<?php

namespace App\Models;

use App\Services\ArchivoStorageService;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Noticia extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'body',
        'evidence',
        'file_paths',
        'created_by',
    ];

    protected $casts = [
        'file_paths' => 'array',
    ];

    // file_paths en la BD son solo los nombres de archivo; el frontend debe
    // usar estas URLs calculadas para mostrarlos.
    protected $appends = ['file_urls'];

    public function author()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    protected function fileUrls(): Attribute
    {
        return Attribute::get(function () {
            $servicio = new ArchivoStorageService();
            return collect($this->file_paths ?? [])
                ->map(fn ($filename) => $servicio->urlPublica($filename, 'noticias'))
                ->all();
        });
    }
}
