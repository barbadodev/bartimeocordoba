<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->convertEmptyStringsToNull(except: [fn (Request $request) => $request->is('api/*')]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*', 'health') || $request->expectsJson());

        $exceptions->render(function (HttpExceptionInterface $error, Request $request) {
            if (! $request->is('api/*', 'health')) {
                return null;
            }
            $status = $error->getStatusCode();

            return response()->json([
                'error' => $status >= 500 ? 'Servicio temporalmente no disponible.' : ($error->getMessage() ?: Response::$statusTexts[$status]),
            ], $status, $error->getHeaders());
        });
        $exceptions->respond(function (Response $response) {
            if (request()->is('api/*', 'health')) {
                $response->headers->set('Cache-Control', 'no-store');
            }
            $response->headers->set('X-Content-Type-Options', 'nosniff');

            return $response;
        });
    })->create();
