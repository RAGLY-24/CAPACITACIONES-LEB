<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\PuestoController;
use App\Http\Controllers\NoticiaController;
use App\Http\Controllers\CursoController;
use App\Http\Controllers\ModuloController;
use App\Http\Controllers\PreguntaController;
use App\Http\Controllers\ExamenController;
use App\Http\Controllers\ProgresoController;
use App\Http\Controllers\SeccionController;
use App\Http\Controllers\PerfilController;
use App\Http\Controllers\SocioController;
use App\Http\Controllers\AvisoEmergenciaController;
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

    // Perfil propio del usuario autenticado
    Route::post('/perfil', [PerfilController::class, 'update']); // POST+_method por multipart/form-data

    // Noticias accesibles a usuarios con permisos
    Route::get('/noticias', [NoticiaController::class, 'index']);
    Route::post('/noticias', [NoticiaController::class, 'store']);
    Route::put('/noticias/{id}', [NoticiaController::class, 'update']);
    Route::delete('/noticias/{id}', [NoticiaController::class, 'destroy']);

    // Aviso de emergencia fijo en la sección de Noticias
    Route::get('/aviso-emergencia', [AvisoEmergenciaController::class, 'show']);
    Route::put('/aviso-emergencia', [AvisoEmergenciaController::class, 'update']);

    // Cursos - Gestión del módulo de Capacitaciones
    Route::get('/cursos', [CursoController::class, 'index']);
    Route::post('/cursos', [CursoController::class, 'store']);
    Route::get('/cursos/{id}', [CursoController::class, 'show']);
    Route::put('/cursos/{id}', [CursoController::class, 'update']);
    Route::delete('/cursos/{id}', [CursoController::class, 'destroy']);

    // Crear usuario: SistemasAdmin o cualquier usuario con permiso para crear usuarios
    Route::post('/usuarios', [UsuarioController::class, 'store']);

    // Listar usuarios: el usuario debe tener al menos un permiso de gestión de usuarios
    Route::get('/usuarios', [UsuarioController::class, 'index']);

    // Editar usuario: requiere permiso para asignar permisos
    Route::put('/usuarios/{id}', [UsuarioController::class, 'update']);

    // Eliminar usuario: requiere permiso para eliminar usuarios
    Route::delete('/usuarios/{id}', [UsuarioController::class, 'destroy']);

    // --- SOCIOS ---
    Route::get('/socios', [SocioController::class, 'index']);
    Route::post('/socios', [SocioController::class, 'store']);
    Route::put('/socios/{id}', [SocioController::class, 'update']);
    Route::delete('/socios/{id}', [SocioController::class, 'destroy']);

    // --- SECCIONES ---
    Route::get('/secciones', [SeccionController::class, 'index']);
    Route::post('/secciones', [SeccionController::class, 'store']);
    Route::put('/secciones/{id}', [SeccionController::class, 'update']);
    Route::delete('/secciones/{id}', [SeccionController::class, 'destroy']);

    // --- MÓDULOS DE CAPACITACIÓN ---
    Route::get('/modulos', [ModuloController::class, 'index']);
    Route::get('/modulos/{id}', [ModuloController::class, 'show']);
    Route::post('/modulos', [ModuloController::class, 'store']);
    Route::post('/modulos/{id}/update', [ModuloController::class, 'update']); // POST+_method por multipart/form-data
    Route::put('/modulos/{id}/presentacion', [ModuloController::class, 'guardarPresentacion']);
    Route::delete('/modulos/{id}', [ModuloController::class, 'destroy']);

    // --- PREGUNTAS DE EXAMEN (solo admin) ---
    Route::get('/modulos/{id}/preguntas', [PreguntaController::class, 'index']);
    Route::post('/modulos/{id}/preguntas', [PreguntaController::class, 'store']);
    Route::put('/preguntas/{id}', [PreguntaController::class, 'update']);
    Route::delete('/preguntas/{id}', [PreguntaController::class, 'destroy']);

    // --- EXAMEN (empleados) ---
    Route::get('/modulos/{id}/examen', [ExamenController::class, 'getExamen']);
    Route::post('/modulos/{id}/examen', [ExamenController::class, 'submit']);
    Route::get('/modulos/{id}/examen/retroalimentacion', [ExamenController::class, 'retroalimentacion']);

    // --- PROGRESO ---
    Route::post('/modulos/{id}/iniciar', [ProgresoController::class, 'iniciar']);
    Route::get('/progreso/mio', [ProgresoController::class, 'miProgreso']);
    Route::get('/progreso/admin', [ProgresoController::class, 'resumenAdmin']);
    Route::get('/progreso/por-seccion', [ProgresoController::class, 'porSeccion']);
    Route::get('/progreso/{id}/retroalimentacion', [ProgresoController::class, 'retroalimentacionAdmin']);
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