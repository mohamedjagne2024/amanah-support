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
            TypeSeeder::class,
            UserSeeder::class,
            RegionSeeder::class,
            KnowledgeBaseSeeder::class,
            FaqSeeder::class,
        ]);
    }
}
