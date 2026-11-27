<?php

namespace App\Http\Middleware;

use App\Bartimeo\Retiro;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

final class SesionCoordinacionWeb
{
    public function handle(Request $request, Closure $next): Response
    {
        $retiro = $request->attributes->get(Retiro::class);
        $guard = Auth::guard('web');
        $usuario = $guard->user();
        $hash = $request->session()->get('bartimeo.password');

        if (! $usuario || ! $usuario->activo || ! is_string($hash) || ! hash_equals($usuario->huellaDeAcceso(), $hash)) {
            if ($usuario) {
                $guard->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return redirect()->route('bartimeo.acceso', [
                'parroquia' => $retiro->parroquia,
                'destino' => $request->routeIs('bartimeo.mapa') ? 'mapa' : 'panel',
            ]);
        }

        abort_unless($usuario->administrador || $usuario->parroquia === $retiro->parroquia, 403);
        $respuesta = $next($request);
        $respuesta->headers->set('Cache-Control', 'private, no-store');
        $respuesta->headers->set('Referrer-Policy', 'no-referrer');

        return $respuesta;
    }
}
