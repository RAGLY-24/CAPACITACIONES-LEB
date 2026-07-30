<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('es_operador')->default(false)->after('foto');
            $table->string('operador_nombre_completo')->nullable()->after('es_operador');
            $table->string('operador_numero_economico_tractor')->nullable()->after('operador_nombre_completo');
            $table->string('operador_placas_remolque')->nullable()->after('operador_numero_economico_tractor');
            $table->string('operador_folio')->nullable()->after('operador_placas_remolque');
            $table->string('operador_numero_licencia')->nullable()->after('operador_folio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'es_operador',
                'operador_nombre_completo',
                'operador_numero_economico_tractor',
                'operador_placas_remolque',
                'operador_folio',
                'operador_numero_licencia',
            ]);
        });
    }
};
