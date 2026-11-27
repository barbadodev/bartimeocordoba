@extends('layouts.bartimeo')
@section('title', 'Configuración · '.$parroquia)
@section('content')
<main class="container py-4"><header class="d-flex justify-content-between mb-4"><div><a href="{{ route('bartimeo.panel',['parroquia'=>$parroquia,'edicion'=>$retiro->edicion]) }}">← Volver al panel</a><h1 class="h2 mt-2">Configuración</h1><p>{{ $parroquia }} · {{ $retiro->edicion }}</p></div><a class="btn btn-outline-primary align-self-start" href="{{ route('bartimeo.mapa',['parroquia'=>$parroquia,'edicion'=>$retiro->edicion]) }}">Mapa</a></header>
@if($mensaje)<div class="alert alert-success">{{ $mensaje }}</div>@endif
@if ($errors->any())
    <ul class="alert alert-danger ps-5" role="alert">@foreach ($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul>
@endif
@if (session('clave_generada'))
    <p class="alert alert-warning">Clave de invitación <span class="font-monospace text-break">{{ session('clave_generada') }}</span></p>
@endif
<section class="card card-body mb-4">
    <h2 class="h4">Aforo de caminantes</h2>
    <form class="row g-3 align-items-end" method="post" action="{{ route('bartimeo.panel.guardar', ['parroquia' => $parroquia, 'edicion' => $retiro->edicion]) }}">
        @csrf
        @foreach (['max_ninos' => 'Niños', 'max_ninas' => 'Niñas', 'max_total' => 'Total'] as $campo => $etiqueta)
            <div class="col-sm">
                <label class="form-label" for="{{ $campo }}">{{ $etiqueta }}</label>
                <input class="form-control" type="number" min="0" max="10000" name="{{ $campo }}" id="{{ $campo }}" value="{{ $configuracion->$campo }}" required>
            </div>
        @endforeach
        <div class="col-sm-auto"><button class="btn btn-primary" name="accion" value="aforo">Guardar aforo</button></div>
    </form>
</section>
<section class="mb-4">
    <h2 class="h4">Catálogos</h2>
    @foreach (['talla_caminante' => 'Tallas de caminantes', 'talla_ropa' => 'Tallas de servidores', 'servicio' => 'Servicios'] as $tipo => $titulo)
        <details class="card p-3 mb-2">
            <summary>{{ $titulo }}</summary>
            <form method="post" action="{{ route('bartimeo.panel.guardar', ['parroquia' => $parroquia, 'edicion' => $retiro->edicion]) }}" class="mt-3">
                @csrf
                <input type="hidden" name="catalogo" value="{{ $tipo }}">
                @foreach ($catalogos[$tipo] as $indice => $fila)
                    <div class="d-flex gap-3 align-items-center mb-2">
                        <input aria-label="Valor {{ $indice + 1 }}" class="form-control" name="filas[{{ $indice }}][valor]" value="{{ $fila->valor }}" maxlength="100" required>
                        <label class="form-check-label text-nowrap"><input class="form-check-input" name="filas[{{ $indice }}][activo]" type="checkbox" value="1" @checked($fila->activo)> Activo</label>
                    </div>
                @endforeach
                @php
                    $indice = count($catalogos[$tipo]);
                @endphp
                @if ($indice < 100)
                    <div class="d-flex gap-3 align-items-center mb-3">
                        <input aria-label="Nuevo valor" class="form-control" name="filas[{{ $indice }}][valor]" placeholder="Añadir valor" maxlength="100">
                        <label class="form-check-label text-nowrap"><input class="form-check-input" name="filas[{{ $indice }}][activo]" type="checkbox" value="1" checked> Activo</label>
                    </div>
                @endif
                <button class="btn btn-primary" name="accion" value="catalogo">Guardar catálogo</button>
            </form>
        </details>
    @endforeach
</section>
<form method="get" class="card card-body mb-4"><label class="form-label" for="edicion">Edición activa para gestión</label><select class="form-select mb-2" id="edicion" name="edicion">@foreach($ediciones as $edicion)<option value="{{ $edicion->slug }}" @selected($edicion->slug===$retiro->edicion)>{{ $edicion->nombre }} ({{ $edicion->slug }})</option>@endforeach</select><input type="hidden" name="seccion" value="configuracion"><button class="btn btn-outline-primary align-self-start">Cambiar edición</button></form>
<div class="row g-4"><section class="col-lg-6"><h2 class="h4">Crear edición</h2><form class="card card-body" method="post" action="{{ route('bartimeo.panel.guardar',['parroquia'=>$parroquia,'edicion'=>$retiro->edicion]) }}">@csrf<input type="hidden" name="accion" value="crear_edicion"><label class="form-label" for="slug">Identificador</label><input class="form-control mb-2" id="slug" name="slug" required maxlength="48"><label class="form-label" for="nombre">Nombre</label><input class="form-control mb-3" id="nombre" name="nombre" required maxlength="100"><button class="btn btn-primary">Crear edición</button></form></section>
<section class="col-lg-6"><h2 class="h4">Invitaciones de servidores</h2><div class="d-grid gap-2"><form class="card card-body" method="post" action="{{ route('bartimeo.panel.guardar',['parroquia'=>$parroquia,'edicion'=>$retiro->edicion]) }}">@csrf<input type="hidden" name="accion" value="invitacion"><label class="form-label" for="dias">Invitación de servidores, días de vigencia</label><input class="form-control mb-2" type="number" id="dias" name="dias" min="1" max="30" value="7" required><button class="btn btn-outline-primary">Generar invitación</button></form><form method="post" action="{{ route('bartimeo.panel.guardar',['parroquia'=>$parroquia,'edicion'=>$retiro->edicion]) }}">@csrf<input type="hidden" name="accion" value="revocar_invitacion"><button class="btn btn-outline-danger">Revocar invitación activa</button></form></div></section>
@if($parroquia==='cristorey' && auth('web')->user()?->administrador)<section class="col-12"><h2 class="h4">Parroquias</h2><div class="row g-3 mb-4">@foreach($parroquias as $fila)<div class="col-md-6"><form class="card card-body" method="post" action="{{ route('bartimeo.panel.guardar',['parroquia'=>$parroquia,'edicion'=>$retiro->edicion]) }}">@csrf<input type="hidden" name="accion" value="editar_parroquia"><input type="hidden" name="slug" value="{{ $fila->slug }}"><strong class="mb-2">{{ $fila->slug }}</strong><label class="form-label" for="nombre-{{ $fila->slug }}">Nombre</label><input class="form-control mb-2" id="nombre-{{ $fila->slug }}" name="nombre" value="{{ $fila->nombre }}" required maxlength="100"><label class="form-label" for="activa-{{ $fila->slug }}">Estado</label><select class="form-select mb-2" id="activa-{{ $fila->slug }}" name="activa"><option value="1" @selected($fila->activa)>Activa</option><option value="0" @selected(!$fila->activa)>Inactiva</option></select><button class="btn btn-outline-primary">Guardar</button></form></div>@endforeach</div><form class="card card-body" method="post" action="{{ route('bartimeo.panel.guardar',['parroquia'=>$parroquia,'edicion'=>$retiro->edicion]) }}">@csrf<input type="hidden" name="accion" value="crear_parroquia"><h3 class="h5">Añadir parroquia</h3><label class="form-label" for="parroquia-slug">Identificador</label><input class="form-control mb-2" id="parroquia-slug" name="slug" required maxlength="48"><label class="form-label" for="parroquia-nombre">Nombre</label><input class="form-control mb-2" id="parroquia-nombre" name="nombre" required maxlength="100"><label class="form-label" for="password">Clave inicial (mínimo 12 caracteres)</label><input class="form-control mb-3" id="password" name="password" type="password" required minlength="12" maxlength="128"><button class="btn btn-primary">Crear parroquia</button></form></section>@endif</div></main>
@endsection
