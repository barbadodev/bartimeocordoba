<?php

use App\Bartimeo\Retiro;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parroquias', function (Blueprint $table) {
            $table->string('slug', 48)->primary();
            $table->string('nombre', 100);
            $table->boolean('activa')->default(true);
            $table->timestampTz('creada_en');
            $table->text('clave_hash')->nullable();
            $table->string('sal_legada', 32)->nullable();
        });

        Schema::create('ediciones', function (Blueprint $table) {
            $table->id();
            $table->string('parroquia', 48);
            $table->foreign('parroquia')->references('slug')->on('parroquias')->cascadeOnDelete();
            $table->string('slug', 48);
            $table->string('nombre', 100);
            $table->unsignedSmallInteger('max_ninos')->default(30);
            $table->unsignedSmallInteger('max_ninas')->default(30);
            $table->unsignedSmallInteger('max_total')->default(60);
            $table->unsignedBigInteger('revision_asistencias')->default(0);
            $table->jsonb('asistencias')->nullable();
            $table->unique(['parroquia', 'slug']);
        });

        Schema::create('inscripciones', function (Blueprint $table) {
            $table->foreignId('edicion_id')->constrained('ediciones')->cascadeOnDelete();
            $table->string('tipo', 12);
            $table->string('id', 128);
            $table->timestampTz('fecha_registro');
            $table->string('estado', 20);
            $table->string('genero', 10)->default('');
            $table->jsonb('datos');
            $table->primary(['edicion_id', 'tipo', 'id']);
            $table->index(['edicion_id', 'tipo', 'fecha_registro']);
            $table->index(['edicion_id', 'tipo', 'estado', 'genero']);
        });

        Schema::create('solicitudes_idempotencia', function (Blueprint $table) {
            $table->foreignId('edicion_id')->constrained('ediciones')->cascadeOnDelete();
            $table->char('clave_hash', 64);
            $table->string('tipo', 12);
            $table->string('recurso_id', 128);
            $table->timestampTz('creada_en');
            $table->primary(['edicion_id', 'clave_hash']);
        });

        Schema::create('catalogos', function (Blueprint $table) {
            $table->foreignId('edicion_id')->constrained('ediciones')->cascadeOnDelete();
            $table->string('tipo', 24);
            $table->string('valor', 100);
            $table->boolean('activo');
            $table->integer('orden');
            $table->primary(['edicion_id', 'tipo', 'valor']);
        });

        Schema::create('enlaces', function (Blueprint $table) {
            $table->foreignId('edicion_id')->constrained('ediciones')->cascadeOnDelete();
            $table->string('tipo', 16);
            $table->char('hash', 64);
            $table->unsignedBigInteger('vence_en')->nullable();
            $table->primary(['edicion_id', 'tipo', 'hash']);
        });

        Schema::create('sesiones_coordinacion', function (Blueprint $table) {
            $table->char('token_hash', 64)->primary();
            $table->string('parroquia', 48);
            $table->foreign('parroquia')->references('slug')->on('parroquias')->cascadeOnDelete();
            $table->timestampTz('vence_en')->index();
        });

        Schema::create('asistencias_detalle', function (Blueprint $table) {
            $table->foreignId('edicion_id')->constrained('ediciones')->cascadeOnDelete();
            $table->string('reunion_id', 128);
            $table->string('participante_id', 128);
            $table->char('estado', 1);
            $table->text('motivo_excepcion')->nullable();
            $table->string('inscripcion_id', 128)->nullable();
            $table->timestampTz('registrado_en');
            $table->primary(['edicion_id', 'reunion_id', 'participante_id']);
            $table->index(['edicion_id', 'inscripcion_id']);
        });

        Schema::create('importaciones_bartimeo', function (Blueprint $table) {
            $table->char('huella', 64)->primary();
            $table->timestampTz('importada_en');
        });

        DB::table('parroquias')->insert(['slug' => 'cristorey', 'nombre' => 'Cristo Rey', 'creada_en' => now()]);
        Retiro::crearEdicion('cristorey', 'vii', 'VII retiro');
    }

    public function down(): void
    {
        foreach (['importaciones_bartimeo', 'asistencias_detalle', 'sesiones_coordinacion', 'enlaces',
            'catalogos', 'solicitudes_idempotencia', 'inscripciones', 'ediciones', 'parroquias'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
