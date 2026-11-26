<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\TestCase;

class BartimeoTest extends TestCase
{
    use DatabaseTransactions;

    private function coordinacion(): string
    {
        $clave = str_repeat('a', 64);
        config(['bartimeo.enlace_permanente_hash' => hash('sha256', $clave)]);

        return $this->postJson('/api/coordinacion/enlaces/canjear', compact('clave'))->assertOk()->json('token');
    }

    public function test_sesion_persiste_y_se_revoca_en_postgresql(): void
    {
        $this->getJson('/api/servidores')->assertUnauthorized();
        $token = $this->coordinacion();
        $hash = hash('sha256', $token);
        $this->assertDatabaseHas('sesiones_coordinacion', ['token_hash' => $hash, 'parroquia' => 'cristorey']);
        $this->withToken($token)->getJson('/api/coordinacion/verificar')->assertOk();
        $this->postJson('/api/coordinacion/logout')->assertOk();
        $this->assertDatabaseMissing('sesiones_coordinacion', ['token_hash' => $hash]);
        $this->getJson('/api/caminantes')->assertUnauthorized();
    }

    public function test_aforo_reintento_y_edicion(): void
    {
        $token = $this->coordinacion();
        $this->withToken($token)->putJson('/api/plazas/caminantes', ['maxNinos' => 1, 'maxNinas' => 1, 'maxTotal' => 2])->assertOk();
        $headers = ['Idempotency-Key' => (string) Str::uuid()];
        $this->postJson('/api/caminantes', [], $headers)->assertBadRequest();
        $datos = [
            'familiar1Nombre' => 'Tutor Prueba', 'familiar1Dni' => '00000000T', 'familiar1Telefono' => '600000000',
            'familiar1Email' => 'tutor@example.com', 'aceptaRgpd' => true, 'nombre' => 'Test', 'apellidos' => 'Caminante',
            'colegio' => 'Colegio de prueba', 'anioNacimiento' => 2010, 'genero' => 'nino', 'inscripcionesPrevias' => 0,
            'primeraVezCristoRey' => true, 'tallaCamiseta' => 'M',
        ];
        $id = $this->postJson('/api/caminantes', $datos, $headers)->assertCreated()->json('caminante.id');
        $this->postJson('/api/caminantes', $datos, $headers)->assertOk()->assertJsonPath('caminante.id', $id);
        $this->postJson('/api/caminantes', $datos, ['Idempotency-Key' => (string) Str::uuid()])->assertConflict();
        $this->patchJson('/api/caminantes/'.$id, ['estado' => 'Cancelado'])->assertOk();
        $this->getJson('/api/plazas/caminantes')->assertOk()->assertJsonPath('disponibles.ninos', 1);
    }

    public function test_invitaciones_asistencias_y_aislamiento(): void
    {
        $this->withToken($this->coordinacion());
        $this->postJson('/api/parroquias', ['slug' => 'parroquia-prueba', 'nombre' => 'Prueba', 'passwordInicial' => 'password-prueba-123'])->assertCreated();
        $this->getJson('/api/servidores', ['X-Parroquia' => 'parroquia-prueba'])->assertUnauthorized();
        $otra = $this->postJson('/api/coordinacion/login', ['password' => 'password-prueba-123'], ['X-Parroquia' => 'parroquia-prueba'])->assertOk()->json('token');
        $this->getJson('/api/servidores', ['Authorization' => 'Bearer '.$otra])->assertUnauthorized();
        $ruta = '/api/coordinacion/invitacion-servidores';
        $clave = $this->postJson($ruta, ['dias' => 7])->assertCreated()->json('clave');
        $this->postJson('/api/servidores/invitacion', compact('clave'))->assertOk();
        $headers = ['X-Invitacion' => $clave, 'Idempotency-Key' => (string) Str::uuid()];
        $this->postJson('/api/servidores', [], $headers)->assertBadRequest();
        $datos = [
            'nombre' => 'Test', 'apellidos' => 'Servidor', 'movil' => '600000000', 'email' => 'srv@example.com',
            'fechaNacimiento' => '1995-01-01', 'direccion' => 'Prueba', 'localidad' => 'Córdoba', 'bartimeoOrigen' => 'Cristo Rey',
            'haServido' => 'Sí', 'cuantasVeces' => '1', 'montajeJueves' => 'No', 'alergias' => 'Ninguna',
            'emergenciaNombre' => 'Test', 'emergenciaTelefono' => '600000000', 'emergenciaRelacion' => 'Hermano',
            'serviciosHechos' => ['Mesa'], 'aceptaRgpd' => true,
        ];
        $id = $this->postJson('/api/servidores', $datos, $headers)->assertCreated()->json('servidor.id');
        $estado = $this->getJson('/api/asistencias/state')->assertOk()->json();
        $this->assertContains($id, array_column($estado['members'], 'inscripcionId'));
        $estado['meetings'] = [['id' => 'reunion-1', 'date' => '2026-12-01']];
        $estado['att'] = ['reunion-1' => [$id => 'p']];
        $this->postJson('/api/asistencias/state', $estado)->assertOk();
        $this->postJson('/api/asistencias/state', $estado)->assertConflict();
        $this->assertDatabaseHas('asistencias_detalle', ['participante_id' => $id, 'estado' => 'p']);
        $this->deleteJson($ruta)->assertOk();
        $this->postJson('/api/servidores/invitacion', compact('clave'))->assertUnauthorized();
    }
}
