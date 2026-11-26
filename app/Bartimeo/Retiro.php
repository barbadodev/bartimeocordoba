<?php

namespace App\Bartimeo;

use Closure;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

final readonly class Retiro
{
    public const PUBLICA = 'vii';

    public const CATALOGOS = [
        'talla_caminante' => ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        'talla_ropa' => ['Ya tengo', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
        'servicio' => ['Mesa', 'Snack', 'Santísimo', 'Música'],
    ];

    public function __construct(public string $parroquia, public string $edicion, public int $id) {}

    public static function slugValido(string $slug): bool
    {
        return strlen($slug) <= 48 && preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $slug) === 1;
    }

    public static function crearEdicion(string $parroquia, string $slug, string $nombre): int
    {
        $id = DB::table('ediciones')->insertGetId(compact('parroquia', 'slug', 'nombre'));

        foreach (self::CATALOGOS as $tipo => $valores) {
            DB::table('catalogos')->insert(array_map(fn ($valor, $orden) => [
                'edicion_id' => $id, 'tipo' => $tipo, 'valor' => $valor, 'orden' => $orden, 'activo' => true,
            ], $valores, array_keys($valores)));
        }

        return $id;
    }

    public function tabla(string $tabla): Builder
    {
        return DB::table($tabla)->where('edicion_id', $this->id);
    }

    public function fila(): Builder
    {
        return DB::table('ediciones')->where('id', $this->id);
    }

    public function escribir(Closure $operacion): mixed
    {
        return DB::transaction(function () use ($operacion) {
            // Una edición tiene un único punto de escritura para aforos, reintentos y revisiones.
            $fila = $this->fila()->lockForUpdate()->first();

            return $operacion($fila);
        });
    }

    public function catalogo(string $tipo, bool $soloActivos = false): array
    {
        return $this->tabla('catalogos')->where('tipo', $tipo)
            ->when($soloActivos, fn (Builder $query) => $query->where('activo', true))
            ->orderBy('orden')->orderBy('valor')->get(['valor', 'activo', 'orden'])->all();
    }

    public function valores(string $tipo): array
    {
        return array_column($this->catalogo($tipo, true), 'valor');
    }

    public static function json(mixed $datos): string
    {
        return json_encode($datos, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }

    public static function ahoraMs(): int
    {
        return now()->getTimestampMs();
    }

    public static function error(int $status, string $mensaje): never
    {
        throw new HttpException($status, $mensaje);
    }
}
