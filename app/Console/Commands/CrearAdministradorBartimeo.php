<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

final class CrearAdministradorBartimeo extends Command
{
    protected $signature = 'bartimeo:admin {--ruta : Mostrar la URL privada sin crear un usuario}';

    protected $description = 'Configura el primer administrador de Bartimeo o consulta su URL privada';

    public function handle(): int
    {
        if (! config('app.key')) {
            $this->error('Genera APP_KEY antes de configurar el acceso.');

            return self::FAILURE;
        }

        if (! $this->option('ruta')) {
            if (User::query()->where('username', 'admin')->exists()) {
                $this->error('El usuario admin ya existe. Gestiona su cuenta desde el panel.');

                return self::FAILURE;
            }

            $password = $this->secret('Contraseña inicial de admin', fallback: false);
            $minimo = app()->isLocal() ? 12 : 16;
            if (! is_string($password) || mb_strlen($password) < $minimo || strlen($password) > 72) {
                $this->error("Usa al menos {$minimo} caracteres y un máximo de 72 bytes.");

                return self::FAILURE;
            }

            User::query()->create([
                'name' => 'Administrador',
                'username' => 'admin',
                'email' => 'admin@bartimeo.invalid',
                'password' => $password,
                'administrador' => true,
                'activo' => true,
            ]);
        }

        $this->line(route('bartimeo.acceso', ['parroquia' => 'cristorey']));

        return self::SUCCESS;
    }
}
