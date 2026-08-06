<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('preguntas', function (Blueprint $table) {
            // 'opcion_multiple' (se califica) o 'feedback' (opinión libre, no se califica)
            $table->string('tipo', 30)->default('opcion_multiple')->after('texto');
        });
    }

    public function down(): void
    {
        Schema::table('preguntas', function (Blueprint $table) {
            $table->dropColumn('tipo');
        });
    }
};
