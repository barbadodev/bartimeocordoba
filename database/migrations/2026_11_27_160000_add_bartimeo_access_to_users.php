<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('username', 48)->nullable()->unique();
            $table->string('parroquia', 48)->nullable()->index();
            $table->boolean('administrador')->default(false);
            $table->boolean('activo')->default(false);
            $table->unsignedInteger('version_acceso')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(['username']);
            $table->dropIndex(['parroquia']);
            $table->dropColumn(['username', 'parroquia', 'administrador', 'activo', 'version_acceso']);
        });
    }
};
