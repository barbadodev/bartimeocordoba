<?php

namespace App\Console\Commands;

use App\Bartimeo\Inscripciones;
use App\Bartimeo\Retiro;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PDO;
use Pdo\Sqlite;
use RuntimeException;
use Throwable;

final class ImportarBartimeo extends Command
{
    protected $signature = 'bartimeo:importar {directorio : Copia de la carpeta ediciones} {--aplicar : Confirmar la importación}';

    protected $description = 'Importa las ediciones SQLite a PostgreSQL sin modificar el origen';

    public function handle(): int
    {
        $directorio = realpath($this->argument('directorio')) ?: $this->argument('directorio');
        $archivos = glob($directorio.'/*/*.db') ?: [];
        if (! extension_loaded('pdo_sqlite') || ! $archivos || ! is_file($directorio.'/cristorey/vii.db')) {
            $this->error('Se requiere pdo_sqlite y una copia con cristorey/vii.db.');

            return self::FAILURE;
        }

        try {
            DB::beginTransaction();
            DB::statement('LOCK TABLE parroquias, ediciones IN SHARE ROW EXCLUSIVE MODE');
            $principal = $this->abrir($directorio.'/cristorey/vii.db');
            foreach ($this->filas($principal, 'parroquias') as $fila) {
                DB::table('parroquias')->insertOrIgnore([
                    'slug' => $fila['slug'], 'nombre' => $fila['nombre'], 'activa' => (bool) $fila['activa'],
                    'creada_en' => $fila['creada_en'],
                ]);
            }
            foreach ($archivos as $archivo) {
                $this->importar($archivo);
            }
            if ($this->option('aplicar')) {
                DB::commit();
                $this->info('Importación confirmada.');
            } else {
                DB::rollBack();
                $this->info('Simulación completada. Usa --aplicar para guardar.');
            }
        } catch (Throwable $error) {
            DB::rollBack();

            $this->error($error instanceof RuntimeException && ! $error instanceof \PDOException
                ? $error->getMessage() : 'No se pudo importar la copia. Se revirtieron los cambios.');

            return self::FAILURE;
        }

        return self::SUCCESS;
    }

    private function abrir(string $archivo): PDO
    {
        $pdo = new PDO('sqlite:'.$archivo, options: [Sqlite::ATTR_OPEN_FLAGS => Sqlite::OPEN_READONLY]);
        $pdo->beginTransaction();

        return $pdo;
    }

    private function filas(PDO $pdo, string $tabla): array
    {
        return $pdo->query('SELECT * FROM '.$tabla)->fetchAll(PDO::FETCH_ASSOC);
    }

    private function importar(string $archivo): void
    {
        $parroquia = basename(dirname($archivo));
        $slug = pathinfo($archivo, PATHINFO_FILENAME);
        if (! Retiro::slugValido($parroquia) || ! Retiro::slugValido($slug) || ! DB::table('parroquias')->where('slug', $parroquia)->exists()) {
            throw new RuntimeException('La copia contiene una parroquia o edición desconocida.');
        }
        $pdo = $this->abrir($archivo);
        $tablas = ['servidores', 'caminantes', 'servicio', 'ediciones', 'catalogos', 'plazas_caminantes',
            'asistencia_state', 'asistencias_detalle', 'solicitudes_idempotencia', 'invitacion_servidores',
            'enlaces_coordinacion', 'credencial_coordinacion'];
        $datos = [];
        foreach ($tablas as $tabla) {
            $consulta = $pdo->prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?");
            $consulta->execute([$tabla]);
            $datos[$tabla] = $consulta->fetchColumn() || in_array($tabla, ['servidores', 'caminantes', 'asistencia_state', 'servicio', 'catalogos', 'ediciones'], true) ? $this->filas($pdo, $tabla) : [];
        }
        $huella = hash('sha256', Retiro::json([$parroquia, $slug, $datos]));
        if (DB::table('importaciones_bartimeo')->where('huella', $huella)->exists()) {
            $this->line("$parroquia/$slug: copia ya importada.");

            return;
        }
        foreach ($datos['ediciones'] as $edicion) {
            $this->edicion($parroquia, $edicion['slug'], $edicion['nombre']);
        }
        $retiro = new Retiro($parroquia, $slug, $this->edicion($parroquia, $slug, strtoupper($slug)));
        if ($retiro->tabla('inscripciones')->exists() || $retiro->tabla('enlaces')->exists() || $retiro->fila()->whereNotNull('asistencias')->exists()) {
            throw new RuntimeException('La edición de destino ya contiene datos. Usa una base nueva.');
        }

        $servicios = array_column($datos['servidores'], null, 'id');
        $porServidor = [];
        foreach ($datos['servicio'] as $servicio) {
            $porServidor[$servicio['servidor_id']][] = $servicio['nombre'];
        }
        foreach ($servicios as $id => $ficha) {
            $ficha['serviciosHechos'] = $porServidor[$id] ?? [];
            $this->inscripcion($retiro, Inscripciones::SERVIDOR, $ficha);
        }
        foreach ($datos['caminantes'] as $ficha) {
            foreach (['primeraVezCristoRey', 'bautismoRecibido', 'primeraComunionRecibida'] as $campo) {
                $ficha[$campo] = isset($ficha[$campo]) ? (bool) $ficha[$campo] : null;
            }
            $ficha['familiaresAdicionales'] = json_decode($ficha['familiaresAdicionales'] ?? '[]', true, 512, JSON_THROW_ON_ERROR);
            $this->inscripcion($retiro, Inscripciones::CAMINANTE, $ficha);
        }

        $retiro->tabla('catalogos')->delete();
        foreach ($datos['catalogos'] as $fila) {
            $fila['activo'] = (bool) $fila['activo'];
            DB::table('catalogos')->insert(['edicion_id' => $retiro->id] + $fila);
        }
        $limites = $datos['plazas_caminantes'][0] ?? [];
        if ($limites) {
            $retiro->fila()->update(array_intersect_key($limites, array_flip(['max_ninos', 'max_ninas', 'max_total'])));
        }
        foreach ($datos['solicitudes_idempotencia'] as $fila) {
            DB::table('solicitudes_idempotencia')->insert(['edicion_id' => $retiro->id] + $fila);
        }
        foreach (['coordinacion' => 'enlaces_coordinacion', 'servidores' => 'invitacion_servidores'] as $tipo => $tabla) {
            foreach ($datos[$tabla] as $fila) {
                DB::table('enlaces')->insert([
                    'edicion_id' => $retiro->id, 'tipo' => $tipo, 'hash' => $fila['hash'],
                    'vence_en' => $fila['vence_en'] ?: null,
                ]);
            }
        }
        if ($slug === Retiro::PUBLICA && ($clave = $datos['credencial_coordinacion'][0] ?? null)) {
            DB::table('parroquias')->where('slug', $parroquia)->whereNull('clave_hash')
                ->update(['clave_hash' => $clave['hash'], 'sal_legada' => $clave['salt']]);
        }
        foreach ($datos['asistencias_detalle'] as $fila) {
            DB::table('asistencias_detalle')->insert(['edicion_id' => $retiro->id] + $fila);
        }
        $marcas = 0;
        if ($estado = $datos['asistencia_state'][0]['data'] ?? null) {
            $asistencia = json_decode($estado, false, 512, JSON_THROW_ON_ERROR);
            $marcas = array_sum(array_map(fn ($reunion) => count((array) $reunion), (array) $asistencia->att));
            $retiro->fila()->update(['asistencias' => $estado, 'revision_asistencias' => $asistencia->revision ?? 0]);
        }
        DB::table('importaciones_bartimeo')->insert(['huella' => $huella, 'importada_en' => now()]);
        $this->line(sprintf('%s/%s: %d servidores, %d caminantes, %d marcas.', $parroquia, $slug, count($servicios), count($datos['caminantes']), $marcas));
    }

    private function edicion(string $parroquia, string $slug, string $nombre): int
    {
        return DB::table('ediciones')->where(compact('parroquia', 'slug'))->value('id')
            ?? Retiro::crearEdicion($parroquia, $slug, $nombre);
    }

    private function inscripcion(Retiro $retiro, string $tipo, array $ficha): void
    {
        $ficha['aceptaRgpd'] = (bool) $ficha['aceptaRgpd'];
        DB::table('inscripciones')->insert(Inscripciones::fila($retiro, $tipo, $ficha));
    }
}
