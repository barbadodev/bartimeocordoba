@extends('layouts.bartimeo')

@section('title', 'Mapa de coordinación')

@section('content')
<main class="container py-5">
    <div class="d-flex justify-content-between align-items-center mb-4"><div><p class="text-muted mb-1">{{ $parroquia }} · {{ $retiro->edicion }}</p><h1>Mapa de pantallas</h1></div><form method="post" action="{{ route('bartimeo.salir', ['parroquia' => $parroquia]) }}">@csrf<button class="btn btn-outline-secondary">Cerrar sesión</button></form></div>
    <div class="row g-3">
        @foreach ([['Panel de inscripciones', 'bartimeo.panel'], ['Asistencias', 'bartimeo.asistencias']] as [$titulo, $ruta])
            <div class="col-md-6"><a class="card card-body h-100 text-decoration-none" href="{{ route($ruta, ['parroquia' => $parroquia, 'edicion' => $retiro->edicion]) }}"><h2 class="h5">{{ $titulo }}</h2><span>Abrir pantalla →</span></a></div>
        @endforeach
        <div class="col-md-6"><a class="card card-body h-100 text-decoration-none" href="{{ route('bartimeo.panel', ['parroquia' => $parroquia, 'edicion' => $retiro->edicion, 'seccion' => 'configuracion']) }}"><h2 class="h5">Configuración</h2><span>Aforo, enlaces y gestión →</span></a></div>
        <div class="col-md-6"><a class="card card-body h-100 text-decoration-none" href="{{ route('bartimeo.portada', ['parroquia' => $parroquia]) }}"><h2 class="h5">Portada pública</h2><span>Ver sitio →</span></a></div>
    </div>
    <form method="get" class="mt-4"><label class="form-label" for="edicion">Edición</label><select id="edicion" name="edicion" class="form-select mb-2">@foreach($ediciones as $edicion)<option value="{{ $edicion->slug }}" @selected($edicion->slug === $retiro->edicion)>{{ $edicion->nombre }}</option>@endforeach</select><button class="btn btn-outline-primary">Cambiar edición</button></form>
</main>
@endsection
