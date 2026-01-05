<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Region;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TicketSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $users = User::limit(20)->get();
        $regions = Region::limit(10)->get();
        $categories = Category::limit(10)->get();

        $tickets = Ticket::all();
        foreach ($tickets as $ticket) {
            $ticket->delete();
        }

        DB::table('tickets')->truncate();
        Ticket::factory(20)->create()->each(function ($ticket) use ($users, $regions, $categories) {
            $ticket->update([
                'region_id' => $regions->random()->id,
                'user_id' => $users->random()->id,
                'created_by' => $users->random()->id,
                'category_id' => $categories->random()->id,
                'assigned_to' => $users->random()->id
            ]);
        });
    }
}
