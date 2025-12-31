<?php

namespace App\Http\Controllers;

use App\Events\TicketCreated;
use App\Models\Attachment;
use App\Models\Category;
use App\Models\Department;
use App\Models\FrontPage;
use App\Models\Settings;
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

class HomeController extends Controller
{
    use HasGoogleCloudStorage;

    public function index()
    {
        return Inertia::render('landing/home', [
            'title' => 'Home - Amanah Support',
            'page' => FrontPage::where('slug', 'home')->first(),
            'footer' => FrontPage::where('slug', 'footer')->first(),

            'require_login' => collect(json_decode(Settings::where('name', 'enable_options')->value('value') ?? '[]', true))
                ->first(fn($option) => $option['slug'] === 'require_login_submit_ticket' && ($option['value'] ?? false)),
        ]);
    }

    public function ticketOpen()
    {
        $enable_options = Settings::where('name', 'enable_options')->value('value');
        $require_login = collect(json_decode($enable_options, true))
            ->first(fn($option) => $option['slug'] === 'require_login_submit_ticket' && $option['value'] ?? false);

        if ($require_login) {
            return Redirect::route('login');
        }

        $hide_ticket_fields = [];

        $get_hide_ticket_fields = Settings::where('name', 'hide_ticket_fields')->first();
        if (!empty($get_hide_ticket_fields)) {
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

    public function ticketPublicStore()
    {
        $ticket_data = Request::validate([
            'name' => ['required', 'max:40'],
            'subject' => ['required'],
            'email' => ['required', 'max:60', 'email'],
            'details' => ['required'],
            'custom_field' => ['nullable'],
        ]);

        $contact = User::where('email', $ticket_data['email'])->first();
        $plain_password = null;

        if (empty($contact)) {
            $plain_password = $this->genRendomPassword();
            $contact = User::create([
                'name' => $ticket_data['name'],
                'email' => $ticket_data['email'],
                'password' => $plain_password,
            ]);

            $contact->assignRole('contact');
        }

        $ticketObject = [
            'subject' => $ticket_data['subject'],
            'details' => $ticket_data['details'],
            'contact_id' => $contact->id,
            'status' => 'pending', // default status for new tickets
            'priority' => 'low', // default priority for new tickets
        ];

        $ticket = Ticket::create($ticketObject);

        if (!empty($ticket_data['custom_field'])) {
            foreach ($ticket_data['custom_field'] as $cfk => $cfv) {
                if (!empty($ticket_field)) {
                    TicketEntry::create(['ticket_id' => $ticket->id, 'field_id' => $ticket_field->id, 'name' => $cfk, 'label' => $ticket_field->label, 'value' => $cfv]);
                }
            }
        }

        if (Request::hasFile('files')) {
            $files = Request::file('files');
            $this->handleAttachmentUploads($ticket, $files);
        }

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

    private function genRendomPassword()
    {
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
     * Handle attachment uploads to Google Cloud Storage.
     */
    private function handleAttachmentUploads(Ticket $ticket, array $files): void
    {
        // Configure GCS from database settings
        $this->configureGCS();

        foreach ($files as $file) {
            // Upload to Google Cloud Storage
            $path = $this->uploadToStorage($file, 'tickets');

            if ($path) {
                Attachment::create([
                    'ticket_id' => $ticket->id,
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'path' => $path,
                    'user_id' => null,
                ]);
            }
        }
    }
}
