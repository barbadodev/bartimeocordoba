<?php

namespace App\Http\Controllers;

use App\Bartimeo\Inscripciones;
use App\Bartimeo\Retiro;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\InputBag;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

final class InscripcionesWebController
{
    public function show(Request $request): View
    {
        $retiro = $request->attributes->get(Retiro::class);
        $tipo = $request->route('tipo');

        return view($tipo === Inscripciones::SERVIDOR ? 'servidores' : 'caminantes', $this->datosVista($request, $retiro, $tipo));
    }

    public function store(Request $request, InscripcionController $inscripciones): RedirectResponse
    {
        $retiro = $request->attributes->get(Retiro::class);
        $tipo = $request->route('tipo') === 'servidor' ? Inscripciones::SERVIDOR : Inscripciones::CAMINANTE;
        $invitacion = $tipo === Inscripciones::SERVIDOR ? $this->invitacion($request, $retiro) : null;
        if ($tipo === Inscripciones::SERVIDOR && $invitacion === null) {
            return redirect()->route('bartimeo.servidores', ['parroquia' => $retiro->parroquia])
                ->withErrors(['invitacion' => 'Verifica la invitación antes de enviar la inscripción.']);
        }
        $datos = $request->except(['_token', 'idempotency_key', 'clave']);
        foreach (['aceptaRgpd', 'bautismoRecibido', 'primeraComunionRecibida'] as $campo) {
            $datos[$campo] = $request->boolean($campo);
        }
        $primeraVez = $request->input('primeraVezCristoRey');
        $datos['primeraVezCristoRey'] = match ($primeraVez) {
            'Sí' => true,
            'No' => false,
            default => null,
        };
        if (is_string($datos['anioNacimiento'] ?? null) && ctype_digit($datos['anioNacimiento'])) {
            $datos['anioNacimiento'] = (int) $datos['anioNacimiento'];
        }
        if (is_string($datos['inscripcionesPrevias'] ?? null) && ctype_digit($datos['inscripcionesPrevias'])) {
            $datos['inscripcionesPrevias'] = (int) $datos['inscripcionesPrevias'];
        }
        $datos['serviciosHechos'] = $request->input('serviciosHechos', []);
        $datos['familiaresAdicionales'] = $request->input('familiaresAdicionales', []);
        $clon = $request->duplicate([], ['_token' => null]);
        $clon->headers->set('Idempotency-Key', (string) $request->input('idempotency_key'));
        if ($invitacion !== null) {
            $clon->headers->set('X-Invitacion', $invitacion);
        }
        $clon->setJson(new InputBag($datos));

        try {
            $respuesta = $inscripciones->alta($clon, $tipo);
            $contenido = $respuesta->getData(true);
            if ($respuesta->getStatusCode() >= 400) {
                return redirect()->route('bartimeo.caminantes', ['parroquia' => $retiro->parroquia])
                    ->withErrors(['inscripcion' => $contenido['error'] ?? 'No se pudo registrar la inscripción.']);
            }
        } catch (HttpExceptionInterface $error) {
            return redirect()->route('bartimeo.'.($tipo === Inscripciones::SERVIDOR ? 'servidores' : 'caminantes'), ['parroquia' => $retiro->parroquia])
                ->withErrors(['inscripcion' => $error->getMessage()]);
        }

        return redirect()->route('bartimeo.confirmada', ['parroquia' => $retiro->parroquia, 'tipo' => $tipo])
            ->with('bartimeo.confirmacion', ['tipo' => $tipo]);
    }

    public function verificarInvitacion(Request $request, CoordinacionController $coordinacion): RedirectResponse
    {
        $retiro = $request->attributes->get(Retiro::class);
        $destino = redirect()->route('bartimeo.servidores', ['parroquia' => $retiro->parroquia]);
        try {
            $coordinacion->verificarInvitacion($request);
        } catch (HttpExceptionInterface $error) {
            return $destino->withErrors(['invitacion' => $error->getMessage()]);
        }
        $request->session()->put('bartimeo.invitacion.'.$retiro->parroquia, Crypt::encryptString($request->input('clave')));

        return $destino;
    }

    public function confirmada(Request $request): View
    {
        $retiro = $request->attributes->get(Retiro::class);
        $tipo = $request->route('tipo') === 'servidor' ? Inscripciones::SERVIDOR : Inscripciones::CAMINANTE;
        $confirmacion = $request->session()->pull('bartimeo.confirmacion', ['tipo' => $tipo]);

        return view('inscripcion-confirmada', ['parroquia' => $retiro->parroquia, 'confirmacion' => $confirmacion]);
    }

    private function datosVista(Request $request, Retiro $retiro, string $tipo): array
    {
        $servidor = $tipo === Inscripciones::SERVIDOR;
        $origen = resource_path('datos/retiro.json');
        $info = is_file($origen) ? json_decode(file_get_contents($origen), true, 512, JSON_THROW_ON_ERROR) : [];

        return [
            'parroquia' => $retiro->parroquia,
            'info' => $info[$servidor ? 'servidores' : 'caminantes'] ?? [],
            'catalogos' => array_combine(array_keys(Retiro::CATALOGOS), array_map(fn (string $catalogo) => $retiro->valores($catalogo), array_keys(Retiro::CATALOGOS))),
            'plazas' => $servidor ? null : Inscripciones::plazas($retiro),
            'parroquias' => $servidor ? DB::table('parroquias')->where('activa', true)->orderBy('nombre')->get(['nombre']) : [],
            'idempotencyKey' => (string) Str::uuid(),
            'invitacionVerificada' => $servidor && $this->invitacion($request, $retiro) !== null,
        ];
    }

    private function invitacion(Request $request, Retiro $retiro): ?string
    {
        $cifrada = $request->session()->get('bartimeo.invitacion.'.$retiro->parroquia);
        if (! is_string($cifrada)) {
            return null;
        }

        $clave = Crypt::decryptString($cifrada);

        return CoordinacionController::enlaceValido($retiro, 'servidores', $clave) ? $clave : null;
    }
}
