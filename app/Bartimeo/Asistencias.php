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
            ->countBy(fn ($miembro) => $this->normalizar($miembro['name']));
        $conocidos = array_fill_keys(array_filter(array_column($miembros, 'inscripcionId')), true);

        foreach ($miembros as &$miembro) {
            if (empty($miembro['inscripcionId']) && empty($miembro['motivoExcepcion'])) {
                $nombre = $this->normalizar($miembro['name']);
                $candidatos = $porNombre->get($nombre, collect());
                if ($candidatos->count() === 1 && $historicos[$nombre] === 1 && empty($conocidos[$candidatos->first()->id])) {
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

    private function miembros(array $lista, array $anteriores, array $reuniones): array
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
            if (! $previo && ($motivo === '' || mb_strlen($motivo) > 500 || str_contains($motivo, "\0")
                || ! $this->idValido($reunion) || ! isset($reuniones[$reunion]))) {
                Retiro::error(400, 'Indica el motivo y la reunión para registrar una excepción.');
            }
            // Los enlaces a inscripciones y el motivo histórico son datos del servidor.
            $motivo = $previo ? ($previo['motivoExcepcion'] ?? null) : $motivo;
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
                if (! $miembro || ! in_array($marca, ['p', 'i', 'a'], true) || (! $historica && ! $excepcion && ! $miembro['inscritoActivo'])) {
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
