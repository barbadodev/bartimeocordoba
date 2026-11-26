<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

final class RetiroController
{
    public function informacion(string $tipo): JsonResponse
    {
        $info = json_decode(file_get_contents(resource_path('datos/retiro.json')), true, 512, JSON_THROW_ON_ERROR);
        $retiro = $info[$tipo];
        $contactos = fn (array $lista) => array_map(fn ($contacto) => ['nombre' => $contacto['nombre'], 'telefono' => $contacto['tel']], $lista);

        return response()->json($retiro + [
            'comienzo' => $retiro['horarioComienzo'], 'final' => $retiro['horarioClausura'], 'emailContacto' => $info['email'],
            'coordinadoresJovenes' => $contactos($info['coordinadoresJovenes']), 'coordinadoresAdultos' => $contactos($info['coordinadoresAdultos']),
        ]);
    }

    public function salud(): JsonResponse
    {
        DB::selectOne('SELECT 1');

        return response()->json([
            'status' => 'ok', 'servicio' => 'Bartimeo Córdoba',
            'database' => 'PostgreSQL', 'timestamp' => now()->toISOString(),
        ]);
    }
}
