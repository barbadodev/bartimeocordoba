@extends('layouts.coordinacion')

@section('title', 'Panel de coordinación | Bartimeo Córdoba')
@section('pestana', $tipo)

@php
    $servidores = $tipo === 'servidor';
    $grupo = $servidores ? 'servidores' : 'caminantes';
    $base = ['parroquia' => $retiro->parroquia, 'edicion' => $retiro->edicion, 'tipo' => $tipo];
    $consulta = $base + array_filter($filtros, fn ($valor) => $valor !== '');
    $exportar = route('bartimeo.panel.exportar', $consulta);
    $resumen = $servidores ? [
        ['Total Servidores', $total, 'Inscripciones registradas', 'usuarios', '#5c1824'],
        ['Montaje Jueves', $metricas['jueves'], 'Disponibles para subir el jueves', 'calendario', '#916016'],
        ['Alergias / Dietas', $metricas['alergias'], 'Requieren atención en cocina', 'aviso', '#bd262b'],
        ['Han Servido Antes', $metricas['experiencia'], 'Con experiencia en Bartimeo', 'ok', '#276b34'],
        ['Primer Servicio', $metricas['nuevos'], 'Nuevas incorporaciones', 'escudo', '#255d9d'],
    ] : [
        ['Total Caminantes', $total, 'Inscripciones recibidas', '', '#5c1824'],
        ['En lista de espera previa', $metricas['espera'], 'Retiros anteriores Bartimeo', '', '#a46106'],
        ['Con alergias / intolerancias', $metricas['alergias'], 'Requieren atención en cocina', '', '#bd262b'],
        ['Con medicación / salud', $metricas['salud'], 'Seguimiento de enfermería', '', '#355d9b'],
    ];
@endphp

@section('acciones')
    @if ($servidores)
        @if ($inscritos)
            <a class="coord-btn coord-btn-primary" href="{{ $exportar }}"><x-coord-icon name="descargar" /> Exportar a Excel</a>
        @else
            <span class="coord-btn coord-btn-primary" aria-disabled="true"><x-coord-icon name="descargar" /> Exportar a Excel</span>
        @endif
    @endif
@endsection

@section('coord-content')
    @if (session('clave_generada'))
        <p class="alert alert-warning">Clave de invitación <span class="font-monospace text-break">{{ session('clave_generada') }}</span></p>
    @endif
    <section class="coord-metrics {{ $servidores ? '' : 'coord-metrics-caminantes' }}" aria-label="Métricas de {{ $grupo }}">
        @foreach ($resumen as [$titulo, $cantidad, $detalle, $icono, $color])
            <article class="coord-box coord-metric" style="--acento: {{ $color }}">
                @if ($icono !== '')<x-coord-icon :name="$icono" />@endif
                <small>{{ $titulo }}</small>
                <strong>{{ $cantidad }}</strong>
                <span>{{ $detalle }}</span>
            </article>
        @endforeach
    </section>

    @if ($servidores)
        <section class="coord-box coord-section">
            <h2 class="coord-section-title"><x-coord-icon name="camiseta" /> Conteo de ropa para el pedido</h2>
            <div class="coord-clothing">
                @foreach (['tallaCamisetaBlanca' => 'Camiseta BLANCA', 'tallaCamisetaGris' => 'Camiseta GRIS', 'tallaSudadera' => 'Sudadera'] as $campo => $prenda)
                    <article>
                        <header><strong>{{ $prenda }}:</strong><span class="coord-pill">{{ array_sum($tallas[$campo]) }} uds.</span></header>
                        @forelse ($tallas[$campo] as $talla => $cantidad)
                            <span class="coord-pill">{{ $talla }} · {{ $cantidad }}</span>
                        @empty
                            <em class="small text-body-secondary">Sin prendas solicitadas</em>
                        @endforelse
                    </article>
                @endforeach
            </div>
        </section>
    @endif

    <form class="coord-box coord-filters" method="get" action="{{ route('bartimeo.panel', ['parroquia' => $retiro->parroquia]) }}" aria-label="Filtros de {{ $grupo }}">
        <input type="hidden" name="edicion" value="{{ $retiro->edicion }}">
        <input type="hidden" name="tipo" value="{{ $tipo }}">
        <input type="hidden" name="orden" value="{{ $filtros['orden'] }}">
        <div class="coord-filter-row">
            <label class="coord-search {{ $servidores ? 'flex-fill w-100' : '' }}">
                <span class="visually-hidden">Buscar {{ $grupo }}</span><x-coord-icon name="buscar" />
                <input class="coord-control" type="search" name="q" maxlength="120" value="{{ $filtros['q'] }}" placeholder="{{ $servidores ? 'Buscar por nombre, apellidos, teléfono, origen o alergias…' : 'Buscar caminante, familiar, colegio…' }}">
            </label>
            @foreach ($opciones as $campo => [$etiqueta, $valores])
                <select class="coord-control" name="{{ $campo }}" aria-label="{{ $etiqueta }}">
                    <option value="">{{ $etiqueta }}</option>
                    @foreach ($valores as $valor => $texto)
                        <option value="{{ $valor }}" @selected($filtros[$campo] === (string) $valor)>{{ $texto }}</option>
                    @endforeach
                </select>
            @endforeach
            <button class="coord-btn coord-btn-small" name="vista" value="{{ $filtros['vista'] }}">Aplicar filtros</button>
        </div>
        <div class="coord-filter-footer">
            <span>Mostrando <strong>{{ count($inscritos) }}</strong> de <strong>{{ $total }}</strong> {{ $grupo }} registrados</span>
            <div class="d-flex flex-wrap align-items-center gap-2">
                @unless ($servidores)
                    @if ($inscritos)
                        <a class="coord-btn coord-btn-primary coord-btn-small" href="{{ $exportar }}"><x-coord-icon name="descargar" /> Exportar Excel</a>
                    @else
                        <span class="coord-btn coord-btn-primary coord-btn-small" aria-disabled="true"><x-coord-icon name="descargar" /> Exportar Excel</span>
                    @endif
                @endunless
                @foreach (['tarjetas' => ['Tarjetas', 'tarjetas'], 'tabla' => ['Tabla', 'mapa']] as $vista => [$texto, $icono])
                    <button class="coord-btn coord-btn-small {{ $filtros['vista'] === $vista ? 'coord-btn-primary' : '' }}" name="vista" value="{{ $vista }}" aria-pressed="{{ $filtros['vista'] === $vista ? 'true' : 'false' }}"><x-coord-icon :name="$icono" /> {{ $texto }}</button>
                @endforeach
            </div>
        </div>
    </form>

    @php
        $columnas = $servidores ? ['Servidor', 'Contacto Directo', 'Alergias y Dietas', 'Tallas Pedidas', 'Contacto Emergencia', 'Acciones']
            : ['Caminante', 'Familiar y contacto', 'Colegio', 'Alergias / salud', 'Talla', 'Acciones'];
        $mostrarTabla = $filtros['vista'] === 'tabla' && ($inscritos || $servidores);
        $ordenar = route('bartimeo.panel', array_replace($consulta, ['orden' => $filtros['orden'] === 'asc' ? 'desc' : 'asc']));
    @endphp
    @if ($mostrarTabla)
        <div class="coord-box coord-table table-responsive">
            <table class="table">
                <thead><tr>
                    @foreach ($columnas as $columna)
                        <th scope="col" @if ($loop->first) aria-sort="{{ $filtros['orden'] === 'asc' ? 'ascending' : 'descending' }}" @endif>
                            @if ($loop->first)<a href="{{ $ordenar }}">{{ $columna }} ↕</a>@else{{ $columna }}@endif
                        </th>
                    @endforeach
                </tr></thead>
                <tbody>
                    @forelse ($inscritos as $ficha)
                        <tr>
                            <th scope="row">{{ trim(($ficha['nombre'] ?? '').' '.($ficha['apellidos'] ?? '')) }}<div class="small text-body-secondary fw-normal">{{ $servidores ? ($ficha['bartimeoOrigen'] ?? '') : ($ficha['estado'] ?? '') }}</div></th>
                            @if ($servidores)
                                <td>{{ $ficha['movil'] ?? '—' }}<br><small>{{ $ficha['email'] ?? '' }}</small></td>
                                <td>{{ $ficha['alergias'] ?? '—' }}</td>
                                <td>Blanca: {{ ($ficha['tallaCamisetaBlanca'] ?? '') ?: '—' }}<br>Gris: {{ ($ficha['tallaCamisetaGris'] ?? '') ?: '—' }}<br>Sudadera: {{ ($ficha['tallaSudadera'] ?? '') ?: '—' }}</td>
                                <td>{{ $ficha['emergenciaNombre'] ?? '—' }}<br><small>{{ $ficha['emergenciaTelefono'] ?? '' }}</small></td>
                            @else
                                <td>{{ $ficha['familiar1Nombre'] ?? '—' }}<br><small>{{ $ficha['familiar1Telefono'] ?? '' }}</small></td>
                                <td>{{ $ficha['colegio'] ?? '—' }}</td>
                                <td>{{ ($ficha['alergiaDetalle'] ?? '') ?: ($ficha['tieneAlergia'] ?? '—') }}<br><small>{{ $ficha['medicacion'] ?? '' }}</small></td>
                                <td>{{ $ficha['tallaCamiseta'] ?? '—' }}</td>
                            @endif
                            <td>
                                <a class="coord-btn coord-btn-small" href="{{ route('bartimeo.panel.editar', $base + ['id' => $ficha['id']]) }}">Editar</a>
                                <details class="mt-2">
                                    <summary class="small text-danger">Borrar</summary>
                                    <form method="post" action="{{ route('bartimeo.panel.guardar', $base) }}" class="mt-2">
                                        @csrf
                                        <input type="hidden" name="tipo" value="{{ $tipo }}"><input type="hidden" name="id" value="{{ $ficha['id'] }}">
                                        <button class="coord-btn coord-btn-small coord-btn-danger" name="accion" value="borrar">Confirmar borrado</button>
                                    </form>
                                </details>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="6"><div class="coord-empty"><strong>No se han encontrado registros con los filtros seleccionados</strong><p>Prueba a cambiar los términos de búsqueda o los selectores superiores.</p></div></td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    @elseif ($inscritos)
        <div class="coord-card-grid">
            @foreach ($inscritos as $ficha)
                <article class="coord-box coord-record">
                    <h2 class="h6 mb-2">{{ trim(($ficha['nombre'] ?? '').' '.($ficha['apellidos'] ?? '')) }}</h2>
                    <p class="coord-pill">{{ $ficha['estado'] ?? 'Registrado' }}</p>
                    <dl class="mb-2">
                        @foreach (($servidores ? ['bartimeoOrigen' => 'Parroquia', 'movil' => 'Teléfono', 'email' => 'Correo', 'alergias' => 'Alergias', 'emergenciaTelefono' => 'Emergencia'] : ['colegio' => 'Colegio', 'familiar1Nombre' => 'Familiar', 'familiar1Telefono' => 'Teléfono', 'alergiaDetalle' => 'Alergias', 'tallaCamiseta' => 'Talla']) as $clave => $texto)
                            @if (!empty($ficha[$clave]))<dt>{{ $texto }}</dt><dd>{{ $ficha[$clave] }}</dd>@endif
                        @endforeach
                    </dl>
                    <a class="coord-btn coord-btn-small" href="{{ route('bartimeo.panel.editar', $base + ['id' => $ficha['id']]) }}">Editar</a>
                    <details class="mt-2">
                        <summary class="small text-danger">Borrar</summary>
                        <form method="post" action="{{ route('bartimeo.panel.guardar', $base) }}" class="mt-2">
                            @csrf
                            <input type="hidden" name="tipo" value="{{ $tipo }}"><input type="hidden" name="id" value="{{ $ficha['id'] }}">
                            <button class="coord-btn coord-btn-small coord-btn-danger" name="accion" value="borrar">Confirmar borrado</button>
                        </form>
                    </details>
                </article>
            @endforeach
        </div>
    @else
        <div class="coord-box coord-empty"><x-coord-icon :name="$servidores ? 'usuarios' : 'brujula'" /><div><strong>No se encontraron {{ $grupo }}</strong></div><p>Prueba a modificar los filtros o el término de búsqueda.</p></div>
    @endif
@endsection
