<?php

namespace App\Http\Controllers;

use App\Events\TicketCreated;
use App\Models\Attachment;
use App\Models\Category;
use App\Models\Conversation;
use App\Models\Department;
use App\Models\FrontPage;
use App\Models\Message;
use App\Models\Participant;
use App\Models\Settings;
use App\Models\Status;
use App\Models\Ticket;
use App\Models\TicketEntry;
use App\Models\Type;
use App\Models\User;
use App\Traits\HasGoogleCloudStorage;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class HomeController extends Controller
{
    use HasGoogleCloudStorage;

    public function index(){
        return Inertia::render('landing/home', [
            'title' => 'Home - Amanah Support',
            'page' => FrontPage::where('slug', 'home')->first(),
            'footer' => FrontPage::where('slug', 'footer')->first(),

            'hide_ticket_fields' => json_decode(Settings::where('name', 'hide_ticket_fields')->value('value') ?? '[]', true),
            'require_login' => collect(json_decode(Settings::where('name', 'enable_options')->value('value') ?? '[]', true))
                ->first(fn($option) => $option['slug'] === 'require_login_submit_ticket' && ($option['value'] ?? false)),
            'departments' => Department::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
            'all_categories' => Category::orderBy('name')
                ->get(),
            'types' => Type::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
        ]);
    }

    public function ticketOpen(){
        $enable_options = Settings::where('name', 'enable_options')->value('value');
        $require_login = collect(json_decode($enable_options, true))
            ->first(fn($option) => $option['slug'] === 'require_login_submit_ticket' && $option['value'] ?? false);

        if ($require_login) {
            return Redirect::route('login');
        }

        $hide_ticket_fields = [];

        $get_hide_ticket_fields = Settings::where('name', 'hide_ticket_fields')->first();
        if(!empty($get_hide_ticket_fields)){
            $hide_ticket_fields = json_decode($get_hide_ticket_fields->value, true);
        }
        return Inertia::render('Landing/OpenTicket', [
            'footer' => FrontPage::where('slug', 'footer')->first(),
            'title' => 'Open Ticket - Amanah Support',
            'hide_ticket_fields' => $hide_ticket_fields,
            'departments' => Department::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
            'all_categories' => Category::orderBy('name')
                ->get(),
            'types' => Type::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
        ]);
    }

    public function ticketPublicStore() {
        $required_fields = [];
        $hide_ticket_fields = [];

        $get_required_fields = Settings::where('name', 'required_ticket_fields')->first();
        $get_hide_ticket_fields = Settings::where('name', 'hide_ticket_fields')->first();
        if(!empty($get_required_fields)){
            $required_fields = json_decode($get_required_fields->value, true);
        }
        if(!empty($get_hide_ticket_fields)){
            $hide_ticket_fields = json_decode($get_hide_ticket_fields->value, true);
        }

        $is_required = array_filter($required_fields, function ($rf) use ($hide_ticket_fields){
            return !in_array($rf, $hide_ticket_fields);
        });

        $ticket_data = Request::validate([
            'name' => ['required', 'max:40'],
            'subject' => ['required'],
            'department_id' => ['nullable', Rule::exists('departments', 'id')],
            'category_id' => ['nullable', Rule::exists('categories', 'id')],
            'sub_category_id' => ['nullable', Rule::exists('categories', 'id')],
            'type_id' => ['nullable', Rule::exists('types', 'id')],
            'email' => ['required', 'max:60', 'email'],
            'details' => ['required'],
            'custom_field' => ['nullable'],
        ]);

        $contact = User::where('email', $ticket_data['email'])->first();
        $plain_password = null;

        if(empty($contact)){
            $plain_password = $this->genRendomPassword();
            $contact = User::create([
                'name' => $ticket_data['name'],
                'email' => $ticket_data['email'],
                'password' => $plain_password,
            ]);

            $contact->assignRole('contact');
        }

        $status = Status::where('slug', 'LIKE', '%pending%')->first();
        $ticketObject = [
            'subject' => $ticket_data['subject'],
            'details' => $ticket_data['details'],
            'department_id' => $ticket_data['department_id'],
            'category_id' => $ticket_data['category_id'],
            'sub_category_id' => $ticket_data['sub_category_id'],
            'type_id' => $ticket_data['type_id'],
            'contact_id' => $contact->id
        ];

        if($status){
            $ticketObject['status_id'] = $status->id;
        }

        $ticket = Ticket::create($ticketObject);

        if(!empty($ticket_data['custom_field'])){
            foreach ($ticket_data['custom_field'] as $cfk => $cfv){
                if(!empty($ticket_field)){
                    TicketEntry::create(['ticket_id' => $ticket->id, 'field_id' => $ticket_field->id, 'name' => $cfk, 'label' => $ticket_field->label, 'value' => $cfv]);
                }
            }
        }

        if(Request::hasFile('files')){
            $files = Request::file('files');
            $this->handleAttachmentUploads($ticket, $files);
        }

        // Create a conversation linked to the ticket and contact
        $this->createTicketConversation($ticket, $contact);

        $variables = [
            'name' => $contact->name,
            'email' => $contact->email,
            'password' => $plain_password,
            'login_url' => URL::to('login'),
            'sender_name' => config('mail.from.name', 'support@amanahsupport.com'),
            'ticket_id' => $ticket->id,
            'uid' => $ticket->uid,
            'subject' => $ticket->subject,
            'source' => 'public_form',
        ];
        event(new TicketCreated($variables));

        return Redirect::route('home')->with('success', 'The ticket has been submitted. We will send you a message to follow up on the ticket update. Please check your spam folder.');
    }

    private function genRendomPassword() {
        $alphabet = "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
        $pass = array(); //remember to declare $pass as an array
        $alphaLength = strlen($alphabet) - 1; //put the length -1 in cache
        for ($i = 0; $i < 13; $i++) {
            $n = rand(0, $alphaLength);
            $pass[] = $alphabet[$n];
        }
        return implode($pass); //turn the array into a string
    }

    /**
     * Create a conversation linked to the ticket and contact.
     */
    private function createTicketConversation(Ticket $ticket, User $contact): Conversation
    {
        // Create the conversation
        $conversation = new Conversation();
        $conversation->contact_id = $contact->id;
        $conversation->ticket_id = $ticket->id;
        $conversation->title = "Ticket #{$ticket->uid}: {$ticket->subject}";
        $conversation->save();

        // Find an admin user to be the initial responder
        $adminRole = Role::where('name', 'admin')->first();
        $adminUser = User::whereHas('roles', function ($query) use ($adminRole) {
            $query->where('roles.id', $adminRole ? $adminRole->id : 0);
        })->first();

        // Create an initial welcome message
        $initialMessage = "Thank you for submitting your ticket. Your ticket ID is #{$ticket->uid}. Our support team will review your request and respond shortly.";
        
        $message = new Message();
        $message->conversation_id = $conversation->id;
        if ($adminUser) {
            $message->user_id = $adminUser->id;
        }
        $message->message = $initialMessage;
        $message->save();

        // Create a participant record
        $participant = new Participant();
        if ($adminUser) {
            $participant->user_id = $adminUser->id;
        }
        $participant->contact_id = $contact->id;
        $participant->conversation_id = $conversation->id;
        $participant->save();

        return $conversation;
    }

    /**
     * Handle attachment uploads to Google Cloud Storage.
     */
    private function handleAttachmentUploads(Ticket $ticket, array $files): void
    {
        // Configure GCS from database settings
        $this->configureGCS();

        foreach ($files as $file) {            
            // Upload to Google Cloud Storage
            $path = $this->uploadToStorage($file, 'tickets');

            if($path){
                Attachment::create([
                    'ticket_id' => $ticket->id,
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'path' => $path,
                    'user_id' => null, // No authenticated user for public submissions
                ]);
            }
        }
    }
}
