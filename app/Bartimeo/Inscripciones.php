<?php

namespace App\Bartimeo;

use Illuminate\Database\Query\Builder;

final class Inscripciones
{
    public const SERVIDOR = 'servidor';

    public const CAMINANTE = 'caminante';

    public static function consulta(Retiro $retiro, string $tipo): Builder
    {
        return $retiro->tabla('inscripciones')->where('tipo', $tipo);
    }

    public static function lista(Retiro $retiro, string $tipo): array
    {
        return self::consulta($retiro, $tipo)->orderByDesc('fecha_registro')->orderBy('id')
            ->get()->map(self::ficha(...))->all();
    }

    public static function ficha(object $fila): array
    {
        $datos = json_decode($fila->datos, true, 512, JSON_THROW_ON_ERROR);
        if ($fila->tipo === self::CAMINANTE) {
            $datos['anioNacimiento'] = ($datos['anioNacimiento'] ?? null) ?: (((int) substr($datos['fechaNacimiento'] ?? '', 0, 4)) ?: null);
            unset($datos['fechaNacimiento']);
            $datos['genero'] = $fila->genero;
        }

        return ['id' => $fila->id, 'estado' => $fila->estado] + $datos;
    }

    public static function fila(Retiro $retiro, string $tipo, array $datos): array
    {
        return [
            'edicion_id' => $retiro->id,
            'tipo' => $tipo,
            'id' => $datos['id'],
            'fecha_registro' => $datos['fechaRegistro'],
            'estado' => $datos['estado'],
            'genero' => $datos['genero'] ?? '',
            'datos' => Retiro::json(array_diff_key($datos, array_flip(['id', 'estado', 'genero']))),
        ];
    }

    public static function plazas(Retiro $retiro, ?object $edicion = null): array
    {
        $edicion ??= $retiro->fila()->first();
        $limites = ['max_ninos' => $edicion->max_ninos, 'max_ninas' => $edicion->max_ninas, 'max_total' => $edicion->max_total];
        $conteo = self::consulta($retiro, self::CAMINANTE)->where('estado', 'Confirmado')
            ->selectRaw('genero, count(*) AS total')->groupBy('genero')->pluck('total', 'genero');
        $ocupacion = ['total' => $conteo->sum(), 'ninos' => $conteo['nino'] ?? 0, 'ninas' => $conteo['nina'] ?? 0];
        $total = max(0, $limites['max_total'] - $ocupacion['total']);
        $disponibles = ['total' => $total];
        foreach (['ninos', 'ninas'] as $grupo) {
            $disponibles[$grupo] = max(0, min($total, $limites['max_'.$grupo] - $ocupacion[$grupo]));
        }

        return compact('limites', 'ocupacion', 'disponibles');
    }

    public static function comprobarPlaza(Retiro $retiro, object $edicion, string $genero, ?string $excluir = null): void
    {
        $inscritos = self::consulta($retiro, self::CAMINANTE)->where('estado', 'Confirmado')
            ->when($excluir !== null, fn ($q) => $q->where('id', '<>', $excluir));
        $limite = $genero === 'nino' ? $edicion->max_ninos : $edicion->max_ninas;
        if ($inscritos->count() >= $edicion->max_total || ($genero !== '' && $inscritos->where('genero', $genero)->count() >= $limite)) {
            throw new PlazasAgotadas('No quedan plazas disponibles para este grupo.');
        }
    }
}
