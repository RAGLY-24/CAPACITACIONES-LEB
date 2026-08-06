<?php

namespace App\Models;

use App\Services\ArchivoStorageService;
use Laravel\Sanctum\HasApiTokens;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'lastname',
        'email',
        'password',
        'usuario',
        'estado',
        'puesto_id',
        'socio_id',
        'permissions',
        'descripcion',
        'foto',
        'es_operador',
        'operador_nombre_completo',
        'operador_numero_economico_tractor',
        'operador_placas_remolque',
        'operador_folio',
        'operador_numero_licencia',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'permissions' => 'array',
        'es_operador' => 'boolean',
    ];

    // foto en la BD es solo el nombre del archivo; el frontend debe usar
    // esta URL calculada para mostrarla.
    protected $appends = ['foto_url'];

    protected function fotoUrl(): Attribute
    {
        return Attribute::get(fn () => (new ArchivoStorageService())->urlPublica($this->foto, 'perfiles'));
    }

    // Resuelve un permiso en cascada: el override explícito del usuario
    // manda; si el usuario nunca tocó esa llave, se hereda el default del
    // puesto (rol). Así, cambiar los defaults de un rol afecta de inmediato
    // a cualquier usuario de ese rol que no tenga un permiso especial dado
    // a mano.
    public function hasPermission(string $permission): bool
    {
        if ($this->puesto?->nombre === 'SistemasAdmin') {
            return true;
        }

        if (is_array($this->permissions) && array_key_exists($permission, $this->permissions)) {
            return $this->permissions[$permission] === true;
        }

        return data_get($this->puesto?->default_permissions, $permission, false) === true;
    }

    // A diferencia de los demás permisos (opt-in, default false), el acceso
    // a noticias es opt-out: si nadie lo definió ni a nivel usuario ni a
    // nivel rol, se asume otorgado.
    public function canAccessNews(): bool
    {
        if ($this->puesto?->nombre === 'SistemasAdmin') {
            return true;
        }

        if (is_array($this->permissions) && array_key_exists('news_access', $this->permissions)) {
            return $this->permissions['news_access'] !== false;
        }

        return data_get($this->puesto?->default_permissions, 'news_access', true) !== false;
    }

    public function canManageNews(): bool
    {
        return $this->hasPermission('manage_news');
    }

    public function puesto()
    {
        return $this->belongsTo(Puesto::class);
    }

    public function socio()
    {
        return $this->belongsTo(Socio::class);
    }
}
