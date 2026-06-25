<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('modulos', function (Blueprint $table) {
            $table->foreignId('seccion_id')->nullable()->after('id')->constrained('secciones')->nullOnDelete();
            $table->integer('orden')->default(1)->after('seccion_id');
        });
    }

    public function down(): void
    {
        Schema::table('modulos', function (Blueprint $table) {
            $table->dropForeign(['seccion_id']);
            $table->dropColumn(['seccion_id', 'orden']);
        });
    }
};
