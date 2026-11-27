@extends('layouts.bartimeo')

@push('styles')
    <link rel="stylesheet" href="/css/coordinacion.css">
@endpush

@section('content')
@php
    $basePanel = ['parroquia' => $retiro->parroquia, 'edicion' => $retiro->edicion];
    $pestanas = [
        ['servidor', 'Servidores ('.($conteosPanel['servidor'] ?? 0).')', 'usuarios', route('bartimeo.panel', $basePanel + ['tipo' => 'servidor'])],
        ['caminante', 'Caminantes ('.($conteosPanel['caminante'] ?? 0).')', 'brujula', route('bartimeo.panel', $basePanel + ['tipo' => 'caminante'])],
        ['asistencias', 'Asistencias', 'ok', route('bartimeo.asistencias', $basePanel)],
        ['mapa', 'Mapa de pantallas', 'mapa', route('bartimeo.mapa', $basePanel)],
    ];
    $activa = trim($__env->yieldContent('pestana', ''));
    $pagina = request()->route()->getName();
    $edicionActual = $edicionesPanel->firstWhere('slug', $retiro->edicion);
@endphp
<main class="coord-wrap">
    <header class="coord-box coord-header">
        <div class="coord-brand">
            <img src="/logo-coordinacion.png" alt="" width="46" height="46">
            <h1>Panel de Coordinación · {{ $retiro->edicion === 'vii' ? 'VII Bartimeo Córdoba' : ($edicionActual->nombre ?? 'Bartimeo Córdoba') }}</h1>
        </div>
        <div class="coord-actions">
            <a class="coord-btn" href="{{ request()->fullUrl() }}"><x-coord-icon name="recargar" /> Actualizar</a>
            @yield('acciones')
            <a class="coord-btn" href="{{ route($activa === 'servidor' ? 'bartimeo.servidores' : 'bartimeo.caminantes', ['parroquia' => $retiro->parroquia]) }}"><x-coord-icon name="externo" /> Ver Formulario</a>
            <form method="post" action="{{ route('bartimeo.salir', ['parroquia' => $retiro->parroquia]) }}">
                @csrf
                <button class="coord-btn coord-btn-danger" type="submit"><x-coord-icon name="salir" /> Salir</button>
            </form>
        </div>
    </header>

    <nav class="coord-tabs" aria-label="Secciones de coordinación">
        @foreach ($pestanas as [$clave, $texto, $icono, $url])
            <a href="{{ $url }}" @if ($clave === $activa) aria-current="page" @endif><x-coord-icon :name="$icono" /> {{ $texto }}</a>
        @endforeach
    </nav>

    <div class="coord-edicion">
        <form method="get" action="{{ route($pagina, ['parroquia' => $retiro->parroquia]) }}">
            @if (in_array($activa, ['servidor', 'caminante'], true))
                <input type="hidden" name="tipo" value="{{ $activa }}">
            @endif
            <label for="coord-edicion">Edición</label>
            <div class="d-flex gap-2">
                <select class="coord-control" id="coord-edicion" name="edicion">
                    @foreach ($edicionesPanel as $edicion)
                        <option value="{{ $edicion->slug }}" @selected($edicion->slug === $retiro->edicion)>{{ $edicion->nombre }}</option>
                    @endforeach
                </select>
                @if ($edicionesPanel->count() > 1)<button class="coord-btn">Aplicar</button>@endif
            </div>
        </form>
        <a class="coord-btn" href="{{ route('bartimeo.panel', $basePanel + ['seccion' => 'configuracion']) }}">Configuración</a>
        @if (auth('web')->user()?->administrador)
            <a class="coord-btn" href="{{ route('bartimeo.usuarios', ['parroquia' => $retiro->parroquia]) }}">Administrar usuarios</a>
        @endif
    </div>

    @if (session('mensaje'))<p class="alert alert-success" role="status">{{ session('mensaje') }}</p>@endif
    @if ($errors->any())
        <ul class="alert alert-danger ps-5" role="alert">
            @foreach ($errors->all() as $error)<li>{{ $error }}</li>@endforeach
        </ul>
    @endif
    @yield('coord-content')
</main>
@endsection
