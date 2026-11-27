@extends('layouts.bartimeo')

@section('title', 'Coordinación | Bartimeo Córdoba')
@push('styles')
    <meta name="robots" content="noindex, nofollow">
    <meta name="referrer" content="no-referrer">
@endpush

@section('content')
    <main class="container py-5">
        <div class="card bartimeo-card mx-auto" style="max-width: 32rem">
            <div class="card-body p-4 p-sm-5">
                <img class="bartimeo-logo d-block mx-auto mb-4" src="/logo-coordinacion.png" width="64" height="64" alt="Bartimeo Córdoba">
                <h1 class="title-serif h3 mb-3 text-center">Acceso de coordinación</h1>
                @error('acceso')
                    <p class="alert alert-danger" role="alert">{{ $message }}</p>
                @enderror
                <form action="{{ route('bartimeo.entrar', ['parroquia' => $parroquia]) }}" method="post">
                    @csrf
                    <input type="hidden" name="destino" value="{{ $destino }}">
                    <label for="username" class="form-label">Usuario</label>
                    <input class="form-control mb-3" id="username" name="username" required maxlength="48" autocomplete="username">
                    <label for="password" class="form-label">Contraseña</label>
                    <input class="form-control" id="password" name="password" type="password" required maxlength="72" autocomplete="current-password">
                    <button type="submit" class="btn btn-primary w-100 mt-4">Entrar</button>
                </form>
                <p class="text-center mt-4 mb-0"><a href="{{ route('bartimeo.portada', ['parroquia' => $parroquia]) }}">Volver a la portada</a></p>
            </div>
        </div>
    </main>
@endsection
