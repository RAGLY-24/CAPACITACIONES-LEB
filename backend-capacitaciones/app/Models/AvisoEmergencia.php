<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AvisoEmergencia extends Model
{
    protected $table = 'aviso_emergencia';

    protected $fillable = ['mensaje', 'updated_by'];

    public function editor()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
