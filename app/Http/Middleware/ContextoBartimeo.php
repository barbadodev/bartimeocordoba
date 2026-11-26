<?php

namespace App\Http\Middleware;

use App\Bartimeo\Retiro;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

final class ContextoBartimeo
{
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->header('Origin');
        $permitidos = config('bartimeo.origenes');
        if ($origin && ! in_array($origin, $permitidos, true)) {
            Retiro::error(403, 'Origen no autorizado.');
        }

        $parroquia = strtolower($request->header('X-Parroquia', 'cristorey'));
        if (! Retiro::slugValido($parroquia)) {
            Retiro::error(400, 'Identificador de parroquia no válido.');
        }
        if (! DB::table('parroquias')->where('slug', $parroquia)->where('activa', true)->exists()) {
            Retiro::error(404, 'Parroquia no encontrada.');
        }

        $altaPublica = $request->isMethod('POST') && $request->is('api/caminantes', 'api/servidores', 'api/servidores/invitacion');
        $edicion = $altaPublica ? Retiro::PUBLICA : ($request->header('X-Edicion') ?: Retiro::PUBLICA);
        $id = Retiro::slugValido($edicion)
            ? DB::table('ediciones')->where(compact('parroquia'))->where('slug', $edicion)->value('id')
            : null;
        if ($id === null) {
            Retiro::error(404, 'Edición no encontrada.');
        }

        $request->attributes->set(Retiro::class, new Retiro($parroquia, $edicion, $id));

        return $next($request);
    }
}
