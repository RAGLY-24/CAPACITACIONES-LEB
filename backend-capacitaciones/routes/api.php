<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\PuestoController;
use App\Http\Controllers\NoticiaController;
use App\Http\Middleware\CheckSistemasAdmin;

/*
|--------------------------------------------------------------------------
| RUTAS PÚBLICAS
|--------------------------------------------------------------------------
*/
Route::post('login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'me']);

    // Noticias accesibles a usuarios con permisos
    Route::get('/noticias', [NoticiaController::class, 'index']);
    Route::post('/noticias', [NoticiaController::class, 'store']);
    Route::put('/noticias/{id}', [NoticiaController::class, 'update']);
    Route::delete('/noticias/{id}', [NoticiaController::class, 'destroy']);

    // Crear usuario: SistemasAdmin o cualquier usuario con permiso para crear usuarios
    Route::post('/usuarios', [UsuarioController::class, 'store']);

    // Listar usuarios: el usuario debe tener al menos un permiso de gestión de usuarios
    Route::get('/usuarios', [UsuarioController::class, 'index']);

    // Editar usuario: requiere permiso para asignar permisos
    Route::put('/usuarios/{id}', [UsuarioController::class, 'update']);

    // Eliminar usuario: requiere permiso para eliminar usuarios
    Route::delete('/usuarios/{id}', [UsuarioController::class, 'destroy']);
});


/*
|--------------------------------------------------------------------------
| RUTAS PROTEGIDAS (Solo Administradores de Sistemas)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', CheckSistemasAdmin::class])->group(function () {

    // Gestión de puestos
    Route::get('/puestos', [PuestoController::class, 'index']);
    Route::post('/puestos', [PuestoController::class, 'store']);
    Route::put('/puestos/{id}', [PuestoController::class, 'update']);
    Route::delete('/puestos/{id}', [PuestoController::class, 'destroy']);

});