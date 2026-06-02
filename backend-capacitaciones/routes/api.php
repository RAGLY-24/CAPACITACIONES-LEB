<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UsuarioController;
// Importamos tu middleware personalizado de seguridad
use App\Http\Middleware\CheckSistemasAdmin;

/*
|--------------------------------------------------------------------------
| RUTAS PÚBLICAS
|--------------------------------------------------------------------------
*/
Route::post('login', [AuthController::class, 'login']);


/*
|--------------------------------------------------------------------------
| RUTAS PROTEGIDAS (Solo Administradores de Sistemas)
|--------------------------------------------------------------------------
*/
// Encapsulamos las rutas dentro de un grupo con los dos candados de seguridad
Route::middleware(['auth:sanctum', CheckSistemasAdmin::class])->group(function () {

    // Listar usuarios
    Route::get('/usuarios', [UsuarioController::class, 'index']);
    
    // Crear usuario
    Route::post('/usuarios', [UsuarioController::class, 'store']);
    
    // Editar usuario
    Route::put('/usuarios/{id}', [UsuarioController::class, 'update']);
    
    // Eliminar usuario
    Route::delete('/usuarios/{id}', [UsuarioController::class, 'destroy']);

});