<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$raiz = dirname(__DIR__);
$privado = is_file($raiz.'/artisan') ? $raiz : $raiz.'/bartimeo-app';

if (file_exists($maintenance = $privado.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $privado.'/vendor/autoload.php';

/** @var Application $app */
$app = require_once $privado.'/bootstrap/app.php';
$app->usePublicPath(__DIR__);
$app->handleRequest(Request::capture());
