<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('noticias', function (Blueprint $table) {
            // Borramos la columna vieja (si la tenías)
            if (Schema::hasColumn('noticias', 'file_path')) {
                $table->dropColumn('file_path');
            }
            // Agregamos la nueva columna para múltiples archivos (tipo JSON)
            $table->json('file_paths')->nullable()->after('evidence');
        });
    }

    public function down()
    {
        Schema::table('noticias', function (Blueprint $table) {
            $table->dropColumn('file_paths');
            $table->string('file_path')->nullable();
        });
    }
};