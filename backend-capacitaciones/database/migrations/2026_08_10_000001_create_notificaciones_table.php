<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notificaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('tipo', ['seccion_creada', 'seccion_actualizada', 'modulo_creado', 'modulo_actualizado']);
            $table->string('titulo', 150);
            $table->text('mensaje')->nullable();
            $table->foreignId('seccion_id')->nullable()->constrained('secciones')->nullOnDelete();
            $table->foreignId('modulo_id')->nullable()->constrained('modulos')->nullOnDelete();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notificaciones');
    }
};
