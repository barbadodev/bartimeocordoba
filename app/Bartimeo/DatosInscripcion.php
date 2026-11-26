<?php

namespace App\Bartimeo;

use Illuminate\Support\Facades\DB;

final class DatosInscripcion
{
    private const ROPA = ['tallaCamisetaBlanca', 'tallaCamisetaGris', 'tallaSudadera'];

    private const SERVIDOR = [
        'nombre', 'apellidos', 'movil', 'email', 'emailRegistro', 'fechaNacimiento', 'direccion', 'codigoPostal',
        'localidad', 'bartimeoOrigen', 'haServido', 'serviciosOtro', 'montajeJueves', 'tallaCamisetaBlanca',
        'tallaCamisetaGris', 'tallaSudadera', 'alergias', 'manejaExcel', 'emergenciaNombre', 'emergenciaTelefono',
        'emergenciaRelacion', 'emergenciaEmail',
    ];

    private const CAMINANTE = [
        'familiar1Nombre', 'familiar1Dni', 'familiar1Telefono', 'familiar1Email', 'nombre', 'apellidos', 'movil', 'email',
        'colegio', 'direccion', 'codigoPostal', 'localidad', 'sacramentos', 'tallaCamiseta', 'quienInvita',
        'quienInvitaTelefono', 'listaEsperaPrevia', 'vieneConAlguien', 'tieneAlergia', 'alergiaDetalle',
        'trastornoSalud', 'medicacion', 'familiar2Nombre', 'familiar2Telefono', 'familiar2Email',
    ];

    public static function servidor(Retiro $retiro, array $datos): array
    {
        if (($datos['aceptaRgpd'] ?? null) !== true || ! self::email($datos['email'] ?? null)) {
            Retiro::error(400, 'Indica un correo válido y acepta la información de protección de datos.');
        }
        $requeridos = ['nombre', 'apellidos', 'movil', 'email', 'fechaNacimiento', 'direccion', 'localidad', 'bartimeoOrigen',
            'haServido', 'montajeJueves', 'alergias', 'emergenciaNombre', 'emergenciaTelefono', 'emergenciaRelacion'];
        self::requeridos($datos, $requeridos, 'Completa los campos obligatorios de la inscripción.');
        $limpios = self::textos($datos, self::SERVIDOR);
        if (! self::siNo($limpios['haServido']) || ! self::siNo($limpios['montajeJueves'])) {
            Retiro::error(400, 'Las respuestas de experiencia y montaje no son válidas.');
        }

        $experiencia = $limpios['haServido'] === 'Sí';
        $veces = $experiencia ? self::entero($datos['cuantasVeces'] ?? null) : 0;
        if ($veces === null || ($experiencia && $veces < 1)) {
            Retiro::error(400, 'Indica cuántas veces has servido.');
        }
        if (! self::parroquiaActiva($limpios['bartimeoOrigen'])) {
            Retiro::error(400, 'Selecciona una parroquia de procedencia válida.');
        }
        $servicios = self::servicios($retiro, $datos['serviciosHechos'] ?? null);
        $tallas = $retiro->valores('talla_ropa');
        foreach (self::ROPA as $campo) {
            if ($limpios[$campo] !== '' && ! in_array($limpios[$campo], $tallas, true)) {
                Retiro::error(400, 'Selecciona una talla de ropa disponible.');
            }
        }

        $limpios['emailRegistro'] = $limpios['emailRegistro'] ?: $limpios['email'];
        $limpios['manejaExcel'] = $limpios['manejaExcel'] ?: 'Sí';
        $limpios['cuantasVeces'] = (string) $veces;
        $limpios['serviciosHechos'] = $experiencia ? $servicios : [];

        return $limpios;
    }

    public static function caminante(Retiro $retiro, array $datos): array
    {
        $errorTutor = 'Completa los datos del tutor y acepta la información de protección de datos.';
        if (($datos['aceptaRgpd'] ?? null) !== true || ! self::email($datos['familiar1Email'] ?? null)) {
            Retiro::error(400, $errorTutor);
        }
        self::requeridos($datos, ['familiar1Nombre', 'familiar1Dni', 'familiar1Telefono'], $errorTutor);
        self::requeridos($datos, ['nombre', 'apellidos'], 'Indica el nombre y los apellidos del caminante.');
        self::requeridos($datos, ['colegio'], 'Indica el colegio o centro educativo.');
        $limpios = self::textos($datos, self::CAMINANTE);
        $anio = self::entero($datos['anioNacimiento'] ?? null);
        if (! self::anioValido($anio)) {
            Retiro::error(400, 'Indica un año de nacimiento válido.');
        }
        $genero = is_string($datos['genero'] ?? null) ? strtolower(trim($datos['genero'])) : '';
        if (! in_array($genero, ['nino', 'nina'], true)) {
            Retiro::error(400, 'Selecciona niño o niña para comprobar las plazas.');
        }
        $previas = $datos['inscripcionesPrevias'] ?? null;
        $primera = $datos['primeraVezCristoRey'] ?? null;
        if (! is_int($previas) || $previas < 0 || ! is_bool($primera)) {
            Retiro::error(400, 'Completa las dos preguntas de experiencia previa.');
        }
        if (! in_array($limpios['tallaCamiseta'], $retiro->valores('talla_caminante'), true)) {
            Retiro::error(400, 'Selecciona una talla de camiseta disponible.');
        }

        $limpios['listaEsperaPrevia'] = $limpios['listaEsperaPrevia'] ?: 'No';
        $limpios['tieneAlergia'] = $limpios['tieneAlergia'] ?: 'No';

        return $limpios + [
            'anioNacimiento' => $anio, 'genero' => $genero, 'inscripcionesPrevias' => $previas,
            'primeraVezCristoRey' => $primera, 'bautismoRecibido' => ($datos['bautismoRecibido'] ?? null) === true,
            'primeraComunionRecibida' => ($datos['primeraComunionRecibida'] ?? null) === true,
            'familiaresAdicionales' => self::familiares($datos['familiaresAdicionales'] ?? []),
        ];
    }

    public static function cambios(Retiro $retiro, string $tipo, array $cambios): array
    {
        if (! $cambios) {
            Retiro::error(400, 'Indica los cambios que quieres guardar.');
        }

        $validos = [];
        foreach ($cambios as $campo => $valor) {
            $validos[$campo] = match ($campo) {
                'nombre', 'apellidos', 'movil', 'email' => self::texto($valor),
                'estado' => in_array($valor, ['Confirmado', 'Cancelado'], true),
                default => $tipo === Inscripciones::CAMINANTE
                    ? self::campoCaminante($retiro, $campo, $valor)
                    : self::campoServidor($retiro, $campo, $valor),
            };
            if ($validos[$campo] === false) {
                Retiro::error(400, "Revisa el valor de {$campo}.");
            }
            $validos[$campo] = match ($campo) {
                'familiaresAdicionales', 'serviciosHechos' => $validos[$campo],
                'cuantasVeces' => (string) $valor,
                default => is_string($valor) ? trim($valor) : $valor,
            };
        }

        return $validos;
    }

    private static function campoCaminante(Retiro $retiro, string $campo, mixed $valor): bool|array
    {
        return match ($campo) {
            'colegio' => self::texto($valor),
            'anioNacimiento' => is_int($valor) && self::anioValido($valor),
            'genero' => in_array($valor, ['nino', 'nina'], true),
            'inscripcionesPrevias' => is_int($valor) && $valor >= 0,
            'primeraVezCristoRey', 'bautismoRecibido', 'primeraComunionRecibida' => is_bool($valor),
            'tallaCamiseta' => in_array($valor, $retiro->valores('talla_caminante'), true),
            'familiaresAdicionales' => self::familiares($valor),
            default => false,
        };
    }

    private static function campoServidor(Retiro $retiro, string $campo, mixed $valor): bool|array
    {
        return match ($campo) {
            'bartimeoOrigen' => is_string($valor) && self::parroquiaActiva($valor),
            'haServido' => self::siNo($valor),
            'cuantasVeces' => is_int($valor) && $valor >= 0,
            'serviciosHechos' => self::servicios($retiro, $valor),
            'tallaCamisetaBlanca', 'tallaCamisetaGris', 'tallaSudadera' => $valor === '' || in_array($valor, $retiro->valores('talla_ropa'), true),
            default => false,
        };
    }

    private static function familiares(mixed $familiares): array
    {
        if (! is_array($familiares) || ! array_is_list($familiares) || count($familiares) > 2) {
            Retiro::error(400, 'Puedes añadir hasta dos familiares.');
        }
        $resultado = [];
        foreach ($familiares as $familiar) {
            if (! is_array($familiar)) {
                Retiro::error(400, 'Los datos de contacto no son válidos.');
            }
            $limpio = self::textos($familiar, ['nombre', 'telefono', 'parentesco']);
            foreach (['nombre' => 120, 'telefono' => 40, 'parentesco' => 80] as $campo => $maximo) {
                if (mb_strlen($limpio[$campo]) > $maximo) {
                    Retiro::error(400, 'Los datos de contacto no son válidos.');
                }
            }
            $rellenos = count(array_filter($limpio, fn ($valor) => $valor !== ''));
            if ($rellenos !== 0 && $rellenos !== 3) {
                Retiro::error(400, 'Completa los tres datos de cada familiar.');
            }
            if ($rellenos === 3) {
                $resultado[] = $limpio;
            }
        }

        return $resultado;
    }

    private static function servicios(Retiro $retiro, mixed $servicios): array
    {
        $activos = $retiro->valores('servicio');
        if (! is_array($servicios) || ! array_is_list($servicios) || count($servicios) > 100) {
            Retiro::error(400, 'Los servicios seleccionados no están disponibles.');
        }
        foreach ($servicios as $servicio) {
            if (! in_array($servicio, $activos, true)) {
                Retiro::error(400, 'Los servicios seleccionados no están disponibles.');
            }
        }

        return array_values(array_unique($servicios));
    }

    private static function parroquiaActiva(string $nombre): bool
    {
        return DB::table('parroquias')->where('nombre', $nombre)->where('activa', true)->exists();
    }

    private static function siNo(mixed $valor): bool
    {
        return in_array($valor, ['Sí', 'No'], true);
    }

    private static function entero(mixed $valor): ?int
    {
        if (! is_int($valor) && (! is_string($valor) || ! ctype_digit($valor))) {
            return null;
        }

        return filter_var($valor, FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE);
    }

    private static function anioValido(?int $anio): bool
    {
        return $anio !== null && $anio >= 1900 && $anio <= (int) now()->format('Y');
    }

    private static function email(mixed $valor): bool
    {
        return self::texto($valor) && preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/uD', trim($valor)) === 1;
    }

    private static function texto(mixed $valor): bool
    {
        return is_string($valor) && trim($valor) !== '' && mb_strlen($valor) <= 250 && ! str_contains($valor, "\0");
    }

    private static function requeridos(array $datos, array $campos, string $error): void
    {
        foreach ($campos as $campo) {
            if (! self::texto($datos[$campo] ?? null)) {
                Retiro::error(400, $error);
            }
        }
    }

    private static function textos(array $datos, array $campos): array
    {
        $resultado = [];
        foreach ($campos as $campo) {
            $valor = $datos[$campo] ?? '';
            if (! is_string($valor) || mb_strlen($valor) > 4000 || str_contains($valor, "\0")) {
                Retiro::error(400, "Revisa el valor de {$campo}.");
            }
            $resultado[$campo] = trim($valor);
        }

        return $resultado;
    }
}
