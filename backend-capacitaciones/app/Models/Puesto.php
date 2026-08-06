<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Puesto extends Model
{
    protected $fillable = ['nombre', 'default_permissions'];

    protected $casts = [
        'default_permissions' => 'array',
    ];

    public function usuarios()
    {
        return $this->hasMany(User::class);
    }
}
