<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('categories')->truncate();
        Category::factory()->createMany([
            // Main Categories by Department
            // Department 1: Claims
            ['id' => 1, 'name' => 'Motor Insurance Claims', 'color' => '#FF0000'],
            ['id' => 2, 'name' => 'Health Insurance Claims', 'color' => '#FF0000'],
            ['id' => 3, 'name' => 'Property Insurance Claims', 'color' => '#FF0000'],
            ['id' => 4, 'name' => 'Life Insurance Claims', 'color' => '#FF0000'],

            // Department 2: Policy Services
            ['id' => 5, 'name' => 'New Policy', 'color' => '#FF0000'],
            ['id' => 6, 'name' => 'Policy Renewal', 'color' => '#FF0000'],
            ['id' => 7, 'name' => 'Policy Modification', 'color' => '#FF0000'],
            ['id' => 8, 'name' => 'Policy Cancellation', 'color' => '#FF0000'],

            // Department 3: Billing & Payments
            ['id' => 9, 'name' => 'Premium Payment', 'color' => '#FF0000'],
            ['id' => 10, 'name' => 'Invoice Inquiry', 'color' => '#FF0000'],
            ['id' => 11, 'name' => 'Refund Request', 'color' => '#FF0000'],

            // Department 4: General Inquiries
            ['id' => 12, 'name' => 'Account Management', 'color' => '#FF0000'],
            ['id' => 13, 'name' => 'Document Request', 'color' => '#FF0000'],
            ['id' => 14, 'name' => 'Complaints', 'color' => '#FF0000'],
            ['id' => 15, 'name' => 'General Questions', 'color' => '#FF0000'],
        ]);
    }
}
