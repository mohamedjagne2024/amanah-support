<?php

namespace App\Http\Controllers;

use App\Events\NewPublicChatMessage;
use App\Events\NewUnreadChatMessage;
use App\Events\ContactCreated;
use App\Models\Attachment;
use App\Models\Conversation;
use App\Models\Faq;
use App\Models\KnowledgeBase;
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
        $query = Conversation::orderBy('updated_at', 'DESC')
            ->where('is_ai', 0);

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
     * Register a guest user for the chat widget.
     * Creates a new contact or finds existing one.
     * This is a public endpoint (no auth required).
     */
    public function registerGuest()
    {
        $validated = Request::validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:100'],
            'member_number' => ['nullable', 'string', 'max:50'],
            'region_id' => ['nullable', 'integer', 'exists:regions,id'],
        ]);

        // Check if contact exists by email (same as HomeController ticketPublicStore)
        $contact = User::where('email', $validated['email'])->first();
        $isNewUser = false;

        if (empty($contact)) {
            // Create new contact if doesn't exist
            $plainPassword = $this->generateRandomPassword();
            $contact = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'member_number' => $validated['member_number'] ?? null,
                'region_id' => $validated['region_id'] ?? null,
                'password' => Hash::make($plainPassword),
            ]);

            $contact->assignRole('contact');
            $isNewUser = true;

            // Fire event to send email notification with login credentials
            event(new ContactCreated(['id' => $contact->id, 'password' => $plainPassword]));
        } else {
            // Update member_number and region_id if provided and not already set
            $updateData = [];
            if (!empty($validated['member_number']) && empty($contact->member_number)) {
                $updateData['member_number'] = $validated['member_number'];
            }
            if (!empty($validated['region_id']) && empty($contact->region_id)) {
                $updateData['region_id'] = $validated['region_id'];
            }
            if (!empty($updateData)) {
                $contact->update($updateData);
                $contact->refresh();
            }
        }

        // Return user data for localStorage
        return response()->json([
            'success' => true,
            'is_new_user' => $isNewUser,
            'user' => [
                'id' => $contact->id,
                'name' => $contact->name,
                'email' => $contact->email,
                'member_number' => $contact->member_number,
                'region_id' => $contact->region_id,
            ],
        ]);
    }

    /**
     * Handle Gemini AI chat requests.
     * This is a public endpoint that uses FAQ and Knowledge Base content to generate responses.
     */
    public function geminiChat()
    {
        $validated = Request::validate([
            'message' => ['required', 'string', 'max:1000'],
            'locale' => ['nullable', 'string', 'max:10'],
            'conversation_id' => ['nullable', 'integer', 'exists:conversations,id'],
            'contact_id' => ['nullable', 'integer'],
        ]);

        $userMessage = $validated['message'];
        $locale = $validated['locale'] ?? 'en';
        $conversationId = $validated['conversation_id'] ?? null;
        $contactId = $validated['contact_id'] ?? null;

        // Get the Gemini API key from settings
        $apiKey = \App\Models\Settings::get('gemini_api_key');

        if (empty($apiKey)) {
            return response()->json([
                'success' => false,
                'message' => 'AI chat is not configured. Please contact support.',
            ], 503);
        }

        // Get or create the AI conversation
        $conversation = null;
        if ($conversationId) {
            $conversation = Conversation::where('id', $conversationId)
                ->where('is_ai', 1)
                ->first();
        }

        // Create new AI conversation if needed
        if (!$conversation) {
            $conversation = Conversation::create([
                'title' => mb_substr($userMessage, 0, 50),
                'contact_id' => $contactId,
                'region_id' => null,
                'is_ai' => 1,
            ]);
        }

        // Save the user's message
        $userMessageRecord = new Message();
        $userMessageRecord->conversation_id = $conversation->id;
        $userMessageRecord->contact_id = $contactId;
        $userMessageRecord->message = $userMessage;
        $userMessageRecord->is_read = 1;
        $userMessageRecord->save();

        // Get previous messages for conversation context (for follow-up questions)
        $previousMessages = Message::where('conversation_id', $conversation->id)
            ->orderBy('created_at', 'asc')
            ->get();

        // Build conversation history for Gemini
        $conversationHistory = $this->buildConversationHistory($previousMessages);

        // Gather FAQ and Knowledge Base content for context
        $faqs = Faq::orderBy('name')->get(['name', 'details']);
        $knowledgeBase = KnowledgeBase::orderBy('title')->get(['title', 'details']);

        // Build the context from FAQs and Knowledge Base
        $context = $this->buildKnowledgeContext($faqs, $knowledgeBase);

        // Determine response language instruction
        $languageInstruction = $this->getLanguageInstruction($locale);

        // Build the prompt for Gemini
        $systemPrompt = $this->buildGeminiPrompt($context, $languageInstruction);

        try {
            $response = $this->callGeminiApi($apiKey, $systemPrompt, $userMessage, $conversationHistory);

            // Save the AI's response
            $aiMessageRecord = new Message();
            $aiMessageRecord->conversation_id = $conversation->id;
            $aiMessageRecord->user_id = null; // AI message - no user_id or contact_id
            $aiMessageRecord->contact_id = null;
            $aiMessageRecord->message = $response;
            $aiMessageRecord->is_read = 1;
            $aiMessageRecord->save();

            // Update conversation title with latest message
            $conversation->update(['title' => mb_substr($userMessage, 0, 50)]);

            return response()->json([
                'success' => true,
                'message' => $response,
                'conversation_id' => $conversation->id,
                'user_message_id' => $userMessageRecord->id,
                'ai_message_id' => $aiMessageRecord->id,
            ]);
        } catch (\Exception $e) {
            \Log::error('Gemini API Error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Unable to process your request. Please try again or contact support.',
                'conversation_id' => $conversation->id,
            ], 500);
        }
    }

    /**
     * Get AI conversation history for a contact.
     * This is a public endpoint for retrieving previous AI chat messages.
     */
    public function getAiConversation()
    {
        $contactId = Request::input('contact_id');

        if (!$contactId) {
            return response()->json(['error' => 'Contact ID required'], 400);
        }

        // Find the most recent AI conversation for this contact
        $conversation = Conversation::with([
            'messages' => function ($q) {
                $q->orderBy('created_at', 'asc');
            },
            'messages.contact',
        ])
            ->where('contact_id', $contactId)
            ->where('is_ai', 1)
            ->orderBy('updated_at', 'desc')
            ->first();

        if (!$conversation) {
            return response()->json([
                'conversation' => null,
                'messages' => [],
            ]);
        }

        // Format messages for the frontend
        $formattedMessages = $conversation->messages->map(function ($message) {
            return [
                'id' => $message->id,
                'role' => $message->contact_id ? 'user' : 'assistant',
                'content' => $message->message,
                'timestamp' => $message->created_at->toIso8601String(),
            ];
        });

        return response()->json([
            'conversation_id' => $conversation->id,
            'messages' => $formattedMessages,
        ]);
    }

    /**
     * Build conversation history from previous messages for context.
     */
    private function buildConversationHistory($messages): array
    {
        $history = [];
        foreach ($messages as $message) {
            // Determine role: if contact_id is set, it's the user; otherwise it's the assistant
            $role = $message->contact_id ? 'user' : 'model';
            $history[] = [
                'role' => $role,
                'parts' => [['text' => $message->message]],
            ];
        }
        return $history;
    }

    /**
     * Build knowledge context from FAQs and Knowledge Base articles.
     */
    private function buildKnowledgeContext($faqs, $knowledgeBase): string
    {
        $context = "";

        if ($faqs->count() > 0) {
            $context .= "FAQ KNOWLEDGE:\n";
            foreach ($faqs as $faq) {
                $details = strip_tags($faq->details);
                $context .= "Q: {$faq->name}\nA: {$details}\n\n";
            }
        }

        if ($knowledgeBase->count() > 0) {
            $context .= "\nKNOWLEDGE BASE ARTICLES:\n";
            foreach ($knowledgeBase as $article) {
                $details = strip_tags($article->details);
                $context .= "Title: {$article->title}\nContent: {$details}\n\n";
            }
        }

        return $context;
    }

    /**
     * Get language instruction based on locale.
     */
    private function getLanguageInstruction(string $locale): string
    {
        $languageMap = [
            'en' => 'English',
            'so' => 'Somali',
            'ar' => 'Arabic',
        ];

        $language = $languageMap[$locale] ?? 'English';

        return "Respond in {$language}. If the user writes in a different language, respond in that language instead.";
    }

    /**
     * Build the system prompt for Gemini.
     */
    private function buildGeminiPrompt(string $context, string $languageInstruction): string
    {
        return <<<PROMPT
You are a helpful customer support assistant for Amanah Insurance. Your role is to provide minimal, clear, and accurate answers based on the company's FAQ and Knowledge Base content.

IMPORTANT RULES:
1. Keep responses brief and to the point - aim for 1-3 sentences when possible.
2. Only answer questions related to the provided knowledge base content.
3. If a question is not covered in the knowledge base, politely suggest the user contact live support for assistance.
4. Never make up information that is not in the knowledge base.
5. Be friendly but professional.
6. {$languageInstruction}

KNOWLEDGE BASE CONTENT:
{$context}

If the user's question is not related to our services or is outside the scope of the knowledge base, respond with something like: "I don't have information about that topic. Would you like to chat with our live support team for more help?"
PROMPT;
    }

    /**
     * Call the Gemini API to generate a response.
     */
    private function callGeminiApi(string $apiKey, string $systemPrompt, string $userMessage, array $conversationHistory = []): string
    {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKey}";

        // Build the contents array with conversation history for multi-turn support
        $contents = [];

        // Add system prompt as the first message
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $systemPrompt]],
        ];
        $contents[] = [
            'role' => 'model',
            'parts' => [['text' => 'I understand. I will act as the Amanah Insurance customer support assistant and follow all the rules you specified.']],
        ];

        // Add conversation history (previous messages for context)
        foreach ($conversationHistory as $historyItem) {
            // Skip the current message (it will be added at the end)
            $contents[] = $historyItem;
        }

        // Add the current user message if not already in history
        $hasCurrentMessage = false;
        foreach ($conversationHistory as $item) {
            if ($item['role'] === 'user' && isset($item['parts'][0]['text']) && $item['parts'][0]['text'] === $userMessage) {
                $hasCurrentMessage = true;
                break;
            }
        }

        if (!$hasCurrentMessage) {
            $contents[] = [
                'role' => 'user',
                'parts' => [['text' => $userMessage]],
            ];
        }

        $payload = [
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.3,
                'maxOutputTokens' => 500,
                'topP' => 0.8,
                'topK' => 40,
            ],
            'safetySettings' => [
                [
                    'category' => 'HARM_CATEGORY_HARASSMENT',
                    'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
                ],
                [
                    'category' => 'HARM_CATEGORY_HATE_SPEECH',
                    'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
                ],
                [
                    'category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
                ],
                [
                    'category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
                ],
            ],
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            throw new \Exception("cURL Error: {$curlError}");
        }

        if ($httpCode !== 200) {
            \Log::error("Gemini API returned HTTP {$httpCode}: {$response}");
            throw new \Exception("Gemini API Error: HTTP {$httpCode}");
        }

        $data = json_decode($response, true);

        if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            return trim($data['candidates'][0]['content']['parts'][0]['text']);
        }

        throw new \Exception("Invalid response structure from Gemini API");
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
        ])->where('id', $id)->where('contact_id', $contact_id)->first();

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
        ])->where('id', $id);

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
            ])->where('is_ai', 0)->first(),
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
