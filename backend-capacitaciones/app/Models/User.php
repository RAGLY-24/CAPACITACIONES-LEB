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
    ];

    // foto en la BD es solo el nombre del archivo; el frontend debe usar
    // esta URL calculada para mostrarla.
    protected $appends = ['foto_url'];

    protected function fotoUrl(): Attribute
    {
        return Attribute::get(fn () => (new ArchivoStorageService())->urlPublica($this->foto, 'perfiles'));
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->puesto?->nombre === 'SistemasAdmin') {
            return true;
        }

        return data_get($this->permissions, $permission, false) === true;
    }

    public function canAccessNews(): bool
    {
        if ($this->puesto?->nombre === 'SistemasAdmin') {
            return true;
        }

        return data_get($this->permissions, 'news_access', true) !== false;
    }

    public function canManageNews(): bool
    {
        if ($this->puesto?->nombre === 'SistemasAdmin') {
            return true;
        }

        return data_get($this->permissions, 'manage_news', false) === true;
    }

    public function canEditCapacitaciones(): bool
    {
        if ($this->puesto?->nombre === 'SistemasAdmin') {
            return true;
        }

        return data_get($this->permissions, 'edit_capacitaciones_course', false) === true;
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
