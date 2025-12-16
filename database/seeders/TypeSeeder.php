<?php

namespace Database\Seeders;

use App\Models\Type;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('types')->truncate();
        Type::factory()->createMany([
            ['id' => 1, 'name' => 'Inquiry'],
            ['id' => 2, 'name' => 'Request'],
            ['id' => 3, 'name' => 'Complaint'],
            ['id' => 4, 'name' => 'Claim Follow-up'],
            ['id' => 5, 'name' => 'Urgent'],
            ['id' => 6, 'name' => 'Feedback'],
        ]);
    }
}
