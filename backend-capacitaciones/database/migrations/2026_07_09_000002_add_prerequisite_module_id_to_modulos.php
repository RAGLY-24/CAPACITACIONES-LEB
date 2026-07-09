<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('modulos', function (Blueprint $table) {
            $table->foreignId('prerequisite_module_id')->nullable()->after('estado')
                ->constrained('modulos')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('modulos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('prerequisite_module_id');
        });
    }
};
