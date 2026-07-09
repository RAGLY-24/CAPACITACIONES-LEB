<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('socios', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 150);
            $table->string('empresa', 150)->nullable();
            $table->enum('estado', ['Activo', 'Inactivo'])->default('Activo');
            $table->text('descripcion')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('socio_id')->nullable()->after('puesto_id')->constrained('socios')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['socio_id']);
            $table->dropColumn('socio_id');
        });

        Schema::dropIfExists('socios');
    }
};
