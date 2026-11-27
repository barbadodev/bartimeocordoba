@extends('layouts.coordinacion')

@section('title', 'Asistencias | Bartimeo Córdoba')
@section('pestana', 'asistencias')

@section('coord-content')
@php
    $parametros = ['parroquia' => $parroquia, 'edicion' => $retiro->edicion];
    $guardar = route('bartimeo.asistencias.guardar', $parametros);
    $marcas = $reunion ? (array) ($estado['att']->{$reunion->id} ?? (object) []) : [];
    $colores = ['' => 'btn-outline-secondary', 'p' => 'btn-success', 'i' => 'btn-warning', 'a' => 'btn-outline-danger'];
    $vistaActual = request()->query('vista');
    $vistaActual = in_array($vistaActual, ['participantes', 'reuniones'], true) ? $vistaActual : 'toma';
    $reunionActual = $reunion ? ['reunion' => $reunion->id] : [];
    $gruposTotal = $grupos->sum(fn ($grupo) => $grupo->count());
    $conteo = $grupos->flatten(1)->countBy(fn (array $persona) => $marcas[$persona['id']] ?? '');
    $porcentaje = $gruposTotal ? round((($conteo['p'] ?? 0) + ($conteo['i'] ?? 0)) / $gruposTotal * 100) : 0;
    $q = request()->query('q');
    $q = is_string($q) ? mb_substr(trim($q), 0, 120) : '';
    $resaltar = request()->query('resaltar');
    $resaltar = is_string($resaltar) ? $resaltar : '';
@endphp
    <div class="coord-box coord-att-bar">
        <nav class="coord-segment" aria-label="Vistas de asistencia">
            @foreach (['toma' => ['Toma de Asistencia', 'ok'], 'participantes' => ['Participantes ('.$miembros->count().')', 'usuarios'], 'reuniones' => ['Reuniones ('.count($estado['meetings']).')', 'calendario']] as $clave => [$titulo, $icono])
                <a href="{{ route('bartimeo.asistencias', $parametros + $reunionActual + ['vista' => $clave]) }}" @if ($vistaActual === $clave) aria-current="page" @endif><x-coord-icon :name="$icono" /> {{ $titulo }}</a>
            @endforeach
        </nav>
        <div class="d-flex flex-wrap gap-2 align-items-center">
            <span class="badge rounded-pill text-bg-success">Guardado en el servidor</span>
            <a class="coord-btn" href="{{ route('bartimeo.asistencias.exportar', $parametros) }}"><x-coord-icon name="descargar" /> Exportar Matriz</a>
        </div>
    </div>
    @if ($vistaActual === 'reuniones')
    <section class="coord-box mb-4">
        <div class="card-body">
            <h2 class="h5">Reuniones</h2>
            <div class="row g-3">
                <form method="post" action="{{ route('bartimeo.asistencias.guardar', $parametros + ['vista' => 'reuniones']) }}" class="col-md-6">
                    @csrf
                    <input type="hidden" name="revision" value="{{ $estado['revision'] }}">
                    <label class="form-label" for="fecha">Fecha de nueva reunión</label>
                    <div class="input-group"><input class="form-control" type="date" id="fecha" name="fecha" required><button class="btn btn-primary" name="accion" value="reunion">Crear</button></div>
                </form>
            </div>
            <ul class="list-group list-group-flush mt-3">
                @forelse ($estado['meetings'] as $fecha)
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        {{ \Illuminate\Support\Carbon::parse($fecha->date)->locale('es')->translatedFormat('d \d\e F \d\e Y') }}
                        <a class="coord-btn coord-btn-small" href="{{ route('bartimeo.asistencias', $parametros + ['reunion' => $fecha->id]) }}">Abrir asistencia</a>
                    </li>
                @empty
                    <li class="list-group-item">Todavía no hay reuniones.</li>
                @endforelse
            </ul>
        </div>
    </section>
    @endif
    @if ($vistaActual === 'toma' && $reunion)
        <section id="toma" aria-labelledby="toma-titulo" class="mb-4">
            <div class="coord-box coord-section">
                <div class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
                    <form method="get" action="{{ route('bartimeo.asistencias', ['parroquia' => $parroquia]) }}" class="flex-grow-1" style="max-width: 480px">
                        <input type="hidden" name="edicion" value="{{ $retiro->edicion }}">
                        <label id="toma-titulo" class="form-label fw-semibold" for="reunion"><x-coord-icon name="calendario" /> Sesión / Reunión</label>
                        <div class="d-flex gap-2">
                            <select class="coord-control" id="reunion" name="reunion">
                                @foreach ($estado['meetings'] as $fecha)
                                    <option value="{{ $fecha->id }}" @selected($fecha->id === $reunion->id)>{{ \Illuminate\Support\Carbon::parse($fecha->date)->locale('es')->translatedFormat('D, d M (d \d\e F \d\e Y)') }}</option>
                                @endforeach
                            </select>
                            <button class="coord-btn coord-btn-small">Ver</button>
                        </div>
                    </form>
                    <form action="{{ $guardar }}" method="post" class="d-flex flex-wrap gap-2">
                        @csrf
                        <input type="hidden" name="revision" value="{{ $estado['revision'] }}">
                        <input type="hidden" name="reunion" value="{{ $reunion->id }}">
                        <button name="accion" value="todos" class="coord-btn"><x-coord-icon name="ok" /> Marcar todos presentes</button>
                        <details class="coord-confirmar">
                            <summary class="coord-btn text-danger">× Limpiar sesión</summary>
                            <div class="coord-box p-3">
                                <p class="small mb-2">Todas las marcas de esta reunión quedarán en blanco.</p>
                                <button class="coord-btn coord-btn-small coord-btn-danger" name="accion" value="limpiar">Confirmar limpieza</button>
                            </div>
                        </details>
                    </form>
                </div>
                <div class="row row-cols-2 row-cols-lg-4 g-2 g-md-3 mb-3">
                    @foreach ([['Asistieron', $conteo['p'] ?? 0, 'Marcados presentes', 'presente'], ['Incidencias', $conteo['i'] ?? 0, 'Voluntariado / Justificadas', 'incidencia'], ['Sin marcar', $conteo[''] ?? 0, 'de '.$gruposTotal.' registrados', ''], ['% Asistencia total', $porcentaje.'%', 'Presentes + Incidencias', 'porcentaje']] as [$nombre, $valor, $detalle, $estilo])
                        <div class="col"><div class="coord-att-stat {{ $estilo }}"><small class="text-uppercase">{{ $nombre }}</small><strong>{{ $valor }}</strong><small>{{ $detalle }}</small></div></div>
                    @endforeach
                </div>
                <p class="small mb-0"><strong>Instrucciones rápidas</strong>. Pulsa el estado para alternar entre Presente, Incidencia, Ausente y Sin marcar.</p>
            </div>

            <form class="coord-box coord-filters coord-filter-row" method="get" action="{{ route('bartimeo.asistencias', ['parroquia' => $parroquia]) }}">
                <input type="hidden" name="edicion" value="{{ $retiro->edicion }}">
                <input type="hidden" name="reunion" value="{{ $reunion->id }}">
                <label class="coord-search"><span class="visually-hidden">Buscar por nombre en la toma</span><x-coord-icon name="buscar" /><input class="coord-control" name="q" type="search" maxlength="120" value="{{ $q }}" placeholder="Buscar por nombre en la lista de toma…"></label>
                @foreach (['' => 'Todos', 'caminante' => 'Caminantes', 'foraneo' => 'De otra ciudad', 'sin' => 'Sin marcar', 'a' => 'Ausentes', 'p' => 'Presentes'] as $clave => $texto)
                    <button class="coord-btn coord-btn-small {{ $resaltar === $clave ? 'coord-btn-primary' : '' }}" name="resaltar" value="{{ $clave }}" title="Resaltar {{ mb_strtolower($texto) }}">{{ $texto }}</button>
                @endforeach
                <span class="small text-body-secondary">{{ $gruposTotal }} participantes</span>
            </form>
            @if ($q !== '' || $resaltar !== '')
                <p class="small text-body-secondary">Las coincidencias se resaltan en la lista completa.</p>
            @endif
            @foreach (['Caminantes', 'Asistentes'] as $grupo)
                @php
                    $personas = $grupos->get($grupo, collect());
                @endphp
                <section class="mb-3">
                        <h3 class="h5">{{ $grupo }} <span class="text-body-secondary">({{ $personas->count() }})</span></h3>
                        <ul class="coord-att-grid">
                            @forelse ($personas as $persona)
                                @php
                                    $marca = $marcas[$persona['id']] ?? '';
                                    $coincide = match ($resaltar) {
                                        'caminante' => !empty($persona['caminante']),
                                        'foraneo' => !empty($persona['foraneo']),
                                        'sin' => $marca === '',
                                        'p', 'a' => $marca === $resaltar,
                                        default => true,
                                    };
                                    $destacado = ($q !== '' || $resaltar !== '') && $coincide && str_contains(\Illuminate\Support\Str::ascii(mb_strtolower($persona['name'])), \Illuminate\Support\Str::ascii(mb_strtolower($q)));
                                @endphp
                                <li class="coord-att-item marca-{{ $marca }} {{ $destacado ? 'coord-destacado' : '' }}" id="persona-{{ $persona['id'] }}">
                                    <div><strong>{{ $persona['name'] }}</strong><br><span class="coord-pill">{{ $grupo === 'Caminantes' ? 'Caminante' : 'Asistente' }}</span> @if (!empty($persona['foraneo']))<small>· Otra ciudad</small>@endif @if (!empty($persona['motivoExcepcion']))<small>· Excepción</small>@endif</div>
                                    <form method="post" action="{{ route('bartimeo.asistencias.guardar', $parametros + ['q' => $q, 'resaltar' => $resaltar]) }}">
                                        @csrf
                                        <input type="hidden" name="revision" value="{{ $estado['revision'] }}">
                                        <input type="hidden" name="reunion" value="{{ $reunion->id }}">
                                        <input type="hidden" name="persona" value="{{ $persona['id'] }}">
                                        <button type="submit" name="accion" value="marca" class="btn btn-sm {{ $colores[$marca] ?? $colores[''] }}"
                                            @disabled(empty($persona['inscritoActivo']) && empty($persona['historicoImportado']) && empty($persona['motivoExcepcion']))
                                            aria-label="{{ $persona['name'] }} · {{ $estados[$marca] ?? $estados[''] }}">{{ $marca === 'p' ? '✓ Asistió' : ($estados[$marca] ?? $estados['']) }}</button>
                                    </form>
                                </li>
                            @empty
                                <li class="text-body-secondary">No hay personas en este grupo.</li>
                            @endforelse
                        </ul>
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
                <summary>Eliminar la reunión</summary>
                <form method="post" action="{{ $guardar }}" class="d-flex gap-2 mt-2">
                    @csrf
                    <input type="hidden" name="revision" value="{{ $estado['revision'] }}">
                    <input type="hidden" name="reunion" value="{{ $reunion->id }}">
                    <button class="btn btn-danger" name="accion" value="borrar_reunion">Eliminar reunión y sus marcas</button>
                </form>
            </details>
        </section>
    @elseif ($vistaActual === 'toma')
        <div class="coord-box coord-empty">
            <p>Todavía no hay reuniones.</p>
            <a class="coord-btn mt-3" href="{{ route('bartimeo.asistencias', $parametros + ['vista' => 'reuniones']) }}">Crear una reunión</a>
        </div>
    @endif
    @if ($vistaActual === 'participantes')
    <details class="card bartimeo-card p-3 mb-3">
        <summary class="fw-semibold">Gestionar participantes ({{ $miembros->count() }})</summary>
        <ul class="list-group list-group-flush mt-2">
            @foreach ($miembros as $miembro)
                <li class="list-group-item">
                    <details>
                        <summary>{{ $miembro['name'] }} · {{ empty($miembro['caminante']) ? 'Asistente' : 'Caminante' }}</summary>
                        <form method="post" action="{{ route('bartimeo.asistencias.guardar', $parametros + ['vista' => 'participantes']) }}" class="mt-2">
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
            <a class="coord-btn coord-btn-small mb-2" href="{{ route('bartimeo.asistencias.plantilla', $parametros) }}">Plantilla Excel</a>
            <form method="post" enctype="multipart/form-data" action="{{ route('bartimeo.asistencias.importar', $parametros) }}">
                @csrf
                <input type="hidden" name="revision" value="{{ $estado['revision'] }}">
                <label class="form-label" for="archivo">Archivo XLSX</label>
                <input class="form-control mb-2" id="archivo" name="archivo" type="file" accept=".xlsx" required>
                <button class="btn btn-primary">Importar participantes</button>
            </form>
        </div>
    </section>
    @endif
@endsection
