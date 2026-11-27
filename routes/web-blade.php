<?php

use App\Http\Controllers\AccesoWebController;
use App\Http\Controllers\AsistenciasWebController;
use App\Http\Controllers\InscripcionesWebController;
use App\Http\Controllers\PanelWebController;
use App\Http\Controllers\UsuariosWebController;
use App\Http\Middleware\ContextoBartimeoWeb;
use App\Http\Middleware\SesionCoordinacionWeb;
use Illuminate\Support\Facades\Route;

foreach (['index', 'index.html'] as $alias) {
    Route::redirect('/'.$alias, '/');
}

foreach (['servidores', 'caminantes'] as $alias) {
    Route::redirect('/'.$alias, '/cristorey/'.$alias);
    Route::redirect('/'.$alias.'.html', '/cristorey/'.$alias);
}

foreach (['coordinacion', 'mapa', 'admin'] as $retirada) {
    Route::get('/'.$retirada, fn () => abort(404));
    Route::get('/'.$retirada.'.html', fn () => abort(404));
}

Route::prefix('{parroquia}')->where(['parroquia' => '(?!api(?:/|$))[a-z0-9]+(?:-[a-z0-9]+)*'])->name('bartimeo.')->group(function () {
    Route::view('/', 'index')->name('portada');
    Route::middleware(ContextoBartimeoWeb::class)->group(function () {
        foreach (['caminantes' => 'caminante', 'servidores' => 'servidor'] as $ruta => $tipo) {
            Route::get('/'.$ruta, [InscripcionesWebController::class, 'show'])->defaults('tipo', $tipo)->name($ruta);
            Route::post('/'.$ruta, [InscripcionesWebController::class, 'store'])->defaults('tipo', $tipo)
                ->middleware('throttle:altas')->name($ruta.'.guardar');
        }
        Route::post('/servidores/invitacion', [InscripcionesWebController::class, 'verificarInvitacion'])
            ->defaults('tipo', 'servidor')->middleware('throttle:accesos')->name('servidores.invitacion');
        Route::get('/inscripcion/confirmada/{tipo}', [InscripcionesWebController::class, 'confirmada'])
            ->whereIn('tipo', ['caminante', 'servidor'])->name('confirmada');
    });
});

$claveAplicacion = config('app.key');
if (is_string($claveAplicacion) && $claveAplicacion !== '') {
    $segmento = substr(hash_hmac('sha256', 'bartimeo:administracion', $claveAplicacion), 0, 32);
    Route::prefix($segmento.'/{parroquia}')->where(['parroquia' => '[a-z0-9]+(?:-[a-z0-9]+)*'])->name('bartimeo.')->group(function () {
        Route::get('/coordinacion/acceso', [AccesoWebController::class, 'show'])->name('acceso');
        Route::post('/coordinacion/acceso', [AccesoWebController::class, 'entrar'])->middleware('throttle:accesos')->name('entrar');

        Route::middleware([ContextoBartimeoWeb::class.':gestion', SesionCoordinacionWeb::class])->group(function () {
            Route::get('/mapa', [PanelWebController::class, 'mapa'])->name('mapa');
            Route::get('/coordinacion', [PanelWebController::class, 'show'])->name('panel');
            Route::post('/coordinacion', [PanelWebController::class, 'guardar'])->name('panel.guardar');
            Route::get('/coordinacion/editar/{id?}', [PanelWebController::class, 'editar'])->name('panel.editar');
            Route::get('/coordinacion/exportar', [PanelWebController::class, 'exportar'])->name('panel.exportar');
            Route::post('/coordinacion/salir', [AccesoWebController::class, 'salir'])->name('salir');
            Route::get('/coordinacion/asistencias', [AsistenciasWebController::class, 'show'])->name('asistencias');
            Route::post('/coordinacion/asistencias', [AsistenciasWebController::class, 'guardar'])->name('asistencias.guardar');
            Route::post('/coordinacion/asistencias/importar', [AsistenciasWebController::class, 'importar'])->name('asistencias.importar');
            Route::get('/coordinacion/asistencias/exportar', [AsistenciasWebController::class, 'exportar'])->name('asistencias.exportar');
            Route::get('/coordinacion/asistencias/plantilla', [AsistenciasWebController::class, 'plantilla'])->name('asistencias.plantilla');
            Route::get('/coordinacion/usuarios', [UsuariosWebController::class, 'show'])->name('usuarios');
            Route::post('/coordinacion/usuarios', [UsuariosWebController::class, 'store'])->name('usuarios.crear');
            Route::patch('/coordinacion/usuarios/{usuario}', [UsuariosWebController::class, 'update'])->name('usuarios.editar');
        });
    });
}
