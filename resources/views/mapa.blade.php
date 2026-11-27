@extends('layouts.coordinacion')

@section('title', 'Mapa de coordinación | Bartimeo Córdoba')
@section('pestana', 'mapa')

@section('coord-content')
@php
    $publico = ['parroquia' => $parroquia];
    $privado = $publico + ['edicion' => $retiro->edicion];
    $columnas = [
        'Rutas de la aplicación' => [
            ['Portada', 'Página principal de Bartimeo.', 'inicio', 'Pública', route('bartimeo.portada', $publico)],
            ['Inscripción de caminantes', 'Formulario de inscripción y datos del caminante.', 'brujula', 'Pública', route('bartimeo.caminantes', $publico)],
            ['Inscripción de servidores', 'Formulario accesible con una invitación de servidores activa.', 'usuarios', 'Requiere invitación', route('bartimeo.servidores', $publico)],
            ['Portal de coordinación', 'Gestión de inscripciones, caminantes, asistencias y configuración.', 'escudo', 'Acceso con usuario y contraseña', route('bartimeo.acceso', $publico)],
        ],
        'Secciones de coordinación' => [
            ['Inscripciones de servidores', 'Listado, filtros, fichas y exportación.', 'usuarios', '', route('bartimeo.panel', $privado + ['tipo' => 'servidor'])],
            ['Inscripciones de caminantes', 'Listado y gestión de las inscripciones.', 'brujula', '', route('bartimeo.panel', $privado + ['tipo' => 'caminante'])],
            ['Asistencias', 'Reuniones, asistencia y participación.', 'calendario', '', route('bartimeo.asistencias', $privado)],
            ['Configuración', 'Ediciones, plazas, catálogos, parroquias e invitaciones.', 'mapa', '', route('bartimeo.panel', $privado + ['seccion' => 'configuracion'])],
        ],
    ];
@endphp
<div class="coord-map">
    <header class="coord-box coord-map-head d-flex align-items-center gap-3 mb-3">
        <span class="coord-map-icon"><x-coord-icon name="escudo" /></span>
        <div>
            <h2 class="title-serif mb-1">Mapa de pantallas</h2>
            <p class="mb-0">Accesos a las rutas y secciones de la aplicación.</p>
        </div>
    </header>
    <div class="row g-3">
        @foreach ($columnas as $titulo => $entradas)
            <div class="col-md-6">
                <section class="coord-box coord-map-panel h-100">
                    <h3 class="mb-3">{{ $titulo }}</h3>
                    @foreach ($entradas as [$nombre, $descripcion, $icono, $etiqueta, $url])
                        <a class="coord-map-link" href="{{ $url }}">
                            <span class="coord-map-icon"><x-coord-icon :name="$icono" /></span>
                            <span>
                                <strong class="d-block">{{ $nombre }}</strong>
                                <small class="d-block mt-1">{{ $descripcion }}</small>
                                @if ($etiqueta)<span class="coord-pill mt-2">{{ $etiqueta }}</span>@endif
                            </span>
                            <x-coord-icon name="externo" />
                        </a>
                    @endforeach
                </section>
            </div>
        @endforeach
    </div>
</div>
@endsection
