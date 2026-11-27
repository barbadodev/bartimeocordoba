<?php

namespace App\Http\Controllers;

use App\Bartimeo\Asistencias;
use App\Bartimeo\Retiro;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

final class ImportarPersonasAsistenciaController
{
    public function __invoke(Request $request, Asistencias $asistencias): JsonResponse
    {
        $datos = $request->validate([
            'revision' => ['required', 'integer', 'min:0'],
            'personas' => ['required', 'array', 'min:1', 'max:500'],
            'personas.*.name' => ['required', 'string', 'max:500', 'not_regex:/\x00/'],
            'personas.*.tipo' => ['required', 'in:caminante,servidor'],
            'personas.*.foraneo' => ['required', 'boolean'],
        ]);
        $retiro = $request->attributes->get(Retiro::class);
        $resultado = $retiro->escribir(function ($edicion) use ($retiro, $asistencias, $datos) {
            $estado = $asistencias->estado($retiro, $edicion);
            if ($estado['revision'] !== $datos['revision']) {
                Retiro::error(409, 'Las asistencias cambiaron. Recarga antes de importar.');
            }
            $clave = fn ($nombre, $caminante) => ($caminante ? 'c:' : 's:').mb_strtolower(preg_replace('/\s+/u', ' ', trim($nombre)));
            $indices = [];
            foreach ($estado['members'] as $indice => $miembro) {
                $indices[$clave($miembro['name'], ! empty($miembro['caminante']))][] = $indice;
            }
            $vistos = [];
            foreach ($datos['personas'] as $persona) {
                $nombre = trim($persona['name']);
                $caminante = $persona['tipo'] === 'caminante';
                $id = $clave($nombre, $caminante);
                if ($nombre === '' || isset($vistos[$id]) || count($indices[$id] ?? []) > 1) {
                    Retiro::error(422, 'Hay nombres vacíos o duplicados en un grupo. Revisa el Excel.');
                }
                $vistos[$id] = true;
                if (isset($indices[$id])) {
                    $estado['members'][$indices[$id][0]]['foraneo'] = $persona['foraneo'];
                } else {
                    $estado['members'][] = ['id' => (string) Str::uuid(), 'name' => $nombre, 'caminante' => $caminante, 'foraneo' => $persona['foraneo'], 'historicoImportado' => true, 'inscritoActivo' => false, 'inscripcionId' => null, 'motivoExcepcion' => null, 'reunionExcepcionId' => null];
                }
            }
            $estado['revision']++;
            $retiro->fila()->update(['revision_asistencias' => $estado['revision'], 'asistencias' => Retiro::json($estado)]);

            return ['success' => true];
        });

        return response()->json($resultado);
    }
}
