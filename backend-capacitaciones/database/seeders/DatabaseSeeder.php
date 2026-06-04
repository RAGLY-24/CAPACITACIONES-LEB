<?php

namespace Database\Seeders;

use App\Models\Puesto;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $puestoAdmin = Puesto::firstOrCreate(['nombre' => 'SistemasAdmin']);

        User::factory()->create([
            'name' => 'Administrador',
            'lastname' => 'Principal',
            'email' => 'admin@example.com',
            'usuario' => 'admin',
            'puesto_id' => $puestoAdmin->id,
            'estado' => 'Activo',
            'password' => 'Password123!',
        ]);
    }
}
