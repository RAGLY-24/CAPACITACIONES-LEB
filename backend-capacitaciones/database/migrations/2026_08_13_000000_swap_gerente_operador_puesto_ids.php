<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Los puestos privilegiados (SistemasAdmin, Gerente) deben tener ids fijos y
// predecibles (1 y 2) para que el reporte de avances pueda excluirlos de
// forma barata sin depender solo del nombre. En instalaciones nuevas el
// DatabaseSeeder ya los crea en ese orden; esta migración corrige bases de
// datos existentes donde Gerente terminó con un id distinto de 2 porque el
// puesto Operador se creó primero.
return new class extends Migration
{
    public function up(): void
    {
        $admin = DB::table('puestos')->where('nombre', 'SistemasAdmin')->first();
        $gerente = DB::table('puestos')->where('nombre', 'Gerente')->first();

        if (!$admin || !$gerente || $gerente->id === 2) {
            return; // nada que hacer (ya está en el orden esperado o no existen)
        }

        $ocupanteId2 = DB::table('puestos')->where('id', 2)->first();

        DB::transaction(function () use ($gerente, $ocupanteId2) {
            // Guardamos qué usuarios apuntan a cada puesto ANTES de mover
            // ningún id, para no confundir grupos al reasignar por valor.
            $usuariosGerente = DB::table('users')->where('puesto_id', $gerente->id)->pluck('id');
            $usuariosOcupanteId2 = $ocupanteId2
                ? DB::table('users')->where('puesto_id', $ocupanteId2->id)->pluck('id')
                : collect();

            DB::statement('SET FOREIGN_KEY_CHECKS=0');

            if ($ocupanteId2) {
                // Id temporal: el primer hueco libre (o el siguiente id) para
                // no inflar de más el contador de autoincremento de la tabla.
                $idsExistentes = DB::table('puestos')->pluck('id')->all();
                $temporal = 1;
                while (in_array($temporal, $idsExistentes, true)) {
                    $temporal++;
                }
                DB::table('puestos')->where('id', $ocupanteId2->id)->update(['id' => $temporal]);
                DB::table('puestos')->where('id', $gerente->id)->update(['id' => 2]);
                DB::table('puestos')->where('id', $temporal)->update(['id' => $gerente->id]);

                if ($usuariosOcupanteId2->isNotEmpty()) {
                    DB::table('users')->whereIn('id', $usuariosOcupanteId2)->update(['puesto_id' => $gerente->id]);
                }
            } else {
                DB::table('puestos')->where('id', $gerente->id)->update(['id' => 2]);
            }

            if ($usuariosGerente->isNotEmpty()) {
                DB::table('users')->whereIn('id', $usuariosGerente)->update(['puesto_id' => 2]);
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        });
    }

    public function down(): void
    {
        // No reversible de forma segura: el id original de Gerente no queda
        // registrado en ningún lado una vez aplicada la migración.
    }
};
