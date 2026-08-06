<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('progreso_modulos', function (Blueprint $table) {
            // Ids de las preguntas de opción múltiple mostradas en el intento
            // más reciente (en curso o ya calificado). Permite calificar
            // exactamente lo que se mostró y reconstruir la retroalimentación.
            $table->json('preguntas_examen_actual')->nullable()->after('respuestas');

            // Unión de ids ya mostrados dentro del ciclo actual (se resetea
            // junto con intentos_ciclo), para no repetir preguntas entre el
            // primer y el segundo intento del mismo ciclo.
            $table->json('preguntas_usadas_ciclo')->nullable()->after('preguntas_examen_actual');

            // True mientras hay un examen generado y aún no enviado: evita
            // regenerar el set de preguntas si el usuario solo recarga la
            // página a medio intento.
            $table->boolean('intento_pendiente')->default(false)->after('preguntas_usadas_ciclo');
        });
    }

    public function down(): void
    {
        Schema::table('progreso_modulos', function (Blueprint $table) {
            $table->dropColumn(['preguntas_examen_actual', 'preguntas_usadas_ciclo', 'intento_pendiente']);
        });
    }
};
