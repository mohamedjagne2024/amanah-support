<?php

namespace Database\Seeders;

use App\Models\TicketEntry;
use App\Models\TicketField;
use Illuminate\Database\Seeder;

class FreshDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $this->call([
            FrontPageSeeder::class,
            UserSeeder::class,
            OrganizationSeeder::class,
            CategorySeeder::class,
            DepartmentSeeder::class,
            TypeSeeder::class,
            StatusSeeder::class,
            KnowledgeBaseSeeder::class,
            FaqSeeder::class,
            CommentSeeder::class,
            ReviewSeeder::class,
            TicketSeeder::class,
            ConversationSeeder::class,
            MessageSeeder::class,
            NoteSeeder::class,
        ]);
    }
}
