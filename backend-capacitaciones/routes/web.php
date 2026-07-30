<?php

use App\Http\Controllers\ArchivoController;
use App\Http\Controllers\EnlaceRegistroController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Sirve los archivos subidos (módulos/noticias/perfiles) pasando por el
// kernel de Laravel para que aplique CORS; ver ArchivoController.
Route::get('/archivos/{path}', [ArchivoController::class, 'servir'])->where('path', '.*');

// uerta de entrada firmada (temporarySignedRoute) del enlace de registro:
// valida firma + expiración y redirige al formulario de registro del frontend.
Route::get('/registro/enlace/{token}', [EnlaceRegistroController::class, 'validar'])
    ->name('registro.enlace.validar')
    ->middleware('signed');
