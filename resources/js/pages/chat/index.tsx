import { Link, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  MessageSquare,
  Paperclip,
  Send,
  Copy,
  Trash2,
  Clock
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageMeta from '@/components/PageMeta';
import Breadcrumb from '@/components/BreadCrumb';
import Combobox, { SelectOption } from '@/components/Combobox';
import TextEditor from '@/components/TextEditor';

type Creator = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
};

type User = {
  id: number;
  name: string;
  email: string;
};

type Contact = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
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

type Participant = {
  id: number;
  user_id: number | null;
  contact_id: number | null;
  conversation_id: number;
  creator?: Contact;
  user?: User;
};

type Conversation = {
  id: number;
  slug?: string;
  title: string;
  contact_id: number;
  created_at: string;
  updated_at: string;
  creator?: Creator;
  messages?: Message[];
  participant?: Participant;
};

type ConversationListItem = {
  id: number;
  slug: string;
  total_entry: number;
  title: string;
  creator?: Creator;
  created_at: string;
  updated_at: string;
};

type ConversationPaginator = {
  data: ConversationListItem[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
  next_page_url: string | null;
};

type ChatPageProps = {
  title: string;
  chat: Conversation | null;
  conversations: ConversationPaginator;
  filters: {
    search?: string;
  };
};

// Platform icons component
const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform.toLowerCase()) {
    case 'whatsapp':
      return (
        <div className="size-5 rounded-full bg-success flex items-center justify-center">
          <MessageSquare className="size-3 text-white" />
        </div>
      );
    case 'facebook':
      return (
        <div className="size-5 rounded-full bg-info flex items-center justify-center">
          <MessageSquare className="size-3 text-white" />
        </div>
      );
    case 'sms':
      return (
        <div className="size-5 rounded-full bg-warning flex items-center justify-center">
          <MessageSquare className="size-3 text-white" />
        </div>
      );
    default:
      return (
        <div className="size-5 rounded-full bg-success flex items-center justify-center">
          <MessageSquare className="size-3 text-white" />
        </div>
      );
  }
};

// Avatar component with initials
const Avatar = ({ name, className = '' }: { name: string; className?: string }) => {
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
      'bg-danger',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`size-10 rounded-full ${getColorClass(name)} flex items-center justify-center text-white font-semibold text-sm ${className}`}>
      {getInitials(name)}
    </div>
  );
};

// Format relative time
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(diff / 2592000000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} Minutes Ago`;
  if (hours < 24) return `${hours} Hours Ago`;
  if (days < 30) return `${days} Days Ago`;
  return `${months} Months Ago`;
};

// Format message time
const formatMessageTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  }).toLowerCase();
  
  if (isToday) {
    return `Today ${timeStr}`;
  }
  
  const dayStr = date.toLocaleDateString('en-US', { weekday: 'long' });
  return `${dayStr} ${timeStr}`;
};

// Filter options
const ticketFilterOptions: SelectOption[] = [
  { label: 'All Tickets', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Closed', value: 'closed' },
];

// Status options
const statusOptions: SelectOption[] = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
];

export default function Index({ title, chat, conversations, filters }: ChatPageProps) {
  const [searchValue, setSearchValue] = useState(filters?.search || '');
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<SelectOption | null>(ticketFilterOptions[0]);
  const [selectedStatus, setSelectedStatus] = useState<SelectOption | null>(
    statusOptions.find(s => s.value === 'in_progress') || null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const safeConversations: ConversationPaginator = {
    data: conversations?.data ?? [],
    current_page: conversations?.current_page ?? 1,
    per_page: conversations?.per_page ?? 10,
    total: conversations?.total ?? 0,
    last_page: conversations?.last_page ?? 1,
    from: conversations?.from ?? 0,
    to: conversations?.to ?? 0,
    next_page_url: conversations?.next_page_url ?? null,
  };

  // Scroll to bottom when chat changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat?.messages]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/chat', { search: searchValue }, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
    });
  };

  const handleLoadMore = () => {
    if (safeConversations.next_page_url) {
      router.get(safeConversations.next_page_url, {}, {
        preserveScroll: true,
        preserveState: true,
      });
    }
  };

  const handleReplyChange = (content: string) => {
    setReplyContent(content);
  };

  const handleSendMessage = () => {
    if (!replyContent.trim() || !chat) return;
    
    router.post('/chat/message', {
      conversation_id: chat.id,
      message: replyContent,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setReplyContent('');
      },
    });
  };

  const getCreatorName = (creator?: Creator) => {
    if (!creator) return 'Unknown';
    return `${creator.first_name} ${creator.last_name}`;
  };

  const getMessageSenderName = (message: Message) => {
    if (message.user) return message.user.name;
    if (message.contact) return `${message.contact.first_name} ${message.contact.last_name}`;
    return 'Unknown';
  };

  const isAgentMessage = (message: Message) => {
    return message.user_id !== null;
  };

  return (
    <AppLayout>
      <PageMeta title={title || 'Chat'} />
      <main className="h-[calc(100vh-130px)]">
        <div className="flex h-full gap-0">
          {/* Left Sidebar - Conversation List */}
          <div className="w-[340px] flex flex-col bg-card border-r border-default-200 shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-default-200">
              <h1 className="text-xl font-semibold text-default-900 mb-1">Manage Conversations</h1>
              <Breadcrumb 
                items={[
                  { label: 'Home', href: '/dashboard' },
                  { label: 'Conversations' }
                ]}
              />
            </div>

            {/* Filter & Search */}
            <div className="p-4 border-b border-default-200 space-y-3">
              <Combobox
                options={ticketFilterOptions}
                value={ticketFilter}
                onChange={(option) => setTicketFilter(option)}
                placeholder="Filter tickets"
                isSearchable={false}
              />
              
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search conversations..."
                  className="form-input pr-10"
                />
                <button 
                  type="submit" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-default-400 hover:text-default-600"
                >
                  <Search className="size-4" />
                </button>
              </form>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {safeConversations.data.length === 0 ? (
                <div className="p-4 text-center text-default-500">
                  No conversations found
                </div>
              ) : (
                <div className="divide-y divide-default-100">
                  {safeConversations.data.map((conversation) => {
                    const isActive = chat?.id === conversation.id;
                    const creatorName = getCreatorName(conversation.creator);
                    
                    return (
                      <Link
                        key={conversation.id}
                        href={`/chat/${conversation.id}`}
                        className={`flex items-start gap-3 p-4 hover:bg-default-50 transition-colors cursor-pointer ${
                          isActive ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                        }`}
                      >
                        <Avatar name={creatorName} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-default-900 truncate text-sm">
                              {creatorName}
                            </h3>
                            <span className="text-xs text-default-500 whitespace-nowrap">
                              {formatRelativeTime(conversation.updated_at)}
                            </span>
                          </div>
                          <p className="text-sm text-default-600 truncate">
                            {conversation.title}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <PlatformIcon platform="whatsapp" />
                          {conversation.total_entry > 0 && (
                            <span className="size-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">
                              {conversation.total_entry}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Load More */}
            {safeConversations.next_page_url && (
              <div className="p-4 border-t border-default-200">
                <button
                  onClick={handleLoadMore}
                  className="w-full text-center text-primary font-medium text-sm hover:underline"
                >
                  Load More Conversations
                </button>
              </div>
            )}
          </div>

          {/* Right Panel - Chat View */}
          <div className="flex-1 flex flex-col bg-default-50">
            {chat ? (
              <>
                {/* Chat Header */}
                <div className="bg-card border-b border-default-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-lg font-semibold text-default-900">
                          {getCreatorName(chat.creator)}
                        </h2>
                        <span className="px-2 py-0.5 rounded bg-primary text-white text-xs font-medium">
                          {chat.id}
                        </span>
                      </div>
                      <p className="text-sm text-default-600">
                        {chat.title || 'No subject'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-40">
                        <Combobox
                          options={statusOptions}
                          value={selectedStatus}
                          onChange={(option) => setSelectedStatus(option)}
                          placeholder="Select status"
                          isSearchable={false}
                          inputClassName="form-input bg-danger/10 text-danger border-danger/20 text-sm py-1.5"
                        />
                      </div>
                      <button 
                        type="button"
                        className="btn btn-sm border border-default-200 bg-transparent text-default-600 hover:bg-default-100"
                      >
                        <Copy className="size-4" />
                      </button>
                      <button 
                        type="button"
                        className="btn btn-sm border border-default-200 bg-transparent text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="size-4" />
                      </button>
                      <button 
                        type="button"
                        className="btn btn-sm border border-default-200 bg-transparent text-default-600 hover:bg-default-100"
                      >
                        <Clock className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chat.messages?.map((message) => {
                    const isAgent = isAgentMessage(message);
                    const senderName = getMessageSenderName(message);
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isAgent ? 'order-1' : ''}`}>
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              isAgent
                                ? 'bg-success/20 text-default-800 rounded-br-md'
                                : 'bg-card border border-default-200 text-default-800 rounded-bl-md'
                            }`}
                          >
                            <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: message.message }} />
                          </div>
                          <div className={`flex items-center gap-2 mt-1 ${isAgent ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs text-default-500">
                              {formatMessageTime(message.updated_at)}
                            </span>
                            {isAgent && (
                              <Avatar name={senderName} className="size-6 text-xs" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Area */}
                <div className="bg-card border-t border-default-200 p-4">
                  <div className="mb-3">
                    <label className="block font-medium text-default-900 text-sm">Reply</label>
                  </div>
                  
                  {/* Text Editor */}
                  <input type="hidden" name="message" value={replyContent} />
                  <TextEditor
                    placeholder="Type your message..."
                    onChange={handleReplyChange}
                    showToolbar={true}
                    className="min-h-[120px]"
                  />

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-sm border border-default-200 bg-transparent text-default-600 hover:bg-default-100"
                      >
                        <Paperclip className="size-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!replyContent.trim()}
                      className="btn bg-success text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="size-4 me-2" />
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="size-20 rounded-full bg-default-100 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="size-10 text-default-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-default-900 mb-2">
                    Select a Conversation
                  </h3>
                  <p className="text-default-600 text-sm">
                    Choose a conversation from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
