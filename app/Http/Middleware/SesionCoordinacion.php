<?php

namespace App\Http\Middleware;

use App\Bartimeo\Retiro;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

final class SesionCoordinacion
{
    public function handle(Request $request, Closure $next): Response
    {
        $retiro = $request->attributes->get(Retiro::class);
        $token = $request->bearerToken() ?? '';
        $hash = hash('sha256', $token);

        if (! preg_match('/^[a-f0-9]{64}$/D', $token) || ! DB::table('sesiones_coordinacion')
            ->where('token_hash', $hash)->where('parroquia', $retiro->parroquia)->where('vence_en', '>', now())->exists()) {
            Retiro::error(401, 'Acceso no autorizado. Este recurso está reservado a coordinación.');
        }

        $request->attributes->set('sesion_coordinacion', $hash);

        return $next($request);
    }
}
