<?php

namespace App\Http\Controllers;

use App\Bartimeo\Inscripciones;
use App\Bartimeo\Retiro;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class PanelWebController
{
    public function show(Request $request): View
    {
        $retiro = $request->attributes->get(Retiro::class);
        if ($request->query('seccion') === 'configuracion') {
            return view('panel-configuracion', ['retiro' => $retiro, 'parroquia' => $retiro->parroquia,
                'ediciones' => DB::table('ediciones')->where('parroquia', $retiro->parroquia)->orderByDesc('id')->get(['slug', 'nombre']),
                'parroquias' => $retiro->parroquia === 'cristorey' ? DB::table('parroquias')->orderBy('nombre')->get(['slug', 'nombre', 'activa']) : collect(),
                'catalogos' => array_combine(array_keys(Retiro::CATALOGOS), array_map(fn (string $tipo): array => $retiro->catalogo($tipo), array_keys(Retiro::CATALOGOS))),
                'configuracion' => $retiro->fila()->first(), 'mensaje' => session('mensaje')]);
        }
        $tipo = $this->tipo($request->query('tipo', Inscripciones::SERVIDOR));
        $inscritos = Inscripciones::lista($retiro, $tipo);
        [$filtros, $opciones] = $this->filtros($request, $retiro, $tipo);
        $filtrados = $this->filtrar($inscritos, $tipo, $filtros);
        $tallas = [];
        foreach (['tallaCamiseta', 'tallaCamisetaBlanca', 'tallaCamisetaGris', 'tallaSudadera'] as $campo) {
            $tallas[$campo] = collect($inscritos)->pluck($campo)->filter(fn ($talla) => is_string($talla) && ! in_array(trim($talla), ['', 'No', 'Ya tengo'], true))->countBy()->sortKeys()->all();
        }
        $cuenta = fn (string $campo, string $valor): int => collect($inscritos)->whereStrict($campo, $valor)->count();

        return view('panel', [
            'retiro' => $retiro, 'inscritos' => $filtrados, 'tipo' => $tipo, 'tallas' => $tallas,
            'filtros' => $filtros, 'opciones' => $opciones, 'total' => count($inscritos),
            'metricas' => [
                'jueves' => $cuenta('montajeJueves', 'Sí'), 'experiencia' => $cuenta('haServido', 'Sí'),
                'nuevos' => $cuenta('haServido', 'No'), 'espera' => $cuenta('listaEsperaPrevia', 'Sí'),
                'alergias' => count(array_filter($inscritos, fn (array $ficha): bool => $this->tieneAlergia($ficha, $tipo))),
                'salud' => count(array_filter($inscritos, fn (array $ficha): bool => trim(($ficha['medicacion'] ?? '').($ficha['trastornoSalud'] ?? '')) !== '')),
            ],
        ]);
    }

    public function guardar(Request $request): RedirectResponse
    {
        $retiro = $request->attributes->get(Retiro::class);
        $accion = $request->input('accion');
        if ($accion === 'editar') {
            $tipo = $this->tipo($request->input('tipo'));
            $id = $request->validate(['id' => ['required', 'string', 'max:128']])['id'];
            $fila = Inscripciones::consulta($retiro, $tipo)->where('id', $id)->first();
            abort_unless($fila, 404);
            $datos = array_map(fn ($valor) => $valor ?? '', $request->only(['nombre', 'apellidos', 'movil', 'email', 'estado', 'genero']));
            $jsonRequest = Request::create('/api/'.$tipo.'/'.$id, 'PUT', [], [], [], ['CONTENT_TYPE' => 'application/json'], json_encode($datos, JSON_THROW_ON_ERROR));
            $jsonRequest->attributes->set(Retiro::class, $retiro);
            $respuesta = app(InscripcionController::class)->editar($jsonRequest, $id, $tipo);
            if ($respuesta->getStatusCode() >= 400) {
                return back()->withErrors(['inscripcion' => $respuesta->getData()->error]);
            }

            return $this->volver($retiro, 'Inscripción actualizada.', ['tipo' => $tipo]);
        }
        if ($accion === 'borrar') {
            $tipo = $this->tipo($request->input('tipo'));
            $borradas = $retiro->escribir(fn () => Inscripciones::consulta($retiro, $tipo)->where('id', $request->input('id'))->delete());
            abort_unless($borradas, 404);

            return $this->volver($retiro, 'Inscripción eliminada.', ['tipo' => $tipo]);
        }
        if ($accion === 'aforo') {
            $datos = $request->validate(['max_ninos' => 'required|integer|min:0|max:10000', 'max_ninas' => 'required|integer|min:0|max:10000', 'max_total' => 'required|integer|min:0|max:10000']);
            $jsonRequest = Request::create('/api/plazas', 'PUT', ['maxNinos' => (int) $datos['max_ninos'], 'maxNinas' => (int) $datos['max_ninas'], 'maxTotal' => (int) $datos['max_total']]);
            $jsonRequest->attributes->set(Retiro::class, $retiro);
            app(ConfiguracionController::class)->plazas($jsonRequest);

            return $this->volver($retiro, 'Aforo actualizado.', ['seccion' => 'configuracion']);
        }
        if ($accion === 'catalogo') {
            $tipo = $request->validate(['catalogo' => ['required', 'string', 'in:'.implode(',', array_keys(Retiro::CATALOGOS))]])['catalogo'];
            $filas = $request->validate(['filas' => ['required', 'array', 'max:100'], 'filas.*.valor' => ['nullable', 'string', 'max:100']])['filas'];
            $valores = [];
            foreach ($filas as $indice => $fila) {
                if (is_string($fila['valor'] ?? null) && trim($fila['valor']) !== '') {
                    $valores[] = ['valor' => trim($fila['valor']), 'activo' => $request->boolean('filas.'.$indice.'.activo')];
                }
            }
            $jsonRequest = Request::create('/api/catalogos/'.$tipo, 'PUT', compact('valores'));
            $jsonRequest->attributes->set(Retiro::class, $retiro);
            app(ConfiguracionController::class)->guardarCatalogo($jsonRequest, $tipo);

            return $this->volver($retiro, 'Catálogo actualizado.', ['seccion' => 'configuracion']);
        }
        if ($accion === 'crear_edicion') {
            $datos = $request->validate(['slug' => 'required|string|max:48|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'nombre' => 'required|string|max:100']);
            abort_if(DB::table('ediciones')->where('parroquia', $retiro->parroquia)->where('slug', $datos['slug'])->exists(), 409);
            DB::transaction(fn () => Retiro::crearEdicion($retiro->parroquia, $datos['slug'], $datos['nombre']));

            return $this->volver($retiro, 'Edición creada.');
        }
        if ($accion === 'crear_parroquia') {
            abort_unless($retiro->parroquia === 'cristorey' && $request->user('web')->administrador, 403);
            $datos = $request->validate(['slug' => 'required|string|max:48|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'nombre' => 'required|string|max:100', 'password' => 'required|string|min:12|max:128']);
            DB::transaction(function () use ($datos) {
                DB::table('parroquias')->insert(['slug' => $datos['slug'], 'nombre' => $datos['nombre'], 'activa' => true, 'creada_en' => now(), 'clave_hash' => Hash::make(hash('sha256', $datos['password']))]);
                Retiro::crearEdicion($datos['slug'], Retiro::PUBLICA, 'VII retiro');
            });

            return $this->volver($retiro, 'Parroquia creada.');
        }
        if ($accion === 'editar_parroquia') {
            abort_unless($retiro->parroquia === 'cristorey' && $request->user('web')->administrador, 403);
            $slug = (string) $request->input('slug');
            abort_unless(Retiro::slugValido($slug) && $slug !== 'cristorey', 422);
            $datos = $request->validate(['nombre' => 'required|string|max:100', 'activa' => 'required|boolean']);
            $jsonRequest = Request::create('/api/parroquias/'.$slug, 'PATCH', ['nombre' => $datos['nombre'], 'activa' => $datos['activa'] === '1' || $datos['activa'] === true]);
            $jsonRequest->attributes->set(Retiro::class, $retiro);
            app(ConfiguracionController::class)->actualizarParroquia($jsonRequest, $slug);

            return $this->volver($retiro, 'Parroquia actualizada.');
        }
        if ($accion === 'revocar_invitacion') {
            abort_unless($retiro->edicion === Retiro::PUBLICA, 409);
            $jsonRequest = Request::create('/api/coordinacion/invitacion-servidores', 'DELETE');
            $jsonRequest->attributes->set(Retiro::class, $retiro);
            app(CoordinacionController::class)->invitacion($jsonRequest);

            return $this->volver($retiro, 'Invitación revocada.', ['seccion' => 'configuracion']);
        }
        if ($accion === 'invitacion') {
            $dias = $request->validate(['dias' => 'required|integer|min:1|max:30'])['dias'];
            $jsonRequest = Request::create('/api/coordinacion/invitacion-servidores', 'POST', ['dias' => (int) $dias]);
            $jsonRequest->attributes->set(Retiro::class, $retiro);
            $respuesta = app(CoordinacionController::class)->invitacion($jsonRequest);

            return back()->with('clave_generada', $respuesta->getData()->clave)->with('mensaje', 'Clave generada. Cópiala ahora; no volverá a mostrarse.');
        }
        abort(422, 'Acción no válida.');
    }

    public function editar(Request $request): View
    {
        $retiro = $request->attributes->get(Retiro::class);
        $tipo = $this->tipo($request->query('tipo', Inscripciones::CAMINANTE));
        $fila = Inscripciones::consulta($retiro, $tipo)->where('id', $request->route('id', $request->query('id')))->first();
        abort_unless($fila, 404);

        return view('panel-editar', ['retiro' => $retiro, 'parroquia' => $retiro->parroquia, 'tipo' => $tipo, 'ficha' => Inscripciones::ficha($fila)]);
    }

    public function exportar(Request $request): StreamedResponse
    {
        $retiro = $request->attributes->get(Retiro::class);
        $tipo = $this->tipo($request->query('tipo', Inscripciones::CAMINANTE));
        [$filtros] = $this->filtros($request, $retiro, $tipo);
        $filas = $this->filtrar(Inscripciones::lista($retiro, $tipo), $tipo, $filtros);

        return response()->streamDownload(function () use ($filas) {
            $salida = fopen('php://output', 'w');
            $campos = array_values(array_filter(array_keys($filas[0] ?? []), fn ($campo) => ! in_array($campo, ['id', 'estado'], true)));
            fputcsv($salida, ['id', 'estado', ...$campos], ';');
            foreach ($filas as $fila) {
                $valores = [$fila['id'], $fila['estado']];
                foreach ($campos as $campo) {
                    $valor = $fila[$campo] ?? '';
                    $valor = is_array($valor) ? Retiro::json($valor) : (string) $valor;
                    $valores[] = preg_match('/^[\s]*[=+@\-]/u', $valor) ? "'".$valor : $valor;
                }
                fputcsv($salida, $valores, ';');
            }
            fclose($salida);
        }, 'bartimeo-'.$retiro->parroquia.'-'.$retiro->edicion.'-'.$tipo.'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function mapa(Request $request): View
    {
        $retiro = $request->attributes->get(Retiro::class);

        return view('mapa', ['retiro' => $retiro, 'parroquia' => $retiro->parroquia, 'ediciones' => DB::table('ediciones')->where('parroquia', $retiro->parroquia)->orderByDesc('id')->get(['slug', 'nombre'])]);
    }

    private function tipo(mixed $tipo): string
    {
        abort_unless(in_array($tipo, [Inscripciones::CAMINANTE, Inscripciones::SERVIDOR], true), 404);

        return $tipo;
    }

    private function filtros(Request $request, Retiro $retiro, string $tipo): array
    {
        $siNo = ['si' => 'Sí', 'no' => 'No'];
        $opciones = $tipo === Inscripciones::SERVIDOR ? [
            'origen' => ['Todas las parroquias', DB::table('parroquias')->orderBy('nombre')->pluck('nombre', 'nombre')->all()],
            'servicio' => ['Todos los servicios anteriores', array_combine($servicios = $retiro->valores('servicio'), $servicios)],
            'jueves' => ['Montaje Jueves: Todos', $siNo],
            'alergias' => ['Alergias: Todas', ['si' => 'Con alergias', 'no' => 'Sin alergias']],
            'experiencia' => ['Experiencia: Todos', ['si' => 'Ha servido antes', 'no' => 'Primer servicio']],
        ] : [
            'espera' => ['Espera: Todos', $siNo],
            'experiencia' => ['Inscripciones previas', ['si' => 'Una o más', 'no' => 'Ninguna']],
            'primera' => ['Primera vez en Cristo Rey', $siNo],
            'sacramentos' => ['Todos los sacramentos', ['bautismo' => 'Bautismo', 'comunion' => 'Primera comunión', 'ambos' => 'Ambos', 'ninguno' => 'Ninguno']],
            'alergias' => ['Alergias: Todas', ['si' => 'Con alergias', 'no' => 'Sin alergias']],
        ];
        $filtros = ['vista' => $request->query('vista') === 'tarjetas' ? 'tarjetas' : 'tabla', 'orden' => $request->query('orden') === 'desc' ? 'desc' : 'asc'];
        $busqueda = $request->query('q');
        $filtros['q'] = is_string($busqueda) ? mb_substr(trim($busqueda), 0, 120) : '';
        foreach ($opciones as $clave => [, $valores]) {
            $valor = $request->query($clave);
            $filtros[$clave] = is_string($valor) && array_key_exists($valor, $valores) ? $valor : '';
        }

        return [$filtros, $opciones];
    }

    private function filtrar(array $inscritos, string $tipo, array $filtros): array
    {
        $servidor = $tipo === Inscripciones::SERVIDOR;
        $campos = $servidor ? ['nombre', 'apellidos', 'movil', 'bartimeoOrigen', 'alergias'] : ['nombre', 'apellidos', 'familiar1Nombre', 'familiar1Telefono', 'colegio'];
        $buscar = fn (string $texto): string => Str::ascii(mb_strtolower($texto));
        $termino = $buscar($filtros['q']);
        $resultado = array_filter($inscritos, function (array $ficha) use ($filtros, $servidor, $campos, $buscar, $termino, $tipo): bool {
            $valores = implode(' ', array_intersect_key($ficha, array_flip($campos)));
            $esperado = fn (string $campo, bool $valor): bool => empty($filtros[$campo]) || ($filtros[$campo] === 'si') === $valor;
            if (! str_contains($buscar($valores), $termino) || ! $esperado('alergias', $this->tieneAlergia($ficha, $tipo))) {
                return false;
            }
            if ($servidor) {
                return ($filtros['origen'] === '' || ($ficha['bartimeoOrigen'] ?? null) === $filtros['origen'])
                    && ($filtros['servicio'] === '' || in_array($filtros['servicio'], (array) ($ficha['serviciosHechos'] ?? []), true))
                    && $esperado('jueves', ($ficha['montajeJueves'] ?? null) === 'Sí')
                    && $esperado('experiencia', ($ficha['haServido'] ?? null) === 'Sí');
            }

            $bautismo = ! empty($ficha['bautismoRecibido']);
            $comunion = ! empty($ficha['primeraComunionRecibida']);

            return $esperado('espera', ($ficha['listaEsperaPrevia'] ?? null) === 'Sí')
                && $esperado('experiencia', (int) ($ficha['inscripcionesPrevias'] ?? 0) > 0)
                && $esperado('primera', ($ficha['primeraVezCristoRey'] ?? null) === true)
                && match ($filtros['sacramentos']) {
                    'bautismo' => $bautismo, 'comunion' => $comunion, 'ambos' => $bautismo && $comunion,
                    'ninguno' => ! $bautismo && ! $comunion, default => true,
                };
        });
        $nombre = fn (array $ficha): string => $buscar(($ficha['nombre'] ?? '').' '.($ficha['apellidos'] ?? ''));
        $direccion = $filtros['orden'] === 'desc' ? -1 : 1;
        usort($resultado, fn (array $a, array $b): int => $direccion * strnatcmp($nombre($a), $nombre($b)));

        return $resultado;
    }

    private function tieneAlergia(array $ficha, string $tipo): bool
    {
        return $tipo === Inscripciones::CAMINANTE ? ($ficha['tieneAlergia'] ?? null) === 'Sí'
            : ! in_array(mb_strtolower(trim($ficha['alergias'] ?? '')), ['', 'no', 'ninguna', 'ninguno'], true);
    }

    private function volver(Retiro $retiro, string $mensaje, array $query = []): RedirectResponse
    {
        return redirect()->route('bartimeo.panel', ['parroquia' => $retiro->parroquia, 'edicion' => $retiro->edicion] + $query)->with('mensaje', $mensaje);
    }
}
