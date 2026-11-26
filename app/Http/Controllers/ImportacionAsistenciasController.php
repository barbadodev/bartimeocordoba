<?php

namespace App\Http\Controllers;

use App\Bartimeo\Asistencias;
use App\Bartimeo\Retiro;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ImportacionAsistenciasController
{
    public function __invoke(Request $request, Asistencias $asistencias): JsonResponse
    {
        $request->validate([
            'huella' => ['required', 'string', 'regex:/^[a-f0-9]{64}$/D'],
            'revision' => ['required', 'integer', 'min:0'],
            'members' => ['required', 'array', 'min:1', 'max:500'],
            'members.*.id' => ['required', 'string', 'max:128'],
            'members.*.name' => ['required', 'string', 'max:500'],
            'members.*.tipo' => ['required', 'in:caminante,servidor'],
            'meetings' => ['required', 'array', 'min:1', 'max:50'],
            'meetings.*.id' => ['required', 'string', 'max:128'],
            'meetings.*.date' => ['required', 'date_format:Y-m-d'],
            'meetings.*.tipo' => ['required', 'in:caminante,servidor'],
            'att' => ['required', 'array', 'min:1', 'max:50'],
            'att.*' => ['required', 'array'],
        ]);

        $carga = json_decode($request->getContent());
        if (! is_object($carga)) {
            Retiro::error(400, 'La importación debe enviarse como JSON.');
        }

        $resultado = $asistencias->importarHistorico($request->attributes->get(Retiro::class), $carga);

        return response()->json($resultado, $resultado['yaImportada'] ? 200 : 201);
    }
}