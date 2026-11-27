<?php

namespace App\Http\Controllers;

use App\Bartimeo\Asistencias;
use App\Bartimeo\PersonasExcel;
use App\Bartimeo\Retiro;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

final class AsistenciasWebController
{
    private const ESTADOS = ['' => 'Sin marcar', 'p' => 'Asiste', 'i' => 'Incidencia', 'a' => 'Ausente'];

    public function show(Request $request, Asistencias $asistencias): View
    {
        $retiro = $request->attributes->get(Retiro::class);
        $estado = $asistencias->estado($retiro);
        $estado['meetings'] = collect($estado['meetings'])->sortByDesc('date')->values()->all();
        $reunion = collect($estado['meetings'])->firstWhere('id', $request->query('reunion')) ?? ($estado['meetings'][0] ?? null);
        $miembros = collect($estado['members'])->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE);

        return view('asistencias', [
            'retiro' => $retiro, 'parroquia' => $retiro->parroquia, 'estado' => $estado,
            'reunion' => $reunion, 'estados' => self::ESTADOS, 'miembros' => $miembros,
            'grupos' => $reunion ? $miembros->filter(fn (array $miembro): bool => $this->pertenece($miembro, $reunion->id))
                ->groupBy(fn (array $miembro): string => empty($miembro['caminante']) ? 'Asistentes' : 'Caminantes') : collect(),
        ]);
    }

    public function guardar(Request $request, Asistencias $asistencias): RedirectResponse
    {
        $datos = $request->validate([
            'revision' => ['required', 'integer', 'min:0'],
            'accion' => ['required', 'in:marca,todos,limpiar,reunion,borrar_reunion,excepcion,participante,borrar_participante'],
            'reunion' => ['nullable', 'string', 'max:128'],
            'persona' => ['nullable', 'string', 'max:128'],
        ]);
        $retiro = $request->attributes->get(Retiro::class);
        $estado = $asistencias->estado($retiro);
        $reunion = $datos['reunion'] ?? null;
        $vista = $request->query('vista');
        $vista = in_array($vista, ['participantes', 'reuniones'], true) ? $vista : null;
        $q = $request->query('q');
        $q = is_string($q) ? mb_substr(trim($q), 0, 120) : null;
        $resaltar = $request->query('resaltar');
        $resaltar = in_array($resaltar, ['caminante', 'foraneo', 'sin', 'a', 'p'], true) ? $resaltar : null;
        $ancla = $datos['accion'] === 'marca' && ! empty($datos['persona']) ? '#persona-'.rawurlencode($datos['persona']) : '';
        $volver = function () use ($retiro, &$reunion, $vista, $q, $resaltar, $ancla): RedirectResponse {
            return redirect()->to(route('bartimeo.asistencias', [
                'parroquia' => $retiro->parroquia, 'edicion' => $retiro->edicion, 'reunion' => $reunion,
                'vista' => $vista, 'q' => $q, 'resaltar' => $resaltar,
            ]).$ancla);
        };

        if ((int) $datos['revision'] !== $estado['revision']) {
            return $volver()->withErrors(['asistencias' => 'Las asistencias cambiaron. Revisa la información actualizada antes de guardar.']);
        }
        try {
            $reuniones = array_column($estado['meetings'], null, 'id');
            $miembros = array_column($estado['members'], null, 'id');
            $persona = $datos['persona'] ?? '';
            switch ($datos['accion']) {
                case 'reunion':
                    $fecha = $request->validate(['fecha' => ['required', 'date_format:Y-m-d']])['fecha'];
                    abort_if(in_array($fecha, array_column($reuniones, 'date'), true), 422, 'Ya hay una reunión para esa fecha.');
                    $reunion = (string) Str::uuid();
                    $reuniones[$reunion] = (object) ['id' => $reunion, 'date' => $fecha];
                    break;
                case 'borrar_reunion':
                    abort_unless(isset($reuniones[$reunion]), 404);
                    unset($reuniones[$reunion], $estado['att']->{$reunion});
                    $miembros = array_filter($miembros, fn (array $miembro): bool => ($miembro['reunionExcepcionId'] ?? null) !== $reunion);
                    $reunion = null;
                    break;
                case 'participante':
                    abort_unless(isset($miembros[$persona]), 404);
                    $nombre = $request->validate(['nombre' => ['required', 'string', 'max:500', 'not_regex:/\x00/']])['nombre'];
                    $miembros[$persona]['name'] = $nombre;
                    $miembros[$persona]['caminante'] = $request->boolean('caminante');
                    $miembros[$persona]['foraneo'] = $request->boolean('foraneo');
                    break;
                case 'borrar_participante':
                    abort_unless(isset($miembros[$persona]) && empty($miembros[$persona]['inscritoActivo']), 422, 'El participante tiene una inscripción activa.');
                    unset($miembros[$persona]);
                    foreach ($estado['att'] as $marcaReunion) {
                        unset($marcaReunion->{$persona});
                    }
                    break;
                case 'excepcion':
                    abort_unless(isset($reuniones[$reunion]), 404);
                    $excepcion = $request->validate([
                        'nombre' => ['required', 'string', 'max:500', 'not_regex:/\x00/'],
                        'motivo' => ['required', 'string', 'max:500', 'not_regex:/\x00/'],
                    ]);
                    $id = (string) Str::uuid();
                    $miembros[$id] = [
                        'id' => $id, 'name' => $excepcion['nombre'], 'caminante' => $request->boolean('caminante'),
                        'foraneo' => $request->boolean('foraneo'), 'motivoExcepcion' => $excepcion['motivo'], 'reunionExcepcionId' => $reunion,
                    ];
                    break;
                default:
                    abort_unless(isset($reuniones[$reunion]), 404);
                    $actuales = $estado['att']->{$reunion} ?? (object) [];
                    if ($datos['accion'] === 'marca') {
                        abort_unless(isset($miembros[$persona]) && $this->marcable($miembros[$persona], $reunion), 422, 'Este participante no se puede marcar en esta reunión.');
                        $siguiente = match ($actuales->{$persona} ?? '') {
                            '' => 'p', 'p' => 'i', 'i' => 'a', default => '',
                        };
                        if ($siguiente === '') {
                            unset($actuales->{$persona});
                        } else {
                            $actuales->{$persona} = $siguiente;
                        }
                    } elseif ($datos['accion'] === 'todos') {
                        foreach (array_filter($miembros, fn (array $miembro): bool => $this->marcable($miembro, $reunion)) as $id => $miembro) {
                            $actuales->{$id} = 'p';
                        }
                    } else {
                        $actuales = (object) [];
                    }
                    $estado['att']->{$reunion} = $actuales;
            }
            $estado['meetings'] = array_values($reuniones);
            $estado['members'] = array_map(fn (array $miembro): object => (object) $miembro, array_values($miembros));
            $asistencias->guardar($retiro, (object) $estado);
        } catch (HttpExceptionInterface $error) {
            if ($error->getStatusCode() >= 500) {
                throw $error;
            }

            return $volver()->withErrors(['asistencias' => $error->getMessage() ?: 'No se pudo guardar este cambio.']);
        }

        return $volver()->with('mensaje', 'Asistencias guardadas.');
    }

    public function importar(Request $request, Asistencias $asistencias, PersonasExcel $excel, ImportarPersonasAsistenciaController $importar): RedirectResponse
    {
        $datos = $request->validate(['archivo' => ['required', 'file', 'extensions:xlsx', 'max:5120'], 'revision' => ['required', 'integer', 'min:0']]);
        $retiro = $request->attributes->get(Retiro::class);
        $volver = redirect()->route('bartimeo.asistencias', ['parroquia' => $retiro->parroquia, 'edicion' => $retiro->edicion, 'vista' => 'participantes']);
        try {
            $personas = $excel->leer($datos['archivo']->getPathname());
            $carga = $request->duplicate([], ['revision' => (int) $datos['revision'], 'personas' => $personas]);
            $importar($carga, $asistencias);
        } catch (HttpExceptionInterface $error) {
            if ($error->getStatusCode() >= 500) {
                throw $error;
            }

            return $volver->withErrors(['asistencias' => $error->getMessage()]);
        } catch (RuntimeException $error) {
            return $volver->withErrors(['asistencias' => $error->getMessage()]);
        }

        return $volver->with('mensaje', 'Participantes importados. Se conservaron las marcas existentes.');
    }

    public function exportar(Request $request, Asistencias $asistencias, PersonasExcel $excel): Response
    {
        $retiro = $request->attributes->get(Retiro::class);
        $estado = $asistencias->estado($retiro);
        $reuniones = collect($estado['meetings'])->sortBy('date')->values()->all();
        $filas = [];
        foreach ($estado['members'] as $miembro) {
            $marcas = array_map(fn (object $reunion): string => $this->pertenece($miembro, $reunion->id)
                ? self::ESTADOS[$estado['att']->{$reunion->id}->{$miembro['id']} ?? ''] : 'No corresponde', $reuniones);
            $filas[] = [$miembro['name'], empty($miembro['caminante']) ? 'Asistente' : 'Caminante', empty($miembro['foraneo']) ? 'No' : 'Sí', ...$marcas];
        }

        return $this->xlsx($excel->crear(['Nombre', 'Tipo', 'Otra ciudad', ...array_column($reuniones, 'date')], $filas), 'asistencias.xlsx');
    }

    public function plantilla(PersonasExcel $excel): Response
    {
        return $this->xlsx($excel->crear(['Nombre', 'Tipo', 'Otra ciudad'], []), 'plantilla-asistencias.xlsx');
    }

    private function pertenece(array $miembro, string $reunion): bool
    {
        return empty($miembro['motivoExcepcion']) || ($miembro['reunionExcepcionId'] ?? null) === $reunion;
    }

    private function marcable(array $miembro, string $reunion): bool
    {
        return $this->pertenece($miembro, $reunion)
            && (! empty($miembro['motivoExcepcion']) || ! empty($miembro['inscritoActivo']) || ! empty($miembro['historicoImportado']));
    }

    private function xlsx(string $contenido, string $nombre): Response
    {
        return response($contenido, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$nombre.'"',
        ]);
    }
}
