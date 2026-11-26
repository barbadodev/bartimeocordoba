<?php

namespace App\Http\Controllers;

use App\Bartimeo\Asistencias;
use App\Bartimeo\Retiro;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use stdClass;

final class AsistenciaController
{
    public function __invoke(Request $request, Asistencias $asistencias): JsonResponse
    {
        $retiro = $request->attributes->get(Retiro::class);
        if ($request->isMethod('GET')) {
            return response()->json($asistencias->estado($retiro));
        }
        $estado = json_decode($request->getContent());
        if (! $estado instanceof stdClass) {
            Retiro::error(400, 'Estructura de estado de asistencias inválida.');
        }

        return response()->json($asistencias->guardar($retiro, $estado));
    }
}
