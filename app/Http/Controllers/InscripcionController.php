<?php

namespace App\Http\Controllers;

use App\Bartimeo\DatosInscripcion;
use App\Bartimeo\Inscripciones;
use App\Bartimeo\PlazasAgotadas;
use App\Bartimeo\Retiro;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class InscripcionController
{
    public function listar(Request $request, string $tipo): JsonResponse
    {
        return response()->json(Inscripciones::lista($request->attributes->get(Retiro::class), $tipo));
    }

    public function alta(Request $request, string $tipo): JsonResponse
    {
        $retiro = $request->attributes->get(Retiro::class);
        $clave = $request->header('Idempotency-Key', '');
        if (! preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/iD', $clave)) {
            Retiro::error(400, 'Falta una clave de solicitud válida. Recarga el formulario e inténtalo de nuevo.');
        }
        $hash = hash('sha256', $clave);
        try {
            [$datos, $repetida] = $retiro->escribir(function ($edicion) use ($request, $retiro, $tipo, $hash) {
                if ($tipo === Inscripciones::SERVIDOR && ! CoordinacionController::enlaceValido($retiro, 'servidores', $request->header('X-Invitacion'))) {
                    Retiro::error(401, 'La inscripción requiere una invitación válida.');
                }
                $previa = $retiro->tabla('solicitudes_idempotencia')->where('clave_hash', $hash)->first();
                if ($previa) {
                    if ($previa->tipo !== $tipo) {
                        Retiro::error(409, 'La clave de idempotencia ya se usó para otro tipo de inscripción.');
                    }
                    $fila = Inscripciones::consulta($retiro, $tipo)->where('id', $previa->recurso_id)->first();
                    if (! $fila) {
                        Retiro::error(409, 'La inscripción asociada a esta solicitud ya no está disponible.');
                    }

                    return [Inscripciones::ficha($fila), true];
                }

                $datos = $tipo === Inscripciones::CAMINANTE
                    ? DatosInscripcion::caminante($retiro, $request->json()->all())
                    : DatosInscripcion::servidor($retiro, $request->json()->all());
                $hoy = now()->toISOString();
                $datos += [
                    'id' => ($tipo === Inscripciones::CAMINANTE ? 'cam-' : 'srv-').Str::uuid(),
                    'fechaRegistro' => $hoy, 'estado' => 'Confirmado', 'aceptaRgpd' => true, 'rgpdFecha' => $hoy,
                ];
                if ($tipo === Inscripciones::CAMINANTE) {
                    Inscripciones::comprobarPlaza($retiro, $edicion, $datos['genero']);
                }

                DB::table('inscripciones')->insert(Inscripciones::fila($retiro, $tipo, $datos));
                DB::table('solicitudes_idempotencia')->insert([
                    'edicion_id' => $retiro->id, 'clave_hash' => $hash, 'tipo' => $tipo,
                    'recurso_id' => $datos['id'], 'creada_en' => now(),
                ]);

                return [$datos, false];
            });
        } catch (PlazasAgotadas $error) {
            return response()->json(['error' => $error->getMessage(), 'plazas' => Inscripciones::plazas($retiro)], 409);
        }

        $resumen = array_intersect_key($datos, array_flip(['id', 'nombre', 'tallaCamiseta']));

        return response()->json([
            'mensaje' => 'Inscripción registrada con éxito en el VII Bartimeo Córdoba.',
            $tipo => $resumen,
        ], $repetida ? 200 : 201);
    }

    public function editar(Request $request, string $id, string $tipo): JsonResponse
    {
        $retiro = $request->attributes->get(Retiro::class);
        try {
            $retiro->escribir(function ($edicion) use ($request, $retiro, $tipo, $id) {
                $consulta = Inscripciones::consulta($retiro, $tipo)->where('id', $id);
                $fila = $consulta->first();
                if (! $fila) {
                    Retiro::error(404, 'Inscripción no encontrada.');
                }
                $cambios = DatosInscripcion::cambios($retiro, $tipo, $request->json()->all());
                // Conservar campos históricos aunque no se expongan en la ficha del caminante.
                $anteriores = json_decode($fila->datos, true, 512, JSON_THROW_ON_ERROR);
                $datos = $cambios + ['id' => $fila->id, 'estado' => $fila->estado, 'genero' => $fila->genero] + $anteriores;
                if ($tipo === Inscripciones::CAMINANTE && $datos['estado'] === 'Confirmado'
                    && ($fila->estado !== 'Confirmado' || $datos['genero'] !== $fila->genero)) {
                    Inscripciones::comprobarPlaza($retiro, $edicion, $datos['genero'], $id);
                }
                if ($tipo === Inscripciones::SERVIDOR) {
                    $datos = $this->actualizarExperiencia($retiro, $datos, $cambios, $anteriores);
                }
                $consulta->update(Inscripciones::fila($retiro, $tipo, $datos));
            });
        } catch (PlazasAgotadas $error) {
            return response()->json(['error' => $error->getMessage(), 'plazas' => Inscripciones::plazas($retiro)], 409);
        }

        return response()->json(['ok' => true]);
    }

    private function actualizarExperiencia(Retiro $retiro, array $datos, array $cambios, array $anteriores): array
    {
        if (($cambios['haServido'] ?? null) === 'No') {
            $datos['cuantasVeces'] = '0';
            $datos['serviciosHechos'] = [];
        } elseif (isset($cambios['serviciosHechos'])) {
            $historicos = array_diff($anteriores['serviciosHechos'] ?? [], $retiro->valores('servicio'));
            $datos['serviciosHechos'] = $datos['haServido'] === 'Sí'
                ? array_values(array_unique([...$cambios['serviciosHechos'], ...$historicos]))
                : [];
        }
        if ($datos['haServido'] === 'Sí' && (isset($cambios['haServido']) || isset($cambios['cuantasVeces'])) && (int) $datos['cuantasVeces'] < 1) {
            Retiro::error(400, 'Indica cuántas veces ha servido.');
        }

        return $datos;
    }

    public function borrar(Request $request, string $id, string $tipo): JsonResponse
    {
        $retiro = $request->attributes->get(Retiro::class);
        if (! $retiro->escribir(fn () => Inscripciones::consulta($retiro, $tipo)->where('id', $id)->delete())) {
            Retiro::error(404, 'Inscripción no encontrada.');
        }

        return response()->json(['mensaje' => 'Inscripción eliminada correctamente.']);
    }

    public function metricas(Request $request, string $tipo): JsonResponse
    {
        $retiro = $request->attributes->get(Retiro::class);
        $inscritos = collect(Inscripciones::lista($retiro, $tipo));
        $total = $inscritos->count();
        $cuenta = fn (string $campo, string $valor) => $inscritos->whereStrict($campo, $valor)->count();
        $tieneTexto = fn (array $ficha, string $campo) => trim($ficha[$campo] ?? '') !== '';
        $tallas = fn (string $campo) => (object) $inscritos->filter(fn ($ficha) => $tieneTexto($ficha, $campo))->countBy($campo)->all();

        if ($tipo === Inscripciones::SERVIDOR) {
            return response()->json([
                'total' => $total, 'montajeJueves' => $cuenta('montajeJueves', 'Sí'),
                'hanServidoAntes' => $cuenta('haServido', 'Sí'), 'nuevosServidores' => $cuenta('haServido', 'No'),
                'cuentaAlergias' => $inscritos->filter(fn ($ficha) => ! in_array(mb_strtolower(trim($ficha['alergias'] ?? '')), ['', 'no', 'ninguna', 'ninguno'], true))->count(),
                'desgloseTallas' => [
                    'blanca' => $tallas('tallaCamisetaBlanca'), 'gris' => $tallas('tallaCamisetaGris'), 'sudadera' => $tallas('tallaSudadera'),
                ],
            ]);
        }

        return response()->json([
            'total' => $total, 'listaEsperaPrevia' => $cuenta('listaEsperaPrevia', 'Sí'),
            'tieneAlergias' => $cuenta('tieneAlergia', 'Sí'), 'desgloseTallas' => $tallas('tallaCamiseta'),
            'conTrastornoSalud' => $inscritos->filter(fn ($ficha) => $tieneTexto($ficha, 'trastornoSalud'))->count(),
            'conMedicacion' => $inscritos->filter(fn ($ficha) => $tieneTexto($ficha, 'medicacion'))->count(),
        ]);
    }
}
