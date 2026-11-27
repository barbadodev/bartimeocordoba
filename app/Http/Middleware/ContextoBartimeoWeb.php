<?php

namespace App\Http\Middleware;

use App\Bartimeo\Retiro;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

final class ContextoBartimeoWeb
{
    public function handle(Request $request, Closure $next, string $ambito = 'publico'): Response
    {
        $parroquia = (string) $request->route('parroquia', 'cristorey');
        $edicion = $ambito === 'gestion' ? $request->query('edicion', Retiro::PUBLICA) : Retiro::PUBLICA;

        abort_unless(Retiro::slugValido($parroquia) && is_string($edicion) && Retiro::slugValido($edicion), 404);

        $id = DB::table('ediciones')
            ->join('parroquias', 'parroquias.slug', '=', 'ediciones.parroquia')
            ->where('ediciones.parroquia', $parroquia)
            ->where('ediciones.slug', $edicion)
            ->where('parroquias.activa', true)
            ->value('ediciones.id');

        abort_if($id === null, 404);

        $request->attributes->set(Retiro::class, new Retiro($parroquia, $edicion, $id));

        return $next($request);
    }
}
