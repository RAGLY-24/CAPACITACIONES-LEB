<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Una sola fila (singleton): el aviso de emergencia que se muestra fijo en
// la sección de Noticias. No hay historial de avisos, solo el vigente.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aviso_emergencia', function (Blueprint $table) {
            $table->id();
            $table->text('mensaje')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aviso_emergencia');
    }
};
