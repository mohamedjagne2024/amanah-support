<?php

namespace App\Http\Controllers;

use App\Events\NewPublicChatMessage;
use App\Events\NewUnreadChatMessage;
use App\Events\ContactCreated;
use App\Models\Attachment;
use App\Models\Conversation;
use App\Models\Faq;
use App\Models\Message;
use App\Models\Participant;
use App\Models\Region;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Request;
use Inertia\Inertia;
use App\Events\NewChatMessage;
use Spatie\Permission\Models\Role;
use App\Traits\HasGoogleCloudStorage;

class ChatController extends Controller
{
    use HasGoogleCloudStorage;

    /**
     * Get the conversations query filtered by region for User role staff.
     */
    private function getFilteredConversationsQuery()
    {
        $user = Auth::user();
        $query = Conversation::orderBy('updated_at', 'DESC');

        // Check if the user has the 'User' role (staff) and filter by their region
        if ($user && $user->hasRole('User') && $user->region_id) {
            $query->where('region_id', $user->region_id);
        }

        return $query;
    }

    public function index()
    {
        return Inertia::render('chat/index', [
            'title' => 'Chat',
            'filters' => Request::all(['search']),
            'chat' => null,
            'conversations' => $this->getFilteredConversationsQuery()
                ->filter(Request::all(['search']))
                ->withCount([
                    'messages',
                    'messages as messages_count' => function ($query) {
                        $query->whereNotNull('contact_id')->where('is_read', 0);
                    }
                ])
                ->paginate(10)
                ->withQueryString()
                ->through(function ($chat) {
                    return [
                        'id' => $chat->id,
                        'slug' => $chat->slug ?? '',
                        'total_entry' => $chat->messages_count,
                        'title' => $chat->title,
                        'creator' => $chat->creator,
                        'region' => $chat->region?->name,
                        'created_at' => $chat->created_at,
                        'updated_at' => $chat->updated_at,
                    ];
                }),
        ]);
    }

    /**
     * Get available regions for the chat widget.
     * This is a public endpoint.
     */
    public function getRegions()
    {
        $regions = Region::orderBy('name')->get(['id', 'name']);
        return response()->json($regions);
    }

    /**
     * Get FAQs for the chat widget.
     * This is a public endpoint.
     */
    public function getFaqs()
    {
        $faqs = Faq::orderBy('name')->get(['id', 'name', 'details']);
        return response()->json($faqs);
    }

    /**
     * Initialize a chat session for guest users.
     * This is a public endpoint (no auth required).
     * Follows the same pattern as public ticket submission in HomeController.
     */
    public function init()
    {
        // Validate required fields for guest users
        $validated = Request::validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:100'],
            'member_number' => ['nullable', 'string', 'max:50'],
            'region_id' => ['nullable', 'integer', 'exists:regions,id'],
        ]);

        // Check if contact exists by email (same as ticketPublicStore)
        $contact = User::where('email', $validated['email'])->first();
        $plainPassword = null;
        $newConversation = null;

        if (empty($contact)) {
            // Create new contact if doesn't exist (same pattern as HomeController)
            $plainPassword = $this->generateRandomPassword();
            $contact = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'member_number' => $validated['member_number'] ?? null,
                'region_id' => $validated['region_id'] ?? null,
                'password' => Hash::make($plainPassword),
            ]);

            $contact->assignRole('contact');

            // Fire event to send email notification with login credentials
            event(new ContactCreated(['id' => $contact->id, 'password' => $plainPassword]));
        } else {
            // Update member_number and region if provided for existing contact
            $updateData = [];
            if (!empty($validated['member_number']) && empty($contact->member_number)) {
                $updateData['member_number'] = $validated['member_number'];
            }
            if (!empty($validated['region_id']) && empty($contact->region_id)) {
                $updateData['region_id'] = $validated['region_id'];
            }
            if (!empty($updateData)) {
                $contact->update($updateData);
            }

            // Check for existing conversation
            $newConversation = Conversation::where('contact_id', $contact->id)->first();
        }

        if (empty($newConversation)) {
            $newConversation = new Conversation;
            $newConversation->contact_id = $contact->id;
            $newConversation->region_id = $validated['region_id'] ?? $contact->region_id;
            $newConversation->title = "Support Chat";
            $newConversation->save();

            $initialMessage = "Thank you for starting a chat with us. Our support team will review your request and respond shortly.";

            // Find a staff user from the same region to assign initially
            $contactRole = Role::where('name', 'contact')->first();
            $userRole = Role::where('name', 'User')->first();

            // Try to find a staff member from the same region
            $user = null;
            if (!empty($validated['region_id'])) {
                $user = User::where('region_id', $validated['region_id'])
                    ->whereHas('roles', function ($query) use ($userRole) {
                        $query->where('roles.id', $userRole ? $userRole->id : 0);
                    })
                    ->first();
            }

            // Fallback to any non-contact user
            if (!$user) {
                $user = User::whereHas('roles', function ($query) use ($contactRole) {
                    $query->where('roles.id', '!=', $contactRole ? $contactRole->id : 0);
                })->first();
            }

            $message = new Message;
            $message->conversation_id = $newConversation->id;
            if (!empty($user)) {
                $message->user_id = $user->id;
            }
            $message->message = $initialMessage;
            $message->save();

            $participant = new Participant;
            if (!empty($user)) {
                $participant->user_id = $user->id;
            }
            $participant->contact_id = $contact->id;
            $participant->conversation_id = $newConversation->id;
            $participant->save();

            $message->creator = $contact;
            broadcast(new NewChatMessage($message))->toOthers();
        }

        $conversation = Conversation::with([
            'creator',
            'messages' => function ($q) {
                $q->orderBy('updated_at', 'asc');
            },
            'messages.attachments',
            'messages.user',
            'messages.contact',
            'participant',
            'participant.user'
        ])->find($newConversation->id);

        // Map attachments with signed URLs
        if ($conversation && $conversation->messages) {
            $conversation->messages->map(function ($message) {
                if ($message->attachments) {
                    $message->attachments->map(function ($attachment) {
                        $attachment->url = $this->getStorageUrl($attachment->path);
                        return $attachment;
                    });
                }
                return $message;
            });
        }

        // Return contact_id for guest session management
        $response = $conversation->toArray();
        $response['session_contact_id'] = $contact->id;

        return response()->json($response);
    }

    /**
     * Generate a random password.
     * Same implementation as HomeController.
     */
    private function generateRandomPassword()
    {
        $alphabet = "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
        $pass = [];
        $alphaLength = strlen($alphabet) - 1;
        for ($i = 0; $i < 13; $i++) {
            $n = rand(0, $alphaLength);
            $pass[] = $alphabet[$n];
        }
        return implode($pass);
    }

    public function getConversation($id, $contact_id)
    {
        $conversation = Conversation::with([
            'creator',
            'messages' => function ($q) {
                $q->orderBy('updated_at', 'asc');
            },
            'messages.attachments',
            'messages.contact',
            'participant',
            'participant.user'
        ])->where(function ($query) use ($id) {
            $query->where('id', $id)->orWhere('slug', $id);
        })->where('contact_id', $contact_id)->first();

        // Map attachments with signed URLs  
        if ($conversation && $conversation->messages) {
            $conversation->messages->map(function ($message) {
                if ($message->attachments) {
                    $message->attachments->map(function ($attachment) {
                        $attachment->url = $this->getStorageUrl($attachment->path);
                        return $attachment;
                    });
                }
                return $message;
            });
        }

        return response()->json($conversation);
    }

    public function getContactConversation()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $conversation = Conversation::with([
            'creator',
            'messages' => function ($q) {
                $q->orderBy('updated_at', 'asc');
            },
            'messages.attachments',
            'messages.user',
            'messages.contact',
            'participant',
            'participant.user'
        ])->where('contact_id', $user->id)->first();

        // Map attachments with signed URLs
        if ($conversation && $conversation->messages) {
            $conversation->messages->map(function ($message) {
                if ($message->attachments) {
                    $message->attachments->map(function ($attachment) {
                        $attachment->url = $this->getStorageUrl($attachment->path);
                        return $attachment;
                    });
                }
                return $message;
            });
        }

        return response()->json($conversation);
    }

    /**
     * Get conversation for a guest session using contact_id.
     * This is a public endpoint.
     */
    public function getGuestConversation()
    {
        $contactId = Request::input('contact_id');

        if (!$contactId) {
            return response()->json(['error' => 'Contact ID required'], 400);
        }

        $conversation = Conversation::with([
            'creator',
            'messages' => function ($q) {
                $q->orderBy('updated_at', 'asc');
            },
            'messages.attachments',
            'messages.user',
            'messages.contact',
            'participant',
            'participant.user'
        ])->where('contact_id', $contactId)->first();

        // Map attachments with signed URLs
        if ($conversation && $conversation->messages) {
            $conversation->messages->map(function ($message) {
                if ($message->attachments) {
                    $message->attachments->map(function ($attachment) {
                        $attachment->url = $this->getStorageUrl($attachment->path);
                        return $attachment;
                    });
                }
                return $message;
            });
        }

        return response()->json($conversation);
    }

    public function chat($id)
    {
        $user = Auth::user();

        // Build base query with region filtering for User role
        $chatQuery = Conversation::with([
            'creator',
            'messages' => function ($q) {
                $q->orderBy('updated_at', 'asc');
            },
            'messages.user',
            'messages.contact',
            'messages.attachments',
            'participant',
            'participant.user'
        ])->where(function ($query) use ($id) {
            $query->where('id', $id)->orWhere('slug', $id);
        });

        // If user has 'User' role, restrict to their region
        if ($user && $user->hasRole('User') && $user->region_id) {
            $chatQuery->where('region_id', $user->region_id);
        }

        $chat = $chatQuery->first();

        if (!$chat) {
            return redirect()->route('chat.index')->with('error', 'Conversation not found or access denied.');
        }

        Message::where(['conversation_id' => $id, 'is_read' => 0])->update(array('is_read' => 1));

        // Map messages with attachment URLs
        if ($chat && $chat->messages) {
            $chat->messages->map(function ($message) {
                if ($message->attachments) {
                    $message->attachments->map(function ($attachment) {
                        $attachment->url = $this->getStorageUrl($attachment->path);
                        return $attachment;
                    });
                }
                return $message;
            });
        }

        return Inertia::render('chat/index', [
            'title' => 'Chat',
            'filters' => Request::all(['search']),
            'chat' => $chat,
            'conversations' => $this->getFilteredConversationsQuery()
                ->filter(Request::all(['search']))
                ->withCount([
                    'messages',
                    'messages as messages_count' => function ($query) {
                        $query->whereNotNull('contact_id')->where('is_read', 0);
                    }
                ])
                ->paginate(10)
                ->withQueryString()
                ->through(function ($chat) {
                    return [
                        'id' => $chat->id,
                        'slug' => $chat->slug ?? '',
                        'total_entry' => $chat->messages_count,
                        'title' => $chat->title,
                        'creator' => $chat->creator,
                        'region' => $chat->region?->name,
                        'created_at' => $chat->created_at,
                        'updated_at' => $chat->updated_at,
                    ];
                }),
        ]);
    }

    public function emptyChat()
    {
        return Inertia::render('chat/index', [
            'filters' => Request::all('search'),
            'chat' => Conversation::with([
                'creator',
                'messages' => function ($q) {
                    $q->orderBy('updated_at', 'asc');
                },
                'messages.user',
                'messages.attachments',
                'participant',
                'participant.user'
            ])->first(),
            'conversations' => $this->getFilteredConversationsQuery()
                ->filter(Request::only('search'))
                ->withCount([
                    'messages',
                    'messages as messages_count' => function ($query) {
                        $query->whereNotNull('contact_id')->where('is_read', 0);
                    }
                ])
                ->paginate(10)
                ->withQueryString()
                ->through(function ($chat) {
                    return [
                        'id' => $chat->id,
                        'total_entry' => $chat->messages_count,
                        'title' => $chat->title,
                        'creator' => $chat->creator,
                        'region' => $chat->region?->name,
                        'created_at' => $chat->created_at,
                        'updated_at' => $chat->updated_at,
                    ];
                }),
        ]);
    }

    public function newMessage()
    {
        $request = Request::all();
        $newMessage = new Message;
        $newMessage->user_id = Auth::id();
        $newMessage->message = $request['message'] ?? '';
        $newMessage->conversation_id = $request['conversation_id'];
        $newMessage->save();

        // Handle file attachments
        if (Request::hasFile('files')) {
            $files = Request::file('files');
            $this->handleMessageAttachments($newMessage, $files);
        }

        // Update conversation title with last message (truncate to fit column)
        if (!empty($newMessage->message)) {
            $title = mb_substr($newMessage->message, 0, 50);
            Conversation::where('id', $newMessage->conversation_id)->update(['title' => $title]);
        }

        // Load relationships for the response and broadcast
        $message = Message::with(['contact', 'user', 'attachments'])->where('id', $newMessage->id)->first();

        // Map attachments with signed URLs
        if ($message->attachments) {
            $message->attachments->map(function ($attachment) {
                $attachment->url = $this->getStorageUrl($attachment->path);
                return $attachment;
            });
        }

        broadcast(new NewPublicChatMessage($message))->toOthers();

        return response()->json($message);
    }

    private function handleMessageAttachments(Message $message, array $files): void
    {
        // Configure GCS from database settings
        $this->configureGCS();

        foreach ($files as $file) {
            // Upload to Google Cloud Storage
            $path = $this->uploadToStorage($file, 'chat');

            if ($path) {
                Attachment::create([
                    'message_id' => $message->id,
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'path' => $path,
                    'user_id' => Auth::id(),
                ]);
            }
        }
    }

    public function sendPublicMessage()
    {
        $request = Request::all();
        $newMessage = new Message;
        if (isset($request['contact_id'])) {
            $newMessage->contact_id = $request['contact_id'];
        }
        $newMessage->message = $request['message'] ?? '';
        $newMessage->conversation_id = $request['conversation_id'];
        $newMessage->save();

        // Handle file attachments
        if (Request::hasFile('files')) {
            $files = Request::file('files');
            $this->handleMessageAttachments($newMessage, $files);
        }

        // Update conversation title with last message (truncate to fit column)
        if (!empty($newMessage->message)) {
            $title = mb_substr($newMessage->message, 0, 50);
            Conversation::where('id', $newMessage->conversation_id)->update(['title' => $title]);
        }

        $message = Message::with(['contact', 'user', 'attachments'])->where('id', $newMessage->id)->first();

        // Map attachments with signed URLs
        if ($message->attachments) {
            $message->attachments->map(function ($attachment) {
                $attachment->url = $this->getStorageUrl($attachment->path);
                return $attachment;
            });
        }

        broadcast(new NewPublicChatMessage($message))->toOthers();

        // Broadcast to admin notifications channel for real-time badge update
        broadcast(new NewUnreadChatMessage($message->conversation_id, $message->id));

        return response()->json($message);
    }


    public function store()
    {
        Conversation::create(
            Request::validate([
                'creator' => ['required', 'max:100'],
            ])
        );

        return Redirect::route('chat')->with('success', 'Chat created.');
    }

    public function destroy(Conversation $chat)
    {
        $chat->delete();
        return Redirect::route('chat')->with('success', 'Conversation deleted.');
    }

    public function restore(Conversation $chat)
    {
        $chat->restore();

        return Redirect::back()->with('success', 'Conversation restored.');
    }
}
