<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->throttleApi();

        // Sin esto, detrás del reverse proxy/balanceador de producción que
        // termina TLS, Request::isSecure() siempre da false y url() genera
        // enlaces http:// (p. ej. el PDF de un módulo) aunque el sitio se
        // sirva por https, lo que el navegador bloquea como "mixed content".
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
