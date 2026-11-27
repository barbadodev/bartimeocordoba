@extends('layouts.bartimeo')

@section('title', 'Inscripción Servidores | Bartimeo Córdoba')
@section('content')
<main class="container py-5" style="max-width: 900px">
    <h1 class="text-center mb-4">Servidores · {{ $info['titulo'] ?? 'Bartimeo Córdoba' }}</h1>
    <section class="card border-0 shadow-sm"><div class="card-body p-4">
        <p>Para inscribirte como servidor, introduce la clave de invitación que te haya dado coordinación.</p>
        @if ($errors->any())<div class="alert alert-danger" role="alert">{{ $errors->first() }}</div>@endif
        @unless($invitacionVerificada)
            <form method="post" action="{{ route('bartimeo.servidores.invitacion', ['parroquia' => $parroquia]) }}" class="mb-4">
                @csrf<label class="form-label" for="clave">Clave de invitación</label><input class="form-control mb-3" id="clave" name="clave" autocomplete="off" required>
                <button class="btn btn-outline-primary" type="submit">Verificar invitación</button>
            </form>
        @else
            <p class="alert alert-success">Invitación verificada. Completa tus datos para continuar.</p>
            <form method="post" action="{{ route('bartimeo.servidores.guardar', ['parroquia' => $parroquia]) }}">
                @csrf<input type="hidden" name="idempotency_key" value="{{ $idempotencyKey }}">
                @include('inscripcion-campos', ['tipo' => 'servidor'])
                <div class="form-check my-4"><input class="form-check-input" type="checkbox" name="aceptaRgpd" value="1" id="aceptaRgpd" required><label class="form-check-label" for="aceptaRgpd">Acepto la información de protección de datos para gestionar esta inscripción.</label></div>
                <button class="btn btn-primary" type="submit">Enviar inscripción</button>
            </form>
        @endunless
    </div></section>
</main>
@endsection
