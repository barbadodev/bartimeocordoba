<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        RateLimiter::for('accesos', fn (Request $request) => Limit::perMinutes(15, 10)->by($request->ip()));
        RateLimiter::for('altas', fn (Request $request) => Limit::perMinutes(15, max(1, config('bartimeo.limite_altas')))->by($request->ip()));
    }
}
