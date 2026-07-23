<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('progreso_modulos', function (Blueprint $table) {
            // Intentos fallidos desde la última vez que se revisó el contenido
            // completo (PDF hasta el final o video terminado). Se limita a 2:
            // al llegar a 2 sin aprobar, el examen se bloquea hasta repasar el
            // contenido, momento en el que vuelve a 0. Es independiente de
            // `intentos`, que sigue siendo el total histórico para reportes.
            $table->unsignedTinyInteger('intentos_ciclo')->default(0)->after('intentos');
        });
    }

    public function down(): void
    {
        Schema::table('progreso_modulos', function (Blueprint $table) {
            $table->dropColumn('intentos_ciclo');
        });
    }
};
