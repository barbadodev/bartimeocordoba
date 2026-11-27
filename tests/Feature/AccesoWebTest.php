<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AccesoWebTest extends TestCase
{
    use DatabaseTransactions;

    public function test_el_panel_privado_exige_usuario_y_contrasena_y_revoca_la_sesion_al_salir(): void
    {
        $clave = 'password-prueba-de-bartimeo';
        $usuario = User::factory()->create(['username' => 'admin-prueba-web', 'password' => $clave, 'administrador' => true, 'activo' => true]);
        $parroquia = ['parroquia' => 'cristorey'];

        $this->get('/admin')->assertNotFound();
        $this->get('/cristorey/coordinacion')->assertNotFound();
        $this->assertMatchesRegularExpression('#/([a-f0-9]{32})/cristorey/coordinacion/acceso$#', route('bartimeo.acceso', $parroquia));
        $this->get(route('bartimeo.mapa', $parroquia))
            ->assertRedirect(route('bartimeo.acceso', $parroquia + ['destino' => 'mapa']));
        $this->post(route('bartimeo.entrar', $parroquia), ['username' => $usuario->username, 'password' => 'incorrecta'])
            ->assertSessionHasErrors('acceso');
        $this->assertGuest('web');
        $this->post(route('bartimeo.entrar', $parroquia), ['username' => $usuario->username, 'password' => $clave, 'destino' => 'mapa'])
            ->assertRedirect(route('bartimeo.mapa', $parroquia));
        $this->assertAuthenticatedAs($usuario, 'web');
        $this->get(route('bartimeo.mapa', $parroquia))->assertOk();
        $this->get(route('bartimeo.usuarios', $parroquia))->assertOk();

        $this->post(route('bartimeo.salir', $parroquia))->assertRedirect(route('bartimeo.acceso', $parroquia));
        $this->assertGuest('web');
        $this->get(route('bartimeo.panel', $parroquia))
            ->assertRedirect(route('bartimeo.acceso', $parroquia + ['destino' => 'panel']));
    }

    public function test_un_coordinador_no_puede_administrar_usuarios(): void
    {
        $usuario = User::factory()->create(['username' => 'coordinador-prueba-web', 'parroquia' => 'cristorey', 'activo' => true]);
        $this->actingAs($usuario, 'web')->withSession(['bartimeo.password' => $usuario->huellaDeAcceso()]);

        $this->get(route('bartimeo.usuarios', ['parroquia' => 'cristorey']))->assertForbidden();
    }

    public function test_un_administrador_puede_crear_y_desactivar_un_usuario(): void
    {
        $gestor = User::factory()->create(['username' => 'gestor-prueba-web', 'administrador' => true, 'activo' => true]);
        $this->actingAs($gestor, 'web')->withSession(['bartimeo.password' => $gestor->huellaDeAcceso()]);
        $parroquia = ['parroquia' => 'cristorey'];
        $password = 'clave-prueba-del-coordinador';
        $this->post(route('bartimeo.usuarios.crear', $parroquia), [
            'name' => 'Coordinación de prueba', 'username' => 'coordinacion-nueva-prueba', 'rol' => 'coordinacion',
            'parroquia' => 'cristorey', 'password' => $password, 'password_confirmation' => $password,
        ])->assertRedirect(route('bartimeo.usuarios', $parroquia));
        $usuario = User::query()->where('username', 'coordinacion-nueva-prueba')->firstOrFail();

        $this->patch(route('bartimeo.usuarios.editar', $parroquia + ['usuario' => $usuario]), [
            'accion' => 'desactivar',
        ])->assertRedirect(route('bartimeo.usuarios', $parroquia));
        $this->assertDatabaseHas('users', ['id' => $usuario->id, 'activo' => false, 'version_acceso' => 1]);
    }
}
