<?php

use App\Http\Controllers\RetiroController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [RetiroController::class, 'salud'])->withoutMiddleware('web');
Route::view('/', 'index');

require __DIR__.'/web-blade.php';
