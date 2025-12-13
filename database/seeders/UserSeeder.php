<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        User::query()->create([
            'name' => 'Administrator',
            'email' => 'admin@mohamed.dev',
            'is_super_admin' => true,
            'password' => bcrypt('password'),
        ]);
    }
}
