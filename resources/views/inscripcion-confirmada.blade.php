@extends('layouts.bartimeo')

@section('title', 'Inscripción confirmada | Bartimeo Córdoba')
@section('content')
<main class="container py-5" style="max-width: 720px"><section class="card border-0 shadow-sm"><div class="card-body p-5 text-center">
    <h1 class="mb-3">Inscripción confirmada</h1>
    <p>Gracias{{ filled($confirmacion['nombre'] ?? null) ? ', '.e($confirmacion['nombre']) : '' }}. Hemos recibido tu inscripción como {{ ($confirmacion['tipo'] ?? '') === 'servidor' ? 'servidor' : 'caminante' }}.</p>
    <a class="btn btn-primary mt-3" href="{{ route('bartimeo.portada', ['parroquia' => $parroquia]) }}">Volver a la portada</a>
</div></section></main>
@endsection
