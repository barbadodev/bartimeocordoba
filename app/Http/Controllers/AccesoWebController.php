<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

final class AccesoWebController
{
    public function show(Request $request): View
    {
        return view('acceso', [
            'parroquia' => $request->route('parroquia'),
            'destino' => $request->query('destino') === 'mapa' ? 'mapa' : 'panel',
        ]);
    }

    public function entrar(Request $request): RedirectResponse
    {
        $parroquia = (string) $request->route('parroquia');
        $destino = $request->input('destino') === 'mapa' ? 'mapa' : 'panel';
        $parametros = ['parroquia' => $parroquia];
        $username = $request->input('username');
        $password = $request->input('password');
        $guard = Auth::guard('web');

        if (! is_string($username) || ! is_string($password) || strlen($username) > 48 || strlen($password) > 72
            || ! $guard->attemptWhen(
                ['username' => Str::lower(trim($username)), 'password' => $password, 'activo' => true],
                fn (User $user): bool => $user->administrador || $user->parroquia === $parroquia,
            )) {
            return redirect()->route('bartimeo.acceso', $parametros + ['destino' => $destino])
                ->withErrors(['acceso' => 'Usuario o contraseña incorrectos.']);
        }

        $request->session()->put('bartimeo.password', $guard->user()->huellaDeAcceso());

        return redirect()->route('bartimeo.'.$destino, $parametros);
    }

    public function salir(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('bartimeo.acceso', ['parroquia' => $request->route('parroquia')]);
    }
}
