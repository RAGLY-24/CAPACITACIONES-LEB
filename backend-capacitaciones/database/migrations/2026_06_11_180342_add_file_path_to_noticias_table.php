<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('noticias', function (Blueprint $table) {
            // Agregamos la columna como string y permitimos que sea nula (opcional)
            $table->string('file_path')->nullable()->after('evidence');
        });
    }

    public function down()
    {
        Schema::table('noticias', function (Blueprint $table) {
            $table->dropColumn('file_path');
        });
    }
};