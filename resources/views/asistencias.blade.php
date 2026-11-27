@extends('layouts.bartimeo')

@section('title', 'Asistencias | Bartimeo Córdoba')

@section('content')
@php
    $parametros = ['parroquia' => $parroquia, 'edicion' => $retiro->edicion];
    $guardar = route('bartimeo.asistencias.guardar', $parametros);
    $marcas = $reunion ? (array) ($estado['att']->{$reunion->id} ?? (object) []) : [];
    $colores = ['' => 'btn-outline-secondary', 'p' => 'btn-success', 'i' => 'btn-warning', 'a' => 'btn-outline-danger'];
@endphp
<main class="container py-4">
    <header class="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
        <div><a href="{{ route('bartimeo.panel', $parametros) }}">Volver a coordinación</a><h1 class="title-serif mt-2">Asistencias</h1></div>
        <div class="d-flex gap-2">
            <a class="btn btn-outline-primary" href="{{ route('bartimeo.asistencias.plantilla', $parametros) }}">Plantilla Excel</a>
            <a class="btn btn-outline-primary" href="{{ route('bartimeo.asistencias.exportar', $parametros) }}">Exportar matriz</a>
        </div>
    </header>
    @if (session('mensaje'))
        <p class="alert alert-success" role="status">{{ session('mensaje') }}</p>
    @endif
    @if ($errors->any())
        <ul class="alert alert-danger ps-5" role="alert">@foreach ($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul>
    @endif
    <section class="card bartimeo-card mb-4">
        <div class="card-body">
            <h2 class="h5">Reuniones</h2>
            <div class="row g-3">
                @if ($reunion)
                    <form action="{{ route('bartimeo.asistencias', ['parroquia' => $parroquia]) }}" class="col-md-6">
                        <input type="hidden" name="edicion" value="{{ $retiro->edicion }}">
                        <label class="form-label" for="reunion">Selecciona una reunión</label>
                        <div class="input-group">
                            <select class="form-select" id="reunion" name="reunion">
                                @foreach ($estado['meetings'] as $fecha)
                                    <option value="{{ $fecha->id }}" @selected($fecha->id === $reunion->id)>{{ \Illuminate\Support\Carbon::parse($fecha->date)->format('d/m/Y') }}</option>
                                @endforeach
                            </select>
                            <button class="btn btn-outline-primary">Ver</button>
                        </div>
                    </form>
                @endif
                <form method="post" action="{{ $guardar }}" class="col-md-6">
                    @csrf
                    <input type="hidden" name="revision" value="{{ $estado['revision'] }}">
                    <label class="form-label" for="fecha">Fecha de nueva reunión</label>
                    <div class="input-group"><input class="form-control" type="date" id="fecha" name="fecha" required><button class="btn btn-primary" name="accion" value="reunion">Crear</button></div>
                </form>
            </div>
        </div>
    </section>
    @if ($reunion)
        <section id="toma" aria-labelledby="toma-titulo" class="mb-4">
            <div class="d-flex flex-wrap justify-content-between gap-2 align-items-center mb-2">
                <h2 id="toma-titulo" class="title-serif h4 mb-0">Toma de asistencia</h2>
                <form action="{{ $guardar }}" method="post">
                    @csrf
                    <input type="hidden" name="revision" value="{{ $estado['revision'] }}">
                    <input type="hidden" name="reunion" value="{{ $reunion->id }}">
                    <button name="accion" value="todos" class="btn btn-outline-success btn-sm">Marcar todos presentes</button>
                </form>
            </div>
            <p class="text-body-secondary">Pulsa el estado para alternar entre Sin marcar, Asiste, Incidencia y Ausente.</p>
            @foreach (['Caminantes', 'Asistentes'] as $grupo)
                @php($personas = $grupos->get($grupo, collect()))
                <section class="card bartimeo-card mb-3">
                    <div class="card-body">
                        <h3 class="h5">{{ $grupo }} <span class="text-body-secondary">({{ $personas->count() }})</span></h3>
                        <ul class="list-group list-group-flush">
                            @forelse ($personas as $persona)
                                @php($marca = $marcas[$persona['id']] ?? '')
                                <li class="list-group-item d-flex flex-wrap align-items-center justify-content-between gap-2" id="persona-{{ $persona['id'] }}">
                                    <span>{{ $persona['name'] }} @if (!empty($persona['foraneo']))<small class="text-body-secondary">· Otra ciudad</small>@endif @if (!empty($persona['motivoExcepcion']))<small class="text-body-secondary">· Excepción</small>@endif</span>
                                    <form method="post" action="{{ $guardar }}#persona-{{ $persona['id'] }}">
                                        @csrf
                                        <input type="hidden" name="revision" value="{{ $estado['revision'] }}">
                                        <input type="hidden" name="reunion" value="{{ $reunion->id }}">
                                        <input type="hidden" name="persona" value="{{ $persona['id'] }}">
                                        <button type="submit" name="accion" value="marca" class="btn btn-sm {{ $colores[$marca] ?? $colores[''] }}"
                                            @disabled(empty($persona['inscritoActivo']) && empty($persona['historicoImportado']) && empty($persona['motivoExcepcion']))
                                            aria-label="{{ $persona['name'] }} · {{ $estados[$marca] ?? $estados[''] }}">{{ $estados[$marca] ?? $estados[''] }}</button>
                                    </form>
                                </li>
                            @empty
                                <li class="list-group-item text-body-secondary">No hay personas en este grupo.</li>
                            @endforelse
                        </ul>
                    </div>
                </section>
            @endforeach
            <details class="mb-3">
                <summary>Registrar una asistencia excepcional</summary>
                <form method="post" action="{{ $guardar }}" class="card card-body mt-2">
                    @csrf
                    <input type="hidden" name="revision" value="{{ $estado['revision'] }}">
                    <input type="hidden" name="reunion" value="{{ $reunion->id }}">
                    <label class="form-label" for="excepcion-nombre">Nombre</label><input class="form-control mb-2" id="excepcion-nombre" name="nombre" maxlength="500" required>
                    <label class="form-label" for="excepcion-motivo">Motivo</label><input class="form-control mb-2" id="excepcion-motivo" name="motivo" maxlength="500" required>
                    <label class="form-check mb-2"><input class="form-check-input" name="caminante" type="checkbox" value="1"> Caminante</label>
                    <label class="form-check mb-2"><input class="form-check-input" name="foraneo" type="checkbox" value="1"> De otra ciudad</label>
                    <button class="btn btn-primary align-self-start" name="accion" value="excepcion">Registrar excepción</button>
                </form>
            </details>
            <details>
                <summary>Restablecer marcas o eliminar la reunión</summary>
                <form method="post" action="{{ $guardar }}" class="d-flex gap-2 mt-2">
                    @csrf
                    <input type="hidden" name="revision" value="{{ $estado['revision'] }}">
                    <input type="hidden" name="reunion" value="{{ $reunion->id }}">
                    <button class="btn btn-outline-danger" name="accion" value="limpiar">Dejar todas las marcas en blanco</button>
                    <button class="btn btn-danger" name="accion" value="borrar_reunion">Eliminar reunión y sus marcas</button>
                </form>
            </details>
        </section>
    @endif
    <details class="card bartimeo-card p-3 mb-3">
        <summary class="fw-semibold">Gestionar participantes ({{ $miembros->count() }})</summary>
        <ul class="list-group list-group-flush mt-2">
            @foreach ($miembros as $miembro)
                <li class="list-group-item">
                    <details>
                        <summary>{{ $miembro['name'] }} · {{ empty($miembro['caminante']) ? 'Asistente' : 'Caminante' }}</summary>
                        <form method="post" action="{{ $guardar }}" class="mt-2">
                            @csrf
                            <input type="hidden" name="revision" value="{{ $estado['revision'] }}">
                            <input type="hidden" name="persona" value="{{ $miembro['id'] }}">
                            <label class="form-label" for="nombre-{{ $miembro['id'] }}">Nombre</label>
                            <input class="form-control mb-2" id="nombre-{{ $miembro['id'] }}" name="nombre" value="{{ $miembro['name'] }}" required maxlength="500" @readonly(!empty($miembro['inscritoActivo']))>
                            <label class="form-check mb-2"><input class="form-check-input" name="caminante" type="checkbox" value="1" @checked(!empty($miembro['caminante']))> Caminante</label>
                            <label class="form-check mb-2"><input class="form-check-input" name="foraneo" type="checkbox" value="1" @checked(!empty($miembro['foraneo']))> De otra ciudad</label>
                            <button class="btn btn-sm btn-outline-primary" name="accion" value="participante">Guardar</button>
                            @if (empty($miembro['inscritoActivo']))
                                <details class="mt-2"><summary>Eliminar registro</summary><button class="btn btn-sm btn-danger mt-2" name="accion" value="borrar_participante">Eliminar participante y marcas</button></details>
                            @endif
                        </form>
                    </details>
                </li>
            @endforeach
        </ul>
    </details>
    <section class="card bartimeo-card">
        <div class="card-body">
            <h2 class="h5">Importar participantes en Excel</h2>
            <form method="post" enctype="multipart/form-data" action="{{ route('bartimeo.asistencias.importar', $parametros) }}">
                @csrf
                <input type="hidden" name="revision" value="{{ $estado['revision'] }}">
                <label class="form-label" for="archivo">Archivo XLSX</label>
                <input class="form-control mb-2" id="archivo" name="archivo" type="file" accept=".xlsx" required>
                <button class="btn btn-primary">Importar participantes</button>
            </form>
        </div>
    </section>
</main>
@endsection
