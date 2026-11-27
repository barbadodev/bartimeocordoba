<?php

namespace App\Bartimeo;

use Illuminate\Support\Facades\DB;
use stdClass;

final class Asistencias
{
    public function estado(Retiro $retiro, ?object $edicion = null): array
    {
        $edicion ??= $retiro->fila()->first();
        $estado = $edicion->asistencias
            ? (array) json_decode($edicion->asistencias, false, 512, JSON_THROW_ON_ERROR)
            : ['members' => [], 'meetings' => [], 'att' => new stdClass, 'seq' => 1];

        $activos = $retiro->tabla('inscripciones')->where('estado', 'Confirmado')
            ->selectRaw("id, tipo, datos->>'nombre' as nombre, datos->>'apellidos' as apellidos")->get()->keyBy('id');

        $porNombre = $activos->groupBy(fn ($ficha) => $this->normalizar($this->nombre($ficha)));
        $miembros = array_map(fn ($miembro) => (array) $miembro, $estado['members']);
        $historicos = collect($miembros)->reject(fn ($miembro) => ! empty($miembro['motivoExcepcion']))
            ->countBy(fn ($miembro) => ! empty($miembro['historicoImportado'])
                ? Retiro::json([! empty($miembro['caminante']) ? Inscripciones::CAMINANTE : Inscripciones::SERVIDOR, $this->normalizar($miembro['name'])])
                : $this->normalizar($miembro['name']));
        $conocidos = array_fill_keys(array_filter(array_column($miembros, 'inscripcionId')), true);

        foreach ($miembros as &$miembro) {
            if (empty($miembro['inscripcionId']) && empty($miembro['motivoExcepcion'])) {
                $nombre = $this->normalizar($miembro['name']);
                $claveHistorica = ! empty($miembro['historicoImportado'])
                    ? Retiro::json([! empty($miembro['caminante']) ? Inscripciones::CAMINANTE : Inscripciones::SERVIDOR, $nombre])
                    : $nombre;
                $candidatos = $porNombre->get($nombre, collect());
                if (! empty($miembro['historicoImportado'])) {
                    $tipo = ! empty($miembro['caminante']) ? Inscripciones::CAMINANTE : Inscripciones::SERVIDOR;
                    $candidatos = $candidatos->where('tipo', $tipo)->values();
                }
                if ($candidatos->count() === 1 && ($historicos[$claveHistorica] ?? 0) === 1 && empty($conocidos[$candidatos->first()->id])) {
                    $miembro['inscripcionId'] = $candidatos->first()->id;
                    $conocidos[$miembro['inscripcionId']] = true;
                }
            }
            $ficha = $activos->get($miembro['inscripcionId'] ?? '');
            $miembro['inscritoActivo'] = $ficha !== null;
            if ($ficha) {
                $miembro['name'] = $this->nombre($ficha);
            }
        }
        unset($miembro);

        foreach ($activos as $ficha) {
            if (! isset($conocidos[$ficha->id])) {
                $miembros[] = [
                    'id' => $ficha->id, 'name' => $this->nombre($ficha), 'inscripcionId' => $ficha->id,
                    'caminante' => $ficha->tipo === Inscripciones::CAMINANTE, 'inscritoActivo' => true,
                ];
            }
        }

        return array_replace($estado, ['members' => $miembros, 'revision' => $edicion->revision_asistencias, 'att' => (object) $estado['att']]);
    }

    public function guardar(Retiro $retiro, object $estado): array
    {
        if (! is_array($estado->members ?? null) || ! is_array($estado->meetings ?? null) || ! ($estado->att ?? null) instanceof stdClass) {
            Retiro::error(400, 'Estructura de estado de asistencias inválida.');
        }

        return $retiro->escribir(function ($edicion) use ($retiro, $estado) {
            $anterior = $this->estado($retiro, $edicion);
            if (($estado->revision ?? null) !== $anterior['revision']) {
                Retiro::error(409, 'Otra persona ha actualizado las asistencias. Recarga antes de volver a guardar.');
            }

            $reuniones = $this->reuniones($estado->meetings);
            $miembros = $this->miembros($estado->members, array_column($anterior['members'], null, 'id'), $reuniones);
            $this->actualizarMarcas($retiro, $estado->att, $anterior['att'], $miembros, $reuniones);
            $revision = $anterior['revision'] + 1;
            $estado->members = array_values($miembros);
            $estado->revision = $revision;
            $retiro->fila()->update(['revision_asistencias' => $revision, 'asistencias' => Retiro::json($estado)]);

            return [
                'success' => true, 'revision' => $revision, 'timestamp' => Retiro::ahoraMs(),
                'membersCount' => count($estado->members), 'meetingsCount' => count($estado->meetings),
            ];
        });
    }

    public function importarHistorico(Retiro $retiro, object $carga): array
    {
        return $retiro->escribir(function ($edicion) use ($retiro, $carga) {
            $huella = $carga->huella;
            if (DB::table('importaciones_bartimeo')->where('huella', $huella)->exists()) {
                return ['success' => true, 'yaImportada' => true, 'revision' => (int) $edicion->revision_asistencias];
            }

            $anterior = $this->estado($retiro, $edicion);
            if (($carga->revision ?? null) !== $anterior['revision']) {
                Retiro::error(409, 'Las asistencias cambiaron. Vuelve a cargar el estado antes de importar.');
            }
            if ($anterior['meetings'] || $retiro->tabla('asistencias_detalle')->exists()) {
                Retiro::error(409, 'La edición ya contiene reuniones o marcas. No se modificó ningún dato.');
            }
            if (! is_array($carga->members ?? null) || ! $carga->members || count($carga->members) > 500
                || ! is_array($carga->meetings ?? null) || ! $carga->meetings || count($carga->meetings) > 50
                || !(($carga->att ?? null) instanceof stdClass)) {
                Retiro::error(400, 'La importación histórica no tiene una estructura válida.');
            }

            $miembrosPorId = array_column($anterior['members'], null, 'id');
            $activosPorClave = [];
            foreach ($anterior['members'] as $miembro) {
                if (empty($miembro['inscritoActivo'])) {
                    continue;
                }
                $tipo = ! empty($miembro['caminante']) ? Inscripciones::CAMINANTE : Inscripciones::SERVIDOR;
                $clave = Retiro::json([$tipo, $this->normalizar($miembro['name'])]);
                $activosPorClave[$clave][] = $miembro;
            }

            $destinos = [];
            $tiposOrigen = [];
            $nombresOrigen = [];
            $porTipo = [Inscripciones::CAMINANTE => 0, Inscripciones::SERVIDOR => 0];
            $historicosCreados = 0;
            foreach ($carga->members as $miembro) {
                $id = $miembro->id ?? null;
                $nombre = is_string($miembro->name ?? null) ? trim($miembro->name) : '';
                $tipo = $miembro->tipo ?? null;
                if (! $this->idValido($id) || isset($destinos[$id]) || $nombre === '' || mb_strlen($nombre) > 500
                    || str_contains($nombre, chr(0)) || ! in_array($tipo, [Inscripciones::CAMINANTE, Inscripciones::SERVIDOR], true)) {
                    Retiro::error(400, 'La lista contiene un participante no válido o duplicado.');
                }

                $clave = Retiro::json([$tipo, $this->normalizar($nombre)]);
                if (isset($nombresOrigen[$clave])) {
                    Retiro::error(400, 'Hay nombres duplicados dentro de un mismo grupo en el archivo.');
                }
                $nombresOrigen[$clave] = true;
                $tiposOrigen[$id] = $tipo;
                $porTipo[$tipo]++;

                $candidatos = $activosPorClave[$clave] ?? [];
                if (count($candidatos) > 1) {
                    Retiro::error(409, 'Hay inscripciones con nombres repetidos; no se puede asociar la asistencia con seguridad.');
                }
                if ($candidatos) {
                    $destinos[$id] = $candidatos[0]['id'];
                    continue;
                }
                if (isset($miembrosPorId[$id])) {
                    Retiro::error(409, 'Un identificador del archivo ya está ocupado. No se modificó ningún dato.');
                }

                $destinos[$id] = $id;
                $miembrosPorId[$id] = [
                    'id' => $id, 'name' => $nombre, 'inscripcionId' => null, 'inscritoActivo' => false,
                    'caminante' => $tipo === Inscripciones::CAMINANTE, 'foraneo' => false,
                    'historicoImportado' => true, 'motivoExcepcion' => null, 'reunionExcepcionId' => null,
                ];
                $historicosCreados++;
            }

            $reuniones = [];
            $tipoPorReunion = [];
            $fechas = [];
            foreach ($carga->meetings as $reunion) {
                $id = $reunion->id ?? null;
                $fecha = $reunion->date ?? null;
                $tipo = $reunion->tipo ?? null;
                if (! $this->idValido($id) || isset($tipoPorReunion[$id]) || ! is_string($fecha)
                    || ! preg_match('/^\d{4}-\d{2}-\d{2}$/D', $fecha)
                    || ! checkdate((int) substr($fecha, 5, 2), (int) substr($fecha, 8, 2), (int) substr($fecha, 0, 4))
                    || ! in_array($tipo, [Inscripciones::CAMINANTE, Inscripciones::SERVIDOR], true) || isset($fechas[$fecha])) {
                    Retiro::error(400, 'El archivo contiene una reunión no válida, duplicada o sin grupo.');
                }
                if ($porTipo[$tipo] === 0) {
                    Retiro::error(400, 'Hay una reunión sin participantes del grupo indicado.');
                }
                $tipoPorReunion[$id] = $tipo;
                $fechas[$fecha] = true;
                $reuniones[] = (object) ['id' => $id, 'date' => $fecha];
            }

            $marcasOrigen = (array) $carga->att;
            if (count($marcasOrigen) !== count($tipoPorReunion)) {
                Retiro::error(400, 'Las marcas no coinciden con las reuniones del archivo.');
            }
            $marcas = [];
            foreach ($tipoPorReunion as $reunionId => $tipoReunion) {
                $marcasReunion = $marcasOrigen[$reunionId] ?? null;
                if (! $marcasReunion instanceof stdClass) {
                    Retiro::error(400, 'Faltan marcas para una de las reuniones.');
                }
                $marcasReunion = (array) $marcasReunion;
                $esperados = 0;
                foreach ($tiposOrigen as $tipoOrigen) {
                    if ($tipoOrigen === $tipoReunion) {
                        $esperados++;
                    }
                }
                if (count($marcasReunion) > $esperados) {
                    Retiro::error(400, 'El número de marcas supera los participantes del grupo.');
                }
                foreach ($marcasReunion as $idOrigen => $estado) {
                    if (($tiposOrigen[$idOrigen] ?? null) !== $tipoReunion || ! in_array($estado, ['p', 'a'], true)) {
                        Retiro::error(400, 'Hay marcas incompatibles con la reunión o el grupo.');
                    }
                    $idDestino = $destinos[$idOrigen];
                    if (isset($marcas[$reunionId][$idDestino])) {
                        Retiro::error(409, 'Dos personas se asociarían al mismo registro en una reunión.');
                    }
                    $marcas[$reunionId][$idDestino] = $estado;
                }
            }

            $estadoNuevo = (object) [
                'members' => array_map(fn ($miembro) => (object) $miembro, array_values($miembrosPorId)),
                'meetings' => $reuniones,
                'att' => (object) array_map(fn ($marcasReunion) => (object) $marcasReunion, $marcas),
                'seq' => $anterior['seq'] ?? 1,
            ];
            $reunionesValidas = $this->reuniones($estadoNuevo->meetings);
            $miembrosValidos = $this->miembros(
                $estadoNuevo->members,
                array_column($anterior['members'], null, 'id'),
                $reunionesValidas,
                true,
            );
            $this->actualizarMarcas($retiro, $estadoNuevo->att, $anterior['att'], $miembrosValidos, $reunionesValidas);
            $revision = $anterior['revision'] + 1;
            $estadoNuevo->members = array_values($miembrosValidos);
            $estadoNuevo->revision = $revision;
            $retiro->fila()->update(['revision_asistencias' => $revision, 'asistencias' => Retiro::json($estadoNuevo)]);
            DB::table('importaciones_bartimeo')->insert(['huella' => $huella, 'importada_en' => now()]);

            return [
                'success' => true, 'yaImportada' => false, 'revision' => $revision,
                'participantesHistoricos' => $historicosCreados, 'reuniones' => count($reuniones),
                'marcas' => array_sum(array_map('count', $marcas)),
            ];
        });
    }
    private function reuniones(array $lista): array
    {
        $resultado = [];
        foreach ($lista as $reunion) {
            $id = $reunion->id ?? null;
            $fecha = $reunion->date ?? null;
            if (! $this->idValido($id) || isset($resultado[$id]) || ! is_string($fecha) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/D', $fecha)) {
                Retiro::error(400, 'Reunión no válida o duplicada.');
            }
            $resultado[$id] = true;
        }

        return $resultado;
    }

    private function miembros(array $lista, array $anteriores, array $reuniones, bool $permitirNuevosHistoricos = false): array
    {
        $miembros = [];
        $inscripciones = [];
        $excepciones = [];
        foreach ($lista as $miembro) {
            $id = $miembro->id ?? null;
            $nombre = $miembro->name ?? null;
            if (! $this->idValido($id) || isset($miembros[$id]) || ! is_string($nombre) || trim($nombre) === '' || mb_strlen($nombre) > 500 || str_contains($nombre, "\0")) {
                Retiro::error(400, 'Participante de asistencia no válido o duplicado.');
            }
            $previo = $anteriores[$id] ?? null;
            $motivo = is_string($miembro->motivoExcepcion ?? null) ? trim($miembro->motivoExcepcion) : '';
            $reunion = $previo['reunionExcepcionId'] ?? $miembro->reunionExcepcionId ?? null;
            $historicoImportado = ! empty($previo['historicoImportado'])
                || (! $previo && $permitirNuevosHistoricos && ! empty($miembro->historicoImportado));
            if (! $previo && ! $historicoImportado && ($motivo === '' || mb_strlen($motivo) > 500 || str_contains($motivo, "\0")
                || ! $this->idValido($reunion) || ! isset($reuniones[$reunion]))) {
                Retiro::error(400, 'Indica el motivo y la reunión para registrar una excepción.');
            }
            // Los enlaces a inscripciones y el motivo histórico son datos del servidor.
            $motivo = $previo ? ($previo['motivoExcepcion'] ?? null) : ($historicoImportado ? null : $motivo);
            $inscripcion = $previo['inscripcionId'] ?? null;
            if ($motivo) {
                $clave = Retiro::json([$reunion, $this->normalizar($nombre)]);
                if (isset($excepciones[$clave])) {
                    Retiro::error(400, 'Ya existe esa excepción en la reunión.');
                }
                $excepciones[$clave] = true;
            }
            if ($inscripcion && isset($inscripciones[$inscripcion])) {
                Retiro::error(400, 'Ya existe un participante para esa inscripción.');
            }
            if ($inscripcion) {
                $inscripciones[$inscripcion] = true;
            }
            $miembros[$id] = array_replace((array) $miembro, [
                'inscripcionId' => $inscripcion, 'inscritoActivo' => $previo['inscritoActivo'] ?? false,
                'motivoExcepcion' => $motivo, 'reunionExcepcionId' => $motivo ? $reunion : null,
                'historicoImportado' => $historicoImportado,
            ]);
        }

        return $miembros;
    }

    private function actualizarMarcas(Retiro $retiro, object $marcas, object $anteriores, array $miembros, array $reuniones): void
    {
        $filas = [];
        $existentes = $retiro->tabla('asistencias_detalle')->get()->groupBy('reunion_id')->map->keyBy('participante_id');
        $ahora = now();
        foreach ($marcas as $reunion => $marcasReunion) {
            if (! isset($reuniones[$reunion]) || ! $marcasReunion instanceof stdClass) {
                Retiro::error(400, 'Las marcas deben corresponder a una reunión válida.');
            }
            foreach ($marcasReunion as $id => $marca) {
                $miembro = $miembros[$id] ?? null;
                $historica = ($anteriores->{$reunion}->{$id} ?? null) === $marca;
                $excepcion = ! empty($miembro['motivoExcepcion']) && $miembro['reunionExcepcionId'] === (string) $reunion;
                if (! $miembro || ! in_array($marca, ['p', 'i', 'a'], true) || (! $historica && ! $excepcion && ! $miembro['inscritoActivo'] && empty($miembro['historicoImportado']))) {
                    Retiro::error(400, 'La asistencia requiere inscripción activa o una excepción para esa reunión.');
                }
                $previa = $existentes->get($reunion)?->get($id);
                $motivo = $miembro['motivoExcepcion'];
                $inscripcion = $miembro['inscripcionId'];
                $sinCambios = $previa && $previa->estado === $marca && $previa->motivo_excepcion === $motivo && $previa->inscripcion_id === $inscripcion;
                $filas[] = [
                    'edicion_id' => $retiro->id, 'reunion_id' => $reunion, 'participante_id' => $id, 'estado' => $marca,
                    'motivo_excepcion' => $motivo, 'inscripcion_id' => $inscripcion,
                    'registrado_en' => $sinCambios ? $previa->registrado_en : $ahora,
                ];
            }
        }

        $retiro->tabla('asistencias_detalle')->delete();
        foreach (array_chunk($filas, 500) as $lote) {
            DB::table('asistencias_detalle')->insert($lote);
        }
    }

    private function idValido(mixed $id): bool
    {
        return is_string($id) && $id !== '' && mb_strlen($id) <= 128 && ! str_contains($id, "\0");
    }

    private function normalizar(string $nombre): string
    {
        return mb_strtolower(preg_replace('/\s+/u', ' ', trim($nombre)));
    }

    private function nombre(object $ficha): string
    {
        return trim($ficha->nombre.' '.$ficha->apellidos);
    }
}
