<?php

use App\Http\Controllers\ArchivoController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Sirve los archivos subidos (módulos/noticias/perfiles) pasando por el
// kernel de Laravel para que aplique CORS; ver ArchivoController.
Route::get('/archivos/{path}', [ArchivoController::class, 'servir'])->where('path', '.*');
