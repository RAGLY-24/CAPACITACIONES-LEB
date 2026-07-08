<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Database\Factories\UserFactory;
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
}
