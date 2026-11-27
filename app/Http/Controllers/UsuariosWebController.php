<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

final class UsuariosWebController
{
    public function show(Request $request): View
    {
        $gestor = $this->gestor($request);

        return view('usuarios', [
            'parroquia' => $request->route('parroquia'),
            'usuarios' => User::query()->whereNotNull('username')->orderBy('username')->get(),
            'parroquias' => DB::table('parroquias')->where('activa', true)->orderBy('nombre')->get(['slug', 'nombre']),
            'gestor' => $gestor,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->gestor($request);
        if (is_string($request->input('username'))) {
            $request->merge(['username' => Str::lower(trim($request->input('username')))]);
        }

        $datos = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'username' => ['required', 'string', 'max:48', 'regex:/^[a-z0-9][a-z0-9._-]*$/D', 'unique:users,username'],
            'password' => $this->reglasPassword(),
            'rol' => ['required', Rule::in(['administrador', 'coordinacion'])],
            'parroquia' => ['nullable', 'required_if:rol,coordinacion', 'string', Rule::exists('parroquias', 'slug')->where('activa', true)],
        ]);

        $administrador = $datos['rol'] === 'administrador';
        User::query()->create([
            'name' => $datos['name'],
            'username' => $datos['username'],
            'email' => $datos['username'].'@bartimeo.invalid',
            'password' => $datos['password'],
            'administrador' => $administrador,
            'parroquia' => $administrador ? null : $datos['parroquia'],
            'activo' => true,
        ]);

        return $this->volver($request, 'Usuario creado.');
    }

    public function update(Request $request, string $parroquia, User $usuario): RedirectResponse
    {
        $gestor = $this->gestor($request);
        abort_if($usuario->username === null, 404);
        $accion = $request->validate(['accion' => ['required', Rule::in(['activar', 'desactivar', 'password'])]])['accion'];
        if ($accion === 'password') {
            $datos = $request->validate(['password' => $this->reglasPassword()]);
            $usuario->update(['password' => $datos['password']]);

            return $this->volver($request, 'Contraseña cambiada. Se cerrarán las sesiones anteriores.');
        }

        if ($accion === 'desactivar' && $usuario->is($gestor)) {
            return back()->withErrors(['usuario' => 'No puedes desactivar tu propia cuenta.']);
        }

        DB::transaction(function () use ($usuario, $gestor, $accion): void {
            $bloqueados = User::query()->whereKey([$usuario->id, $gestor->id])->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            abort_unless($bloqueados[$gestor->id]->activo, 403);
            $bloqueados[$usuario->id]->increment('version_acceso', 1, ['activo' => $accion === 'activar']);
        });

        return $this->volver($request, $accion === 'activar' ? 'Usuario activado.' : 'Usuario desactivado.');
    }

    private function gestor(Request $request): User
    {
        $usuario = $request->user('web');
        abort_unless($usuario instanceof User && $usuario->administrador, 403);

        return $usuario;
    }

    private function reglasPassword(): array
    {
        return ['required', 'string', 'min:12', 'confirmed', function (string $atributo, mixed $valor, \Closure $error): void {
            if (is_string($valor) && strlen($valor) > 72) {
                $error('La contraseña debe ocupar como máximo 72 bytes.');
            }
        }];
    }

    private function volver(Request $request, string $mensaje): RedirectResponse
    {
        return redirect()->route('bartimeo.usuarios', ['parroquia' => $request->route('parroquia')])->with('mensaje', $mensaje);
    }
}
