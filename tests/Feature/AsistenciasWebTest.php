<?php

namespace Tests\Feature;

use App\Bartimeo\Asistencias;
use App\Bartimeo\Retiro;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AsistenciasWebTest extends TestCase
{
    use DatabaseTransactions;

    public function test_la_toma_conserva_la_lista_al_cambiar_de_estado(): void
    {
        $usuario = User::factory()->create(['username' => 'asistencias-prueba-web', 'parroquia' => 'cristorey', 'activo' => true]);
        $this->actingAs($usuario, 'web')->withSession(['bartimeo.password' => $usuario->huellaDeAcceso()]);

        $id = DB::table('ediciones')->where(['parroquia' => 'cristorey', 'slug' => Retiro::PUBLICA])->value('id');
        $retiro = new Retiro('cristorey', Retiro::PUBLICA, $id);
        $servicio = app(Asistencias::class);
        $reunion = 'reunion-prueba-blade';
        $persona = 'asistente-prueba-blade';
        $estado = $servicio->estado($retiro);
        $estado['meetings'][] = (object) ['id' => $reunion, 'date' => '2099-11-27'];
        $estado['members'][] = [
            'id' => $persona, 'name' => 'Asistente de prueba Blade', 'caminante' => false,
            'motivoExcepcion' => 'Prueba de asistencia', 'reunionExcepcionId' => $reunion,
        ];
        $estado['members'] = array_map(fn (array $miembro): object => (object) $miembro, $estado['members']);
        $servicio->guardar($retiro, (object) $estado);
        $parametros = ['parroquia' => 'cristorey'];
        $vista = route('bartimeo.asistencias', $parametros + ['reunion' => $reunion]);
        $accion = route('bartimeo.asistencias.guardar', $parametros);
        $revisionInicial = $servicio->estado($retiro)['revision'];
        $this->get($vista)->assertOk()->assertSee('Caminantes')->assertSee('Asistentes')->assertSee('Asistente de prueba Blade');

        foreach (['p', 'i', 'a', null] as $esperado) {
            $revision = $servicio->estado($retiro)['revision'];
            $this->post($accion, compact('revision', 'reunion', 'persona') + ['accion' => 'marca'])
                ->assertRedirect();
            $this->assertSame($esperado, $servicio->estado($retiro)['att']->{$reunion}->{$persona} ?? null);
            $this->get($vista)->assertOk()->assertSee('Asistente de prueba Blade');
        }

        $this->post($accion, compact('reunion', 'persona') + ['revision' => $revisionInicial, 'accion' => 'marca'])
            ->assertSessionHasErrors('asistencias');
    }
}
