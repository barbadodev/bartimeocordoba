<?php

namespace App\Http\Controllers;

use App\Bartimeo\Inscripciones;
use App\Bartimeo\Retiro;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
        $tipo = $request->query('tipo', Inscripciones::CAMINANTE);
        abort_unless(in_array($tipo, [Inscripciones::CAMINANTE, Inscripciones::SERVIDOR], true), 404);
        $inscritos = Inscripciones::lista($retiro, $tipo);
        $total = count($inscritos);
        $metricas = ['total' => $total, 'confirmados' => count(array_filter($inscritos, fn ($ficha) => $ficha['estado'] === 'Confirmado'))];
        foreach (['tallaCamiseta', 'tallaCamisetaBlanca', 'tallaCamisetaGris', 'tallaSudadera'] as $campo) {
            $metricas[$campo] = collect($inscritos)->pluck($campo)->filter()->countBy()->all();
        }

        $busqueda = $request->query('q');
        if (is_string($busqueda) && trim($busqueda) !== '') {
            $busqueda = mb_strtolower(mb_substr(trim($busqueda), 0, 120));
            $inscritos = array_filter($inscritos, fn (array $ficha): bool => str_contains(mb_strtolower(($ficha['nombre'] ?? '').' '.($ficha['apellidos'] ?? '')), $busqueda));
        }

        return view('panel', ['retiro' => $retiro, 'parroquia' => $retiro->parroquia, 'inscritos' => $inscritos, 'tipo' => $tipo, 'metricas' => $metricas,
            'busqueda' => is_string($busqueda) ? $busqueda : '',
            'ediciones' => DB::table('ediciones')->where('parroquia', $retiro->parroquia)->orderByDesc('id')->get(['slug', 'nombre']),
            'configuracion' => $retiro->fila()->first(), 'mensaje' => session('mensaje')]);
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

            return $this->volver($retiro, 'Aforo actualizado.');
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
        $filas = Inscripciones::lista($retiro, $tipo);

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

    private function volver(Retiro $retiro, string $mensaje, array $query = []): RedirectResponse
    {
        return redirect()->route('bartimeo.panel', ['parroquia' => $retiro->parroquia, 'edicion' => $retiro->edicion] + $query)->with('mensaje', $mensaje);
    }
}
