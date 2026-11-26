<?php

use App\Bartimeo\Inscripciones;
use App\Http\Controllers\AsistenciaController;
use App\Http\Controllers\ConfiguracionController;
use App\Http\Controllers\CoordinacionController;
use App\Http\Controllers\InscripcionController;
use App\Http\Controllers\RetiroController;
use App\Http\Middleware\ContextoBartimeo;
use App\Http\Middleware\SesionCoordinacion;
use Illuminate\Support\Facades\Route;

Route::middleware(ContextoBartimeo::class)->group(function () {
    Route::get('parroquias', [ConfiguracionController::class, 'parroquias']);
    Route::get('catalogos', [ConfiguracionController::class, 'catalogos']);
    Route::get('plazas/caminantes', [ConfiguracionController::class, 'plazas']);
    Route::get('info', [RetiroController::class, 'informacion'])->defaults('tipo', 'servidores');
    Route::get('info/caminantes', [RetiroController::class, 'informacion'])->defaults('tipo', 'caminantes');
    Route::get('keepalive', [RetiroController::class, 'salud']);
    Route::get('salud', [RetiroController::class, 'salud']);

    Route::middleware('throttle:accesos')->group(function () {
        Route::post('coordinacion/login', [CoordinacionController::class, 'login']);
        Route::post('coordinacion/enlaces/canjear', [CoordinacionController::class, 'canjear']);
        Route::post('servidores/invitacion', [CoordinacionController::class, 'verificarInvitacion']);
    });

    foreach (['servidores' => Inscripciones::SERVIDOR, 'caminantes' => Inscripciones::CAMINANTE] as $ruta => $tipo) {
        Route::post($ruta, [InscripcionController::class, 'alta'])->defaults('tipo', $tipo)->middleware('throttle:altas');
    }

    Route::middleware(SesionCoordinacion::class)->group(function () {
        Route::get('coordinacion/verificar', [CoordinacionController::class, 'verificar']);
        Route::post('coordinacion/logout', [CoordinacionController::class, 'logout']);
        Route::post('coordinacion/enlaces', [CoordinacionController::class, 'enlace']);
        Route::match(['get', 'post', 'delete'], 'coordinacion/invitacion-servidores', [CoordinacionController::class, 'invitacion']);
        Route::post('parroquias', [ConfiguracionController::class, 'crearParroquia']);
        Route::patch('parroquias/{slug}', [ConfiguracionController::class, 'actualizarParroquia']);
        Route::match(['get', 'post'], 'ediciones', [ConfiguracionController::class, 'ediciones']);
        Route::get('catalogos/gestion', [ConfiguracionController::class, 'catalogos']);
        Route::put('catalogos/{tipo}', [ConfiguracionController::class, 'guardarCatalogo']);
        Route::put('plazas/caminantes', [ConfiguracionController::class, 'plazas']);
        Route::match(['get', 'post'], 'asistencias/state', AsistenciaController::class);
        Route::match(['get', 'post'], 'state', AsistenciaController::class);
        Route::get('metricas', [InscripcionController::class, 'metricas'])->defaults('tipo', Inscripciones::SERVIDOR);
        Route::get('metricas/caminantes', [InscripcionController::class, 'metricas'])->defaults('tipo', Inscripciones::CAMINANTE);
        foreach (['servidores' => Inscripciones::SERVIDOR, 'caminantes' => Inscripciones::CAMINANTE] as $ruta => $tipo) {
            Route::get($ruta, [InscripcionController::class, 'listar'])->defaults('tipo', $tipo);
            Route::patch($ruta.'/{id}', [InscripcionController::class, 'editar'])->defaults('tipo', $tipo);
            Route::delete($ruta.'/{id}', [InscripcionController::class, 'borrar'])->defaults('tipo', $tipo);
        }
    });
});
