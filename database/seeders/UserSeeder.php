<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Database\Factories\UserFactory;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        UserFactory::new([
            'name' => 'Administrator',
            'email' => 'admin@mohamed.dev',
            'is_super_admin' => true,
        ])->createOne();
    }
}
