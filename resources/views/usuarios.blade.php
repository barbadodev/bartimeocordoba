@extends('layouts.bartimeo')

@section('title', 'Usuarios | Bartimeo Córdoba')

@section('content')
    <main class="container py-4">
        <a href="{{ route('bartimeo.panel', compact('parroquia')) }}">Volver a coordinación</a>
        <h1 class="title-serif my-3">Administración de usuarios</h1>
        @if (session('mensaje'))
            <p class="alert alert-success" role="status">{{ session('mensaje') }}</p>
        @endif
        @if ($errors->any())
            <ul class="alert alert-danger ps-5" role="alert">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        @endif
        <section class="card bartimeo-card mb-4">
            <div class="card-body">
                <h2 class="h5">Crear usuario</h2>
                <form class="row g-3" method="post" action="{{ route('bartimeo.usuarios.crear', compact('parroquia')) }}">
                    @csrf
                    <div class="col-md-6"><label for="name" class="form-label">Nombre</label><input class="form-control" id="name" name="name" required maxlength="120"></div>
                    <div class="col-md-6"><label for="username" class="form-label">Usuario</label><input class="form-control" id="username" name="username" required maxlength="48" autocomplete="off"></div>
                    <div class="col-md-6"><label for="password" class="form-label">Contraseña (mínimo 12 caracteres)</label><input class="form-control" id="password" name="password" type="password" required minlength="12" autocomplete="new-password"></div>
                    <div class="col-md-6"><label for="password-confirmation" class="form-label">Confirmar contraseña</label><input class="form-control" id="password-confirmation" name="password_confirmation" type="password" required minlength="12" autocomplete="new-password"></div>
                    <div class="col-md-6"><label for="rol" class="form-label">Permisos</label><select class="form-select" id="rol" name="rol"><option value="coordinacion">Coordinación de una parroquia</option><option value="administrador">Administración de todas las parroquias</option></select></div>
                    <div class="col-md-6"><label for="parroquia" class="form-label">Parroquia de coordinación</label><select class="form-select" id="parroquia" name="parroquia"><option value="">Elige una parroquia si el usuario es coordinador</option>@foreach ($parroquias as $opcion)<option value="{{ $opcion->slug }}">{{ $opcion->nombre }}</option>@endforeach</select></div>
                    <div class="col-12"><button class="btn btn-primary" type="submit">Crear usuario</button></div>
                </form>
            </div>
        </section>
        <section class="card bartimeo-card">
            <div class="card-body table-responsive">
                <h2 class="h5">Usuarios registrados</h2>
                <table class="table align-middle">
                    <thead><tr><th scope="col">Usuario</th><th scope="col">Permisos</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>
                    <tbody>
                        @foreach ($usuarios as $usuario)
                            <tr>
                                <th scope="row">{{ $usuario->username }}<div class="small fw-normal">{{ $usuario->name }}</div></th>
                                <td>{{ $usuario->administrador ? 'Administrador' : 'Coordinación · '.$usuario->parroquia }}</td>
                                <td>{{ $usuario->activo ? 'Activo' : 'Desactivado' }}</td>
                                <td>
                                    @php($accion = route('bartimeo.usuarios.editar', ['parroquia' => $parroquia, 'usuario' => $usuario]))
                                    @unless ($usuario->is($gestor))
                                        <form method="post" action="{{ $accion }}" class="mb-2">
                                            @csrf @method('PATCH')
                                            <button class="btn btn-sm btn-outline-primary" name="accion" value="{{ $usuario->activo ? 'desactivar' : 'activar' }}">{{ $usuario->activo ? 'Desactivar' : 'Activar' }}</button>
                                        </form>
                                    @endunless
                                    <details>
                                        <summary>Cambiar contraseña</summary>
                                        <form method="post" action="{{ $accion }}" class="mt-2">
                                            @csrf @method('PATCH')
                                            <label class="form-label" for="password-{{ $usuario->id }}">Nueva contraseña</label>
                                            <input class="form-control mb-2" id="password-{{ $usuario->id }}" name="password" type="password" required minlength="12" autocomplete="new-password">
                                            <label class="form-label" for="confirmacion-{{ $usuario->id }}">Confirmar contraseña</label>
                                            <input class="form-control mb-2" id="confirmacion-{{ $usuario->id }}" name="password_confirmation" type="password" required minlength="12" autocomplete="new-password">
                                            <button class="btn btn-sm btn-primary" name="accion" value="password">Guardar contraseña</button>
                                        </form>
                                    </details>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </section>
    </main>
@endsection
