import { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Paperclip,
  FileText,
  User as UserIcon,
  ArrowLeft,
  Bot,
  Sparkles
} from 'lucide-react';
import type { SharedData, Auth } from '@/types';
import { useChatMessageListener } from '@/hooks/usePusher';
import { useLanguageContext } from '@/context/useLanguageContext';

type User = {
  id: number;
  name: string;
  email: string;
  profile_picture_url?: string | null;
};

type Contact = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture_url?: string | null;
};

type Attachment = {
  id: number;
  name: string;
  path: string;
  url: string;
};

type Message = {
  id: number;
  conversation_id: number;
  user_id: number | null;
  contact_id: number | null;
  message: string;
  is_read: number;
  created_at: string;
  updated_at: string;
  user?: User;
  contact?: Contact;
  attachments?: Attachment[];
};

type Conversation = {
  id: number;
  slug?: string;
  title: string;
  contact_id: number;
  created_at: string;
  updated_at: string;
  creator?: any;
  messages?: Message[];
  participant?: any;
  session_contact_id?: number;
};

type Region = {
  id: number;
  name: string;
};

// AI Chat Message type
type AiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

// Stored user type for localStorage
type StoredUser = {
  id: number;
  name: string;
  email: string;
  member_number: string | null;
  region_id: number | null;
};

type ChatStep = 'register' | 'ai-chat' | 'chat';

// Avatar component with initials or profile picture
const Avatar = ({ name, profilePicture, className = '' }: { name: string; profilePicture?: string | null; className?: string }) => {
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getColorClass = (name: string) => {
    const colors = [
      'bg-primary',
      'bg-success',
      'bg-info',
      'bg-warning',
      'bg-purple-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (profilePicture) {
    return (
      <img
        src={profilePicture}
        alt={name}
        className={`size-8 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`size-8 rounded-full ${getColorClass(name)} flex items-center justify-center text-white font-semibold text-xs ${className}`}>
      {getInitials(name)}
    </div>
  );
};

// Format message time
const formatMessageTime = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).toLowerCase();

  if (isToday) {
    return timeStr;
  }

  const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
  return `${dayStr} ${timeStr}`;
};

export default function ChatWidget() {
  const { auth } = usePage<SharedData>().props;
  const { t, language } = useLanguageContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [hasCheckedConversation, setHasCheckedConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Guest registration state
  const [currentStep, setCurrentStep] = useState<ChatStep>('ai-chat');
  const [regions, setRegions] = useState<Region[]>([]);
  const [guestContactId, setGuestContactId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    member_number: '',
    region_id: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [registeredUser, setRegisteredUser] = useState<StoredUser | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // AI Chat state
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInputMessage, setAiInputMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiConversationId, setAiConversationId] = useState<number | null>(null);
  const [hasLoadedAiHistory, setHasLoadedAiHistory] = useState(false);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!auth?.user;
  const userRoles = (auth as Auth & { roles?: string[] })?.roles || [];
  const isContact = userRoles.includes('Contact');

  // Scroll to bottom of AI chat
  const scrollAiToBottom = () => {
    if (aiMessagesEndRef.current) {
      aiMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollAiToBottom();
  }, [aiMessages]);

  // Check localStorage for existing guest session and user data
  useEffect(() => {
    if (!isLoggedIn) {
      // Check for saved user data
      const savedUserData = localStorage.getItem('chat_guest_user');
      if (savedUserData) {
        try {
          const userData: StoredUser = JSON.parse(savedUserData);
          setRegisteredUser(userData);
          setGuestContactId(userData.id);
          setFormData({
            name: userData.name,
            email: userData.email,
            member_number: userData.member_number || '',
            region_id: userData.region_id?.toString() || '',
          });
          // User is registered, stay on AI chat (default)
        } catch (e) {
          // Invalid stored data, clear it
          localStorage.removeItem('chat_guest_user');
          localStorage.removeItem('chat_guest_contact_id');
        }
      } else {
        // Fallback: check for old format (just contact_id)
        const savedContactId = localStorage.getItem('chat_guest_contact_id');
        if (savedContactId) {
          setGuestContactId(parseInt(savedContactId));
        }
      }
    }
  }, [isLoggedIn]);

  // Load regions when widget opens for non-logged-in users
  useEffect(() => {
    if (isOpen && !isLoggedIn && currentStep === 'register') {
      loadRegions();
    }
  }, [isOpen, isLoggedIn, currentStep]);

  // Load AI conversation history when widget opens or user becomes available
  const loadAiConversationHistory = async () => {
    const contactId = isLoggedIn ? auth?.user?.id : (registeredUser?.id || guestContactId);

    if (!contactId || hasLoadedAiHistory) {
      return;
    }

    try {
      const response = await fetch(`/chat/ai/conversation?contact_id=${contactId}`);

      if (response.ok) {
        const data = await response.json();

        if (data.conversation_id && data.messages && data.messages.length > 0) {
          // Convert backend messages to AiMessage format
          const loadedMessages: AiMessage[] = data.messages.map((msg: any) => ({
            id: `${msg.role}-${msg.id}`,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          }));

          setAiMessages(loadedMessages);
          setAiConversationId(data.conversation_id);
        } else {
          // No previous conversation, show welcome message
          const welcomeMessage: AiMessage = {
            id: 'welcome',
            role: 'assistant',
            content: t('chatWidget.aiWelcomeMessage'),
            timestamp: new Date(),
          };
          setAiMessages([welcomeMessage]);
        }
      }
    } catch (error) {
      // On error, show welcome message
      const welcomeMessage: AiMessage = {
        id: 'welcome',
        role: 'assistant',
        content: t('chatWidget.aiWelcomeMessage'),
        timestamp: new Date(),
      };
      setAiMessages([welcomeMessage]);
    } finally {
      setHasLoadedAiHistory(true);
    }
  };

  // Initialize AI chat - load history or show welcome message
  useEffect(() => {
    const contactId = isLoggedIn ? auth?.user?.id : (registeredUser?.id || guestContactId);

    if (currentStep === 'ai-chat' && isOpen) {
      if (contactId && !hasLoadedAiHistory) {
        // User is known, try to load previous AI conversation
        loadAiConversationHistory();
      } else if (!contactId) {
        // Guest user: Check session storage first
        const storedHistory = sessionStorage.getItem('amanah_ai_chat_history');
        if (storedHistory) {
          try {
            const parsedHistory = JSON.parse(storedHistory);
            // Convert string timestamps back to Date objects
            const hydratedHistory = parsedHistory.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            setAiMessages(hydratedHistory);
            setHasLoadedAiHistory(true);
          } catch (e) {
            console.error('Failed to parse stored chat history', e);
            initializeWelcomeMessage();
          }
        } else if (aiMessages.length === 0) {
          initializeWelcomeMessage();
        }
      }
    }
  }, [currentStep, isLoggedIn, registeredUser, guestContactId, hasLoadedAiHistory, t, isOpen]);

  // Helper to init welcome message
  const initializeWelcomeMessage = () => {
    const welcomeMessage: AiMessage = {
      id: 'welcome',
      role: 'assistant',
      content: t('chatWidget.aiWelcomeMessage'),
      timestamp: new Date(),
    };
    setAiMessages([welcomeMessage]);
    setHasLoadedAiHistory(true);
  };

  // Save AI messages to session storage for guests
  useEffect(() => {
    const contactId = isLoggedIn ? auth?.user?.id : (registeredUser?.id || guestContactId);
    if (!contactId && aiMessages.length > 0) {
      sessionStorage.setItem('amanah_ai_chat_history', JSON.stringify(aiMessages));
    }
  }, [aiMessages, isLoggedIn, registeredUser, guestContactId]);

  const loadRegions = async () => {
    try {
      const response = await fetch('/chat/regions');
      if (response.ok) {
        const data = await response.json();
        setRegions(data);
      }
    } catch (error) {
      console.error('Failed to load regions:', error);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  // Check if user has an existing conversation (for logged-in contacts)
  const checkExistingConversation = async () => {
    if (!auth?.user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/chat/contact/conversation');
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          setConversation(data);
        }
      }
    } catch (error) {
      // Silent fail
    } finally {
      setIsLoading(false);
      setHasCheckedConversation(true);
    }
  };

  // Check if guest has an existing conversation
  const checkGuestConversation = async () => {
    if (!guestContactId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/chat/guest/conversation?contact_id=${guestContactId}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          setConversation(data);
        }
      }
    } catch (error) {
      // Silent fail
    } finally {
      setIsLoading(false);
      setHasCheckedConversation(true);
    }
  };

  // Load conversation when step changes to chat
  useEffect(() => {
    if (currentStep === 'chat' && !hasCheckedConversation) {
      if (isLoggedIn) {
        checkExistingConversation();
      } else if (guestContactId) {
        checkGuestConversation();
      }
    }
  }, [currentStep, isLoggedIn, guestContactId, hasCheckedConversation]);

  // Start a new chat conversation (for logged-in contacts)
  const startNewChat = async () => {
    if (!auth?.user) return;

    setIsStarting(true);
    try {
      const response = await fetch('/chat/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          name: auth.user.name,
          email: auth.user.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          setConversation(data);
        }
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsStarting(false);
    }
  };

  // Start a new chat conversation for guest users
  const startGuestChat = async () => {
    // Use registered user data if available, otherwise use form data
    const userData = registeredUser || {
      name: formData.name,
      email: formData.email,
      member_number: formData.member_number || null,
      region_id: formData.region_id ? parseInt(formData.region_id) : null,
    };

    setIsStarting(true);
    try {
      const response = await fetch('/chat/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          member_number: userData.member_number,
          region_id: userData.region_id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          setConversation(data);
          if (data.session_contact_id) {
            setGuestContactId(data.session_contact_id);
            localStorage.setItem('chat_guest_contact_id', data.session_contact_id.toString());

            // Also store user data if not already stored
            if (!registeredUser) {
              const storedUser: StoredUser = {
                id: data.session_contact_id,
                name: userData.name,
                email: userData.email,
                member_number: userData.member_number,
                region_id: userData.region_id,
              };
              localStorage.setItem('chat_guest_user', JSON.stringify(storedUser));
              setRegisteredUser(storedUser);
            }
          }
          setCurrentStep('chat');
        }
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
    } finally {
      setIsStarting(false);
    }
  };

  // Validate registration form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = t('chatWidget.fullNameRequired');
    }

    if (!formData.email.trim()) {
      errors.email = t('chatWidget.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('chatWidget.invalidEmail');
    }

    if (!formData.region_id) {
      errors.region_id = t('chatWidget.regionRequired');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle registration form submission - creates/finds contact user
  // Then starts live chat since user clicked "Chat with Live Support"
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsRegistering(true);
    try {
      const response = await fetch('/chat/register-guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          member_number: formData.member_number || null,
          region_id: formData.region_id ? parseInt(formData.region_id) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Store user data in localStorage
          const userData: StoredUser = data.user;
          localStorage.setItem('chat_guest_user', JSON.stringify(userData));
          localStorage.setItem('chat_guest_contact_id', userData.id.toString());

          setRegisteredUser(userData);
          setGuestContactId(userData.id);

          // Start live chat directly since user clicked "Chat with Live Support"
          setIsRegistering(false);
          startGuestChat();
          return;
        }
      } else {
        console.error('Registration failed');
      }
    } catch (error) {
      console.error('Failed to register:', error);
    } finally {
      setIsRegistering(false);
    }
  };

  // Send message to Gemini AI
  const sendAiMessage = async () => {
    if (!aiInputMessage.trim() || isAiLoading) return;

    const userMessage: AiMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: aiInputMessage.trim(),
      timestamp: new Date(),
    };

    setAiMessages(prev => [...prev, userMessage]);
    setAiInputMessage('');
    setIsAiLoading(true);

    // Determine contact_id based on login status
    const contactId = isLoggedIn ? auth?.user?.id : (registeredUser?.id || guestContactId);

    // Prepare history for guest users
    const history = aiMessages
      .filter(msg => !msg.id.startsWith('error-') && msg.id !== 'welcome')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    try {
      const response = await fetch('/chat/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          message: userMessage.content,
          locale: language,
          conversation_id: aiConversationId,
          contact_id: contactId,
          history: history, // Send history for guest users
        }),
      });

      const data = await response.json();

      // Save the conversation ID for follow-up questions
      if (data.conversation_id) {
        setAiConversationId(data.conversation_id);
      }

      const assistantMessage: AiMessage = {
        id: data.ai_message_id ? `assistant-${data.ai_message_id}` : `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.success ? data.message : t('chatWidget.aiErrorMessage'),
        timestamp: new Date(),
      };

      setAiMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: AiMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: t('chatWidget.aiErrorMessage'),
        timestamp: new Date(),
      };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle AI chat key press
  const handleAiKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAiMessage();
    }
  };

  // Refresh conversation messages
  const refreshMessages = async () => {
    if (!conversation) return;

    try {
      let response;
      if (isLoggedIn && auth?.user) {
        response = await fetch('/chat/contact/conversation');
      } else if (guestContactId) {
        response = await fetch(`/chat/guest/conversation?contact_id=${guestContactId}`);
      } else {
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data) {
          setConversation(data);
        }
      }
    } catch (error) {
      // Silent fail
    }
  };

  // Listen for real-time chat message updates via Pusher
  useChatMessageListener(conversation?.id || null, (newMessage) => {
    // Add the new message to the conversation (only if not already present)
    if (newMessage && conversation) {
      setConversation(prev => {
        if (!prev) return null;
        const exists = prev.messages?.some(msg => msg.id === newMessage.id);
        if (exists) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), newMessage as Message],
        };
      });
    }
  });

  // Poll for new messages as fallback when chat is open (less frequent since we have Pusher)
  useEffect(() => {
    if (isOpen && conversation && !isMinimized) {
      const interval = setInterval(refreshMessages, 15000);
      return () => clearInterval(interval);
    }
  }, [isOpen, conversation, isMinimized]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);

    // Reset AI history loaded flag to allow reloading
    setHasLoadedAiHistory(false);

    // Determine initial step based on login status
    if (isLoggedIn && isContact) {
      setCurrentStep('chat');
      if (!conversation && !hasCheckedConversation) {
        checkExistingConversation();
      }
    } else if (!isLoggedIn) {
      // For guests, default to AI chat
      // If they have a conversation already, they can access it from AI chat
      if (currentStep !== 'register') {
        setCurrentStep('ai-chat');
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = [...attachments, ...Array.from(files)].slice(0, 3);
      setAttachments(newFiles);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    setAttachments(updated);
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !conversation) return;

    // Determine contact_id based on login status
    const contactId = isLoggedIn ? auth?.user?.id : guestContactId;
    if (!contactId) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('conversation_id', conversation.id.toString());
      formData.append('contact_id', contactId.toString());
      formData.append('message', newMessage);

      attachments.forEach((file) => {
        formData.append('files[]', file);
      });

      const response = await fetch('/chat/sendMessage', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        const newMsg = await response.json();
        // Add to conversation with deduplication check
        setConversation(prev => {
          if (!prev) return null;
          const exists = prev.messages?.some(msg => msg.id === newMsg.id);
          if (exists) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), newMsg],
          };
        });
        setNewMessage('');
        setAttachments([]);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageSenderName = (message: Message) => {
    if (message.user) return message.user.name;
    if (message.contact) return `${message.contact.first_name} ${message.contact.last_name}`;
    return 'Unknown';
  };

  const getMessageSenderProfilePicture = (message: Message): string | null | undefined => {
    if (message.user) return message.user.profile_picture_url;
    if (message.contact) return message.contact.profile_picture_url;
    return null;
  };

  const isStaffMessage = (message: Message) => {
    return message.user_id !== null;
  };

  // Render Registration Form (shown when user clicks "Chat with Live Support")
  const renderRegistrationForm = () => (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="text-center mb-6">
        <div className="size-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="size-8 text-primary" />
        </div>
        <h4 className="font-semibold text-default-900 mb-2">{t('chatWidget.connectWithSupport')}</h4>
        <p className="text-sm text-default-500">{t('chatWidget.provideDetailsToStart')}</p>
      </div>

      <form onSubmit={handleRegisterSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-default-700 mb-1">
            {t('chatWidget.fullName')} <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg border ${formErrors.name ? 'border-danger' : 'border-default-200'
              } bg-default-50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20`}
            placeholder={t('chatWidget.enterFullName')}
          />
          {formErrors.name && (
            <p className="text-xs text-danger mt-1">{formErrors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-default-700 mb-1">
            {t('chatWidget.emailAddress')} <span className="text-danger">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg border ${formErrors.email ? 'border-danger' : 'border-default-200'
              } bg-default-50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20`}
            placeholder={t('chatWidget.enterEmail')}
          />
          {formErrors.email && (
            <p className="text-xs text-danger mt-1">{formErrors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-default-700 mb-1">
            {t('chatWidget.memberNumber')}
          </label>
          <input
            type="text"
            value={formData.member_number}
            onChange={(e) => setFormData({ ...formData, member_number: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-default-200 bg-default-50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            placeholder={t('chatWidget.enterMemberNumber')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-default-700 mb-1">
            {t('chatWidget.region')} <span className="text-danger">*</span>
          </label>
          <select
            value={formData.region_id}
            onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg border ${formErrors.region_id ? 'border-danger' : 'border-default-200'
              } bg-default-50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20`}
          >
            <option value="">{t('chatWidget.selectRegion')}</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          {formErrors.region_id && (
            <p className="text-xs text-danger mt-1">{formErrors.region_id}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isRegistering}
          className="w-full btn bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isRegistering ? (
            <>
              <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('chatWidget.registering')}
            </>
          ) : (
            <>
              <MessageCircle className="size-4" />
              {t('chatWidget.chatWithLiveSupport')}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep('ai-chat')}
          className="w-full text-center text-default-500 text-sm hover:text-default-700 flex items-center justify-center gap-1 mt-3"
        >
          <ArrowLeft className="size-3" />
          {t('chatWidget.backToAiChat')}
        </button>
      </form>
    </div>
  );

  // Render AI Chat Section
  const renderAiChatSection = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* AI Chat Header Banner */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-default-200">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="size-4 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-default-900">{t('chatWidget.aiAssistantTitle')}</h4>
            <p className="text-xs text-default-500">{t('chatWidget.aiAssistantSubtitle')}</p>
          </div>
        </div>
      </div>

      {/* AI Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-default-50">
        {aiMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${message.role === 'assistant' ? 'order-1' : ''}`}>
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="size-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Bot className="size-3 text-white" />
                  </div>
                  <span className="text-xs text-default-500 font-medium">{t('chatWidget.aiAssistant')}</span>
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-2.5 ${message.role === 'assistant'
                  ? 'bg-card border border-default-200 text-default-800 rounded-tl-md'
                  : 'bg-primary text-white rounded-tr-md'
                  }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
              <p className={`text-[10px] text-default-400 mt-1 ${message.role === 'assistant' ? 'text-left' : 'text-right'}`}>
                {formatMessageTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {/* AI Loading indicator */}
        {isAiLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%]">
              <div className="flex items-center gap-2 mb-1">
                <div className="size-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Bot className="size-3 text-white" />
                </div>
                <span className="text-xs text-default-500 font-medium">{t('chatWidget.aiAssistant')}</span>
              </div>
              <div className="rounded-2xl px-4 py-3 bg-card border border-default-200 rounded-tl-md">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="size-2 bg-default-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="size-2 bg-default-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="size-2 bg-default-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-xs text-default-500">{t('chatWidget.aiTyping')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={aiMessagesEndRef} />
      </div>

      {/* AI Chat Input */}
      <div className="p-4 border-t border-default-200 bg-card">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={aiInputMessage}
              onChange={(e) => setAiInputMessage(e.target.value)}
              onKeyPress={handleAiKeyPress}
              placeholder={t('chatWidget.askAiPlaceholder')}
              className="w-full px-4 py-2.5 pr-12 rounded-xl border border-default-200 bg-default-50 text-sm resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              rows={1}
              style={{ minHeight: '42px', maxHeight: '100px' }}
              disabled={isAiLoading}
            />
          </div>
          <button
            onClick={sendAiMessage}
            disabled={isAiLoading || !aiInputMessage.trim()}
            className="flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={t('chatWidget.sendMessage')}
          >
            {isAiLoading ? (
              <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
          </button>
        </div>

        {/* Live Support Button */}
        <div className="mt-3 pt-3 border-t border-default-200">
          <button
            onClick={() => {
              // If user is registered, start live chat directly
              // Otherwise, show registration form first
              if (registeredUser) {
                startGuestChat();
              } else {
                loadRegions();
                setCurrentStep('register');
              }
            }}
            disabled={isStarting}
            className="w-full btn bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isStarting ? (
              <>
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('chatWidget.connecting')}
              </>
            ) : (
              <>
                <MessageCircle className="size-4" />
                {t('chatWidget.chatWithLiveSupport')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Render Chat Section
  const renderChatSection = () => (
    <>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-default-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-default-500">{t('chatWidget.loading')}</p>
            </div>
          </div>
        ) : conversation ? (
          <>
            {conversation.messages && conversation.messages.length > 0 ? (
              conversation.messages.map((message) => {
                const isStaff = isStaffMessage(message);
                const senderName = getMessageSenderName(message);
                const senderProfilePicture = getMessageSenderProfilePicture(message);

                return (
                  <div
                    key={message.id}
                    className={`flex ${isStaff ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[85%] ${isStaff ? 'order-1' : ''}`}>
                      {isStaff && (
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar name={senderName} profilePicture={senderProfilePicture} className="size-6 text-[10px]" />
                          <span className="text-xs text-default-500 font-medium">{senderName}</span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${isStaff
                          ? 'bg-card border border-default-200 text-default-800 rounded-tl-md'
                          : 'bg-primary text-white rounded-tr-md'
                          }`}
                      >
                        <div
                          className="text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: message.message }}
                        />
                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={attachment.url || attachment.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 text-xs ${isStaff ? 'text-primary' : 'text-white/90'} hover:underline`}
                              >
                                <FileText className="size-3" />
                                {attachment.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className={`text-[10px] text-default-400 mt-1 ${isStaff ? 'text-left' : 'text-right'}`}>
                        {formatMessageTime(message.updated_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center px-6">
                  <p className="text-sm text-default-500 font-medium">{t('chatWidget.noMessagesYet')}</p>
                  <p className="text-xs text-default-400 mt-2">{t('chatWidget.typeMessageBelow')}</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-6">
              <div className="size-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="size-8 text-primary" />
              </div>
              <h4 className="font-semibold text-default-900 mb-2">{t('chatWidget.welcomeToSupport')}</h4>
              <p className="text-sm text-default-500 mb-5">{t('chatWidget.typeMessageBelow')}</p>
              <button
                onClick={isLoggedIn ? startNewChat : () => setCurrentStep('register')}
                disabled={isStarting}
                className="btn bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 mx-auto"
              >
                {isStarting ? (
                  <>
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('chatWidget.starting')}
                  </>
                ) : (
                  <>
                    <MessageCircle className="size-4" />
                    {t('chatWidget.startChat')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-default-200 bg-default-50">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-2 py-1 bg-default-100 rounded-lg text-xs"
              >
                <FileText className="size-3 text-default-500" />
                <span className="truncate max-w-[100px]">{file.name}</span>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="text-default-400 hover:text-danger"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area - Only show when conversation exists */}
      {conversation && (
        <div className="p-4 border-t border-default-200 bg-card">
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 p-2 rounded-lg text-default-400 hover:text-default-600 hover:bg-default-100 transition-colors"
              aria-label={t('chatWidget.attachFile')}
            >
              <Paperclip className="size-5" />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('chatWidget.typeMessage')}
                className="w-full px-4 py-2.5 pr-12 rounded-xl border border-default-200 bg-default-50 text-sm resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                rows={1}
                style={{ minHeight: '42px', maxHeight: '100px' }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={isSending || (!newMessage.trim() && attachments.length === 0)}
              className="flex-shrink-0 p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={t('chatWidget.sendMessage')}
            >
              {isSending ? (
                <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="size-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );

  // Determine what content to render based on step
  const renderContent = () => {
    if (isLoggedIn && isContact) {
      return renderChatSection();
    }

    switch (currentStep) {
      case 'register':
        return renderRegistrationForm();
      case 'ai-chat':
        return renderAiChatSection();
      case 'chat':
        return renderChatSection();
      default:
        return renderRegistrationForm();
    }
  };

  // Get step title for header
  const getStepTitle = () => {
    if (isLoggedIn && isContact) {
      return t('chatWidget.supportChat');
    }

    switch (currentStep) {
      case 'register':
        return t('chatWidget.getStarted');
      case 'ai-chat':
        return t('chatWidget.aiAssistantTitle');
      case 'chat':
        return t('chatWidget.supportChat');
      default:
        return t('chatWidget.supportChat');
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 size-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group"
          aria-label={t('chatWidget.openChat')}
        >
          <MessageCircle className="size-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 size-4 bg-success rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Minimized Chat Bar */}
      {isOpen && isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-full bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
        >
          <MessageCircle className="size-5" />
          <span className="font-medium text-sm">{t('chatWidget.chatWithUs')}</span>
          <X
            className="size-4 opacity-70 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
          />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:top-auto sm:left-auto z-50 w-full h-full sm:w-[380px] sm:h-[520px] bg-card rounded-none sm:rounded-2xl shadow-2xl border border-default-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/90 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-white/20 flex items-center justify-center">
                {currentStep === 'ai-chat' ? (
                  <Sparkles className="size-5" />
                ) : (
                  <MessageCircle className="size-5" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{getStepTitle()}</h3>
                <p className="text-xs text-white/80">{t('chatWidget.weReplyInMinutes')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleMinimize}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label={t('chatWidget.minimizeChat')}
              >
                <Minimize2 className="size-4" />
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label={t('chatWidget.closeChat')}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {renderContent()}
        </div>
      )}
    </>
  );
}
