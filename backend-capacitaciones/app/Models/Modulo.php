<?php

namespace App\Models;

use App\Services\ArchivoStorageService;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class Modulo extends Model
{
    protected $fillable = ['seccion_id', 'orden', 'nombre', 'descripcion', 'estado', 'file_path', 'file_type', 'imagen', 'presentacion_json', 'created_by', 'prerequisite_module_id'];

    // file_path/imagen en la BD son solo el nombre del archivo; estas URLs
    // calculadas son las que debe usar el frontend para mostrarlo/descargarlo.
    protected $appends = ['file_url', 'imagen_url'];

    public function preguntas()
    {
        return $this->hasMany(Pregunta::class)->orderBy('orden');
    }

    public function seccion()
    {
        return $this->belongsTo(Seccion::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function requisito()
    {
        return $this->belongsTo(Modulo::class, 'prerequisite_module_id');
    }

    public function dependientes()
    {
        return $this->hasMany(Modulo::class, 'prerequisite_module_id');
    }

    public function progresos()
    {
        return $this->hasMany(ProgresoModulo::class);
    }

    protected static ?array $seccionNombresCache = null;

    // Nombre de la sección de este módulo, memoizado por request (una sola
    // consulta para todas las secciones en vez de un lazy-load por módulo).
    protected static function nombreSeccion(?int $seccionId): ?string
    {
        if ($seccionId === null) return null;

        self::$seccionNombresCache ??= Seccion::pluck('nombre', 'id')->all();

        return self::$seccionNombresCache[$seccionId] ?? null;
    }

    // Carpeta física donde deben vivir el archivo y la imagen de este módulo,
    // agrupada por sección: "modulos/{id}-{nombre-sección}" o "modulos/sin-seccion".
    public function carpeta(): string
    {
        $servicio = new ArchivoStorageService();
        return 'modulos/' . $servicio->carpetaSeccion($this->seccion_id, self::nombreSeccion($this->seccion_id));
    }

    protected function fileUrl(): Attribute
    {
        return Attribute::get(fn () => (new ArchivoStorageService())->urlPublica($this->file_path, $this->carpeta()));
    }

    protected function imagenUrl(): Attribute
    {
        return Attribute::get(fn () => (new ArchivoStorageService())->urlPublica($this->imagen, $this->carpeta()));
    }

    protected static ?\Illuminate\Support\Collection $ordenGlobalCache = null;

    // Todos los módulos activos, en el orden en que deben cursarse (sección.orden, luego módulo.orden).
    // Memoizado por request: esta consulta se pedía antes en cada llamada a estaBloqueadoPara().
    public static function ordenGlobal()
    {
        if (self::$ordenGlobalCache !== null) {
            return self::$ordenGlobalCache;
        }

        return self::$ordenGlobalCache = self::where('estado', 'Activo')
            ->whereHas('seccion', fn($q) => $q->where('estado', 'Activo'))
            ->with('seccion')
            ->get()
            ->sortBy(fn($m) => sprintf('%05d-%05d', $m->seccion->orden, $m->orden))
            ->values();
    }

    public function moduloAnterior(): ?self
    {
        $orden = self::ordenGlobal();
        $idx = $orden->search(fn($m) => $m->id === $this->id);
        if ($idx === false || $idx === 0) {
            return null;
        }
        return $orden[$idx - 1];
    }

    // El módulo que debe aprobarse antes de este: el prerrequisito explícito
    // definido por el administrador si existe, o si no, el anterior en el
    // orden del curso (comportamiento por defecto).
    public function moduloRequeridoPara(): ?self
    {
        return $this->prerequisite_module_id
            ? $this->requisito
            : $this->moduloAnterior();
    }

    // Un módulo está bloqueado si su módulo requerido tiene examen y el
    // usuario aún no lo ha aprobado (calificación mínima 70%).
    public function estaBloqueadoPara(User $user): bool
    {
        $requerido = $this->moduloRequeridoPara();
        if (!$requerido) {
            return false;
        }

        if ($requerido->preguntas()->count() === 0) {
            return false;
        }

        $progreso = $requerido->progresos()->where('user_id', $user->id)->first();

        return !($progreso && $progreso->estado === 'completado');
    }
}
