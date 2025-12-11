<?php

namespace Database\Seeders;


use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {

        $this->call([
            RolesAndPermissionsSeeder::class,
            CountrySeeder::class,
            EmailTemplateSeeder::class,
            FrontPageSeeder::class,
            CategorySeeder::class,
            PrioritySeeder::class,
            StatusSeeder::class,
            DepartmentSeeder::class,
            TypeSeeder::class,
        ]);
    }
}
