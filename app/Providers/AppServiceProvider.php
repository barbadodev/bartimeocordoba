<?php

namespace App\Providers;

use App\Bartimeo\Retiro;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        RateLimiter::for('accesos', fn (Request $request) => Limit::perMinutes(15, 10)->by($request->ip()));
        RateLimiter::for('altas', fn (Request $request) => Limit::perMinutes(15, max(1, config('bartimeo.limite_altas')))->by($request->ip()));
        View::composer('layouts.coordinacion', function (\Illuminate\View\View $vista): void {
            $retiro = request()->attributes->get(Retiro::class);
            $vista->with([
                'edicionesPanel' => DB::table('ediciones')->where('parroquia', $retiro->parroquia)->orderByDesc('id')->get(['slug', 'nombre']),
                'conteosPanel' => $retiro->tabla('inscripciones')->selectRaw('tipo, count(*) as total')->groupBy('tipo')->pluck('total', 'tipo'),
            ]);
        });
    }
}
