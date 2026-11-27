@extends('layouts.bartimeo')

@section('title', 'Inscripción Caminantes | Bartimeo Córdoba')
@section('content')
<main class="container py-5" style="max-width: 900px">
    <h1 class="text-center mb-4">Caminantes · {{ $info['titulo'] ?? 'Bartimeo Córdoba' }}</h1>
    <section class="card border-0 shadow-sm"><div class="card-body p-4">
        <p>Completa la inscripción del caminante y los datos de su tutor. Las plazas se asignan según disponibilidad.</p>
        @if ($plazas)<p class="alert alert-info">Plazas disponibles: {{ $plazas['disponibles']['total'] }} (niños: {{ $plazas['disponibles']['ninos'] }}, niñas: {{ $plazas['disponibles']['ninas'] }}).</p>@endif
        @if ($errors->any())<div class="alert alert-danger" role="alert">{{ $errors->first() }}</div>@endif
        <form method="post" action="{{ route('bartimeo.caminantes.guardar', ['parroquia' => $parroquia]) }}">
            @csrf<input type="hidden" name="idempotency_key" value="{{ $idempotencyKey }}">
            @include('inscripcion-campos', ['tipo' => 'caminante'])
            <div class="form-check my-4"><input class="form-check-input" type="checkbox" name="aceptaRgpd" value="1" id="aceptaRgpd" required><label class="form-check-label" for="aceptaRgpd">Acepto la información de protección de datos para gestionar esta inscripción.</label></div>
            <button class="btn btn-primary" type="submit">Enviar inscripción</button>
        </form>
    </div></section>
</main>
@endsection
