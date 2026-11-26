<?php

namespace App\Http\Controllers;

use App\Bartimeo\Inscripciones;
use App\Bartimeo\Retiro;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final class ConfiguracionController
{
    public function parroquias(): JsonResponse
    {
        return response()->json(DB::table('parroquias')->orderBy('nombre')->get(['slug', 'nombre', 'activa']));
    }

    public function crearParroquia(Request $request): JsonResponse
    {
        $this->requerirPrincipal($request);
        $slug = strtolower($this->slug($request->input('slug'), true));
        $nombre = $this->nombre($request->input('nombre'));
        $password = $request->input('passwordInicial');
        if (! is_string($password) || strlen($password) > 128 || mb_strlen(trim($password)) < 12) {
            Retiro::error(400, 'La contraseña inicial debe tener al menos 12 caracteres.');
        }

        DB::transaction(function () use ($slug, $nombre, $password) {
            $insertadas = DB::table('parroquias')->insertOrIgnore([
                'slug' => $slug, 'nombre' => $nombre, 'creada_en' => now(), 'clave_hash' => Hash::make(hash('sha256', trim($password))),
            ]);
            if ($insertadas === 0) {
                Retiro::error(409, 'Ese identificador de parroquia ya existe.');
            }
            Retiro::crearEdicion($slug, Retiro::PUBLICA, 'VII retiro');
        });

        return response()->json(['slug' => $slug, 'nombre' => $nombre, 'activa' => true], 201);
    }

    public function actualizarParroquia(Request $request, string $slug): JsonResponse
    {
        $this->requerirPrincipal($request);
        if ($slug === 'cristorey') {
            Retiro::error(400, 'La parroquia principal no se puede desactivar ni renombrar desde aquí.');
        }
        $cambios = [];
        if ($request->has('nombre')) {
            $cambios['nombre'] = $this->nombre($request->input('nombre'));
        }
        if ($request->has('activa')) {
            $activa = $request->input('activa');
            if (! is_bool($activa)) {
                Retiro::error(400, 'Datos de parroquia no válidos.');
            }
            $cambios['activa'] = $activa;
        }
        $fila = DB::table('parroquias')->where('slug', $slug);
        if (! $fila->exists()) {
            Retiro::error(404, 'Parroquia no encontrada.');
        }
        if ($cambios) {
            $fila->update($cambios);
        }

        return response()->json($fila->first(['slug', 'nombre', 'activa']));
    }

    public function ediciones(Request $request): JsonResponse
    {
        $retiro = $request->attributes->get(Retiro::class);
        $consulta = DB::table('ediciones')->where('parroquia', $retiro->parroquia)->orderByDesc('id');
        if ($request->isMethod('GET')) {
            return response()->json($consulta->get(['slug', 'nombre']));
        }
        $slug = $this->slug($request->input('slug'));
        $nombre = $this->nombre($request->input('nombre'));
        DB::transaction(function () use ($retiro, $slug, $nombre) {
            DB::table('parroquias')->where('slug', $retiro->parroquia)->lockForUpdate()->first();
            if (DB::table('ediciones')->where('parroquia', $retiro->parroquia)->where('slug', $slug)->exists()) {
                Retiro::error(400, 'La edición ya existe.');
            }
            Retiro::crearEdicion($retiro->parroquia, $slug, $nombre);
        });

        return response()->json($consulta->get(['slug', 'nombre']), 201);
    }

    public function catalogos(Request $request): JsonResponse
    {
        $retiro = $request->attributes->get(Retiro::class);
        $publico = ! $request->is('api/catalogos/gestion');
        $datos = [];
        foreach (array_keys(Retiro::CATALOGOS) as $tipo) {
            $datos[$tipo] = $retiro->catalogo($tipo, $publico);
        }
        if ($publico) {
            $datos['parroquia'] = DB::table('parroquias')->where('activa', true)->orderBy('nombre')
                ->get(['nombre as valor', 'slug', 'activa as activo']);
        }

        return response()->json($datos);
    }

    public function guardarCatalogo(Request $request, string $tipo): JsonResponse
    {
        $retiro = $request->attributes->get(Retiro::class);
        $valores = $request->input('valores');
        if (! isset(Retiro::CATALOGOS[$tipo]) || ! is_array($valores) || ! array_is_list($valores) || count($valores) > 100) {
            Retiro::error(400, 'Catálogo no válido.');
        }

        $nuevos = [];
        foreach ($valores as $orden => $item) {
            $valor = $item['valor'] ?? null;
            $activo = $item['activo'] ?? null;
            if (! is_string($valor) || trim($valor) === '' || mb_strlen($valor) > 100 || ! is_bool($activo)) {
                Retiro::error(400, 'El catálogo contiene valores no válidos.');
            }
            $valor = trim($valor);
            if (array_key_exists($valor, $nuevos)) {
                Retiro::error(400, 'El catálogo contiene valores duplicados.');
            }
            $nuevos[$valor] = ['edicion_id' => $retiro->id, 'tipo' => $tipo, 'valor' => $valor, 'orden' => $orden, 'activo' => $activo];
        }

        $retiro->escribir(function () use ($retiro, $tipo, $nuevos) {
            $retiro->tabla('catalogos')->where('tipo', $tipo)->update(['activo' => false]);
            DB::table('catalogos')->upsert(array_values($nuevos), ['edicion_id', 'tipo', 'valor'], ['activo', 'orden']);
        });

        return response()->json($retiro->catalogo($tipo));
    }

    public function plazas(Request $request): JsonResponse
    {
        $retiro = $request->attributes->get(Retiro::class);
        if ($request->isMethod('PUT')) {
            $limites = [];
            foreach (['maxNinos' => 'max_ninos', 'maxNinas' => 'max_ninas', 'maxTotal' => 'max_total'] as $campo => $columna) {
                $valor = $request->input($campo);
                if (! is_int($valor) || $valor < 0 || $valor > 10000) {
                    Retiro::error(400, 'Los límites deben ser números enteros entre 0 y 10000.');
                }
                $limites[$columna] = $valor;
            }
            $retiro->escribir(fn () => $retiro->fila()->update($limites));
        }

        return response()->json(Inscripciones::plazas($retiro));
    }

    private function requerirPrincipal(Request $request): void
    {
        if ($request->attributes->get(Retiro::class)->parroquia !== 'cristorey') {
            Retiro::error(403, 'Solo la administración general puede gestionar parroquias.');
        }
    }

    private function slug(mixed $valor, bool $parroquia = false): string
    {
        $slug = is_string($valor) ? trim($valor) : '';
        if ($parroquia) {
            $slug = strtolower($slug);
        }
        $reservados = ['api', 'up', 'health', 'assets', 'build', 'servidores', 'caminantes', 'coordinacion', 'admin', 'mapa'];
        if (! Retiro::slugValido($slug) || ($parroquia && in_array($slug, $reservados, true))) {
            Retiro::error(400, 'Indica un identificador web válido.');
        }

        return $slug;
    }

    private function nombre(mixed $valor): string
    {
        if (! is_string($valor) || trim($valor) === '' || mb_strlen($valor) > 100) {
            Retiro::error(400, 'Indica un nombre válido.');
        }

        return trim($valor);
    }
}
