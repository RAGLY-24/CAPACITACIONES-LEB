<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Puesto extends Model
{
    protected $fillable = ['nombre'];

    public function usuarios()
    {
        return $this->hasMany(User::class);
    }
}
