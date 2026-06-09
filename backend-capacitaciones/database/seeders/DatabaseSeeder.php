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
        $puestoGerente = Puesto::firstOrCreate(['nombre' => 'Gerente']);

        User::factory()->create([
            'name' => 'Administrador',
            'lastname' => 'Principal',
            'email' => 'admin@example.com',
            'usuario' => 'admin',
            'puesto_id' => $puestoAdmin->id,
            'estado' => 'Activo',
            'password' => 'Password123!',
            'permissions' => [
                'manage_news' => true,
                'news_access' => true,
                'edit_trainings' => true,
                'manage_passwords' => true,
                'create_users' => true,
                'delete_users' => true,
                'assign_permissions' => true,
            ],
        ]);

        User::factory()->create([
            'name' => 'Gerente',
            'lastname' => 'Regional',
            'email' => 'gerente@example.com',
            'usuario' => 'gerente',
            'puesto_id' => $puestoGerente->id,
            'estado' => 'Activo',
            'password' => 'Password123!',
            'permissions' => [
                'manage_news' => true,
                'news_access' => true,
                'edit_trainings' => true,
                'manage_passwords' => true,
                'create_users' => true,
                'delete_users' => false,
                'assign_permissions' => false,
            ],
        ]);
    }
}
