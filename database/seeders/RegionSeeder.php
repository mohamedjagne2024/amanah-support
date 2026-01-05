<?php

namespace Database\Seeders;

use App\Models\Region;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RegionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('regions')->truncate();
        Region::factory()->createMany([
            ['id' => 1, 'name' => 'Hargeisa'],
            ['id' => 2, 'name' => 'Mogadishu'],
            ['id' => 3, 'name' => 'Garoowe'],
            ['id' => 4, 'name' => 'Kismayo'],
            ['id' => 5, 'name' => 'Baidoa'],
        ]);
    }
}
