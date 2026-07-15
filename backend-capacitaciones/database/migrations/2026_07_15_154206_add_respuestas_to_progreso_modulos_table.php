<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('progreso_modulos', function (Blueprint $table) {
            $table->json('respuestas')->nullable()->after('intentos');
        });
    }

    public function down(): void
    {
        Schema::table('progreso_modulos', function (Blueprint $table) {
            $table->dropColumn('respuestas');
        });
    }
};
