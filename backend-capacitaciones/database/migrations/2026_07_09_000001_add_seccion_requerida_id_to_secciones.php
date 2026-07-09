<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('secciones', function (Blueprint $table) {
            $table->foreignId('seccion_requerida_id')->nullable()->after('estado')
                ->constrained('secciones')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('secciones', function (Blueprint $table) {
            $table->dropConstrainedForeignId('seccion_requerida_id');
        });
    }
};
