<?php

namespace App\Http\Controllers;

use App\Bartimeo\Retiro;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final class CoordinacionController
{
    private const NOMBRE = 'Coordinador VII Bartimeo';

    public function login(Request $request): JsonResponse
    {
        $retiro = $request->attributes->get(Retiro::class);
        if ($retiro->parroquia === 'cristorey') {
            Retiro::error(410, 'Acceso mediante enlace privado.');
        }
        $password = $request->input('password');
        $fila = DB::table('parroquias')->where('slug', $retiro->parroquia)->first();
        if (is_string($password) && strlen($password) <= 128 && $fila->clave_hash) {
            $password = trim($password);
            if ($fila->sal_legada === null && Hash::check(hash('sha256', $password), $fila->clave_hash)) {
                return $this->sesion($retiro);
            }
            if ($fila->sal_legada !== null && $this->verificarLegada($password, $fila)) {
                DB::table('parroquias')->where('slug', $retiro->parroquia)->where('clave_hash', $fila->clave_hash)
                    ->update(['clave_hash' => Hash::make(hash('sha256', $password)), 'sal_legada' => null]);

                return $this->sesion($retiro);
            }
        }

        Retiro::error(401, 'Clave de acceso incorrecta. Verifica la contraseña de coordinación del retiro.');
    }

    private function verificarLegada(string $password, object $fila): bool
    {
        if (! function_exists('sodium_crypto_pwhash_scryptsalsa208sha256')) {
            Retiro::error(503, 'La verificación de credenciales antiguas requiere la extensión Sodium.');
        }

        // Parámetros del scrypt de Node: N=16384, r=8, p=1.
        $hash = sodium_crypto_pwhash_scryptsalsa208sha256(64, $password, $fila->sal_legada, 524288, 16777216);

        return hash_equals($fila->clave_hash, bin2hex($hash));
    }

    public function canjear(Request $request): JsonResponse
    {
        $retiro = $request->attributes->get(Retiro::class);
        $clave = $request->input('clave');
        if (! self::formatoClave($clave)) {
            Retiro::error(401, 'Abre el enlace privado del mapa de coordinación.');
        }
        $hash = hash('sha256', $clave);
        $permanente = config('bartimeo.enlace_permanente_hash');
        $esPermanente = $retiro->parroquia === 'cristorey' && is_string($permanente) && hash_equals($permanente, $hash);
        if (! $esPermanente && ! self::enlaceValido($retiro, 'coordinacion', $clave)) {
            Retiro::error(401, 'El enlace privado no es válido.');
        }

        return $this->sesion($retiro);
    }

    private function sesion(Retiro $retiro): JsonResponse
    {
        $token = bin2hex(random_bytes(32));
        DB::table('sesiones_coordinacion')->where('vence_en', '<=', now())->delete();
        DB::table('sesiones_coordinacion')->insert([
            'token_hash' => hash('sha256', $token),
            'parroquia' => $retiro->parroquia,
            'vence_en' => now()->addHours(config('bartimeo.sesion_horas')),
        ]);

        return response()->json(['ok' => true, 'token' => $token, 'coordinador' => self::NOMBRE]);
    }

    public function verificar(): JsonResponse
    {
        return response()->json(['ok' => true, 'valido' => true, 'coordinador' => self::NOMBRE]);
    }

    public function logout(Request $request): JsonResponse
    {
        DB::table('sesiones_coordinacion')->where('token_hash', $request->attributes->get('sesion_coordinacion'))->delete();

        return response()->json(['ok' => true]);
    }

    public function enlace(Request $request): JsonResponse
    {
        return $this->emitir($request->attributes->get(Retiro::class), 'coordinacion', null);
    }

    public function invitacion(Request $request): JsonResponse
    {
        $retiro = $request->attributes->get(Retiro::class);
        if ($retiro->edicion !== Retiro::PUBLICA) {
            Retiro::error(409, 'Selecciona la edición de la convocatoria pública.');
        }

        if ($request->isMethod('POST')) {
            $dias = $request->input('dias');
            if (! is_int($dias) || $dias < 1 || $dias > 30) {
                Retiro::error(400, 'La duración debe ser de 1 a 30 días.');
            }

            return $this->emitir($retiro, 'servidores', Retiro::ahoraMs() + $dias * 86400000);
        }

        if ($request->isMethod('DELETE')) {
            $retiro->escribir(fn () => $retiro->tabla('enlaces')->where('tipo', 'servidores')->delete());
        }
        $venceEn = $retiro->tabla('enlaces')->where('tipo', 'servidores')->where('vence_en', '>', Retiro::ahoraMs())->value('vence_en');

        return response()->json(compact('venceEn'));
    }

    public function verificarInvitacion(Request $request): JsonResponse
    {
        if (! self::enlaceValido($request->attributes->get(Retiro::class), 'servidores', $request->input('clave'))) {
            Retiro::error(401, 'El enlace de invitación no está activo.');
        }

        return response()->json(['ok' => true]);
    }

    public static function enlaceValido(Retiro $retiro, string $tipo, mixed $clave): bool
    {
        return self::formatoClave($clave) && $retiro->tabla('enlaces')->where('tipo', $tipo)
            ->where('hash', hash('sha256', $clave))
            ->where(fn ($q) => $q->whereNull('vence_en')->orWhere('vence_en', '>', Retiro::ahoraMs()))->exists();
    }

    private static function formatoClave(mixed $clave): bool
    {
        return is_string($clave) && preg_match('/^[a-f0-9]{64}$/D', $clave) === 1;
    }

    private function emitir(Retiro $retiro, string $tipo, ?int $venceEn): JsonResponse
    {
        $clave = bin2hex(random_bytes(32));
        $retiro->escribir(function () use ($retiro, $tipo, $clave, $venceEn) {
            $retiro->tabla('enlaces')->where('tipo', $tipo)->delete();
            DB::table('enlaces')->insert([
                'edicion_id' => $retiro->id, 'tipo' => $tipo, 'hash' => hash('sha256', $clave), 'vence_en' => $venceEn,
            ]);
        });

        return response()->json(compact('clave', 'venceEn'), 201);
    }
}
