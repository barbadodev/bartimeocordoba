<?php

use App\Http\Controllers\RetiroController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [RetiroController::class, 'salud'])->withoutMiddleware('web');
Route::view('/', 'index');
Route::view('/index.html', 'index');

foreach (['servidores' => 'index', 'caminantes' => 'caminantes', 'coordinacion' => 'coordinacion', 'admin' => 'coordinacion', 'mapa' => 'mapa'] as $ruta => $vista) {
    Route::view('/'.$ruta, $vista);
    Route::view('/'.$ruta.'.html', $vista);
    Route::view('/{parroquia}/'.$ruta, $vista)->where('parroquia', '(?!api/)[a-z0-9]+(?:-[a-z0-9]+)*');
}

Route::view('/{parroquia}', 'index')->where('parroquia', '(?!api$)[a-z0-9]+(?:-[a-z0-9]+)*');
