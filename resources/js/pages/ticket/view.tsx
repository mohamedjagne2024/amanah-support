import { Link, router, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Mail,
  Clock,
  Eye,
  Edit3,
  Tag,
  Ticket,
  Download,
  User,
  Building,
  MapPin,
  FolderOpen,
  MessageSquare,
  Paperclip,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  Star,
  X
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageMeta from '@/components/PageMeta';
import Breadcrumb from '@/components/Breadcrumb';
import { useChatMessageListener } from '@/hooks/usePusher';
import { useLanguageContext } from '@/context/useLanguageContext';

type AttachmentType = {
  id: number;
  name: string;
  size: number;
  path: string;
  url: string;
  user?: {
    id: number;
    name: string;
  };
};

type ReplyType = {
  id: number;
  details: string;
  created_at: string;
  attachments?: AttachmentType[];
  user?: {
    id: number;
    name: string;
    profile_picture_url?: string | null;
  };
  contact?: {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    profile_picture_url?: string | null;
  };
};

type ActivityType = {
  id: number;
  action: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
};

type ReviewType = {
  id: number;
  rating: number;
  feedback: string;
  created_at: string;
};

type TicketData = {
  id: number;
  uid: string;
  contact_id: number | null;
  contact: {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    email: string;
    phone?: string;
    organization?: {
      id: number;
      name: string;
    };
  } | null;
  priority: string;
  created_at: string;
  updated_at: string;
  priority_label: string;
  status: string;
  status_label: string;
  closed: boolean;
  closed_at: string | null;
  review: ReviewType | null;
  region_id: number | null;
  region: string;
  category_id: number | null;
  category: string;
  assigned_to: number | null;
  assigned_user: string;
  type_id: number | null;
  type: string;
  ticket_id: number | null;
  subject: string;
  details: string;
  due: string | null;
  source: string;
  tags: string;
};

type ViewTicketPageProps = {
  title: string;
  ticket: TicketData;
  attachments: AttachmentType[];
  replies: ReplyType[];
  activities: ActivityType[];
  auth: {
    user: {
      id: number;
      name: string;
    };
  };
};

export default function View({
  title,
  ticket,
  attachments,
  replies: initialReplies,
  activities,
  auth,
}: ViewTicketPageProps) {
  const { t } = useLanguageContext();
  const [replyContent, setReplyContent] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [replies, setReplies] = useState<ReplyType[]>(initialReplies || []);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync replies when initialReplies changes
  useEffect(() => {
    setReplies(initialReplies || []);
  }, [initialReplies]);

  // Scroll to bottom when replies change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies]);

  // Listen for real-time reply updates via Pusher
  useChatMessageListener(ticket?.id || null, (newReply) => {
    setReplies(prev => {
      const exists = prev.some(reply => reply.id === newReply.id);
      if (exists) return prev;
      return [...prev, newReply as unknown as ReplyType];
    });
  });

  const parsedTags = ticket.tags ? ticket.tags.split(',').map(t => t.trim()).filter(t => t) : [];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPriorityBadgeClass = (priority: string) => {
    const p = priority.toLowerCase();
    if (p.includes('critical') || p.includes('urgent')) return 'bg-danger text-white';
    if (p.includes('high')) return 'bg-warning text-white';
    if (p.includes('medium')) return 'bg-info text-white';
    if (p.includes('low')) return 'bg-success text-white';
    return 'bg-default-200 text-default-700';
  };

  const getStatusBadgeClass = (status: string | null) => {
    if (!status) return 'bg-default-200 text-default-700';
    const s = status.toLowerCase();
    if (s.includes('closed') || s.includes('resolved')) return 'bg-danger text-white';
    if (s.includes('open') || s.includes('new')) return 'bg-info text-white';
    if (s.includes('pending')) return 'bg-warning text-white';
    if (s.includes('progress')) return 'bg-primary text-white';
    return 'bg-default-200 text-default-700';
  };

  const getContactDisplayName = () => {
    if (!ticket.contact) return t('ticket.unassigned');
    if (ticket.contact.name) return ticket.contact.name;
    if (ticket.contact.first_name || ticket.contact.last_name) {
      return `${ticket.contact.first_name || ''} ${ticket.contact.last_name || ''}`.trim();
    }
    return ticket.contact.email;
  };

  const getReplyUserName = (reply: ReplyType) => {
    if (reply.user) return reply.user.name;
    if (reply.contact) {
      if (reply.contact.name) return reply.contact.name;
      if (reply.contact.first_name || reply.contact.last_name) {
        return `${reply.contact.first_name || ''} ${reply.contact.last_name || ''}`.trim();
      }
    }
    return 'Unknown';
  };

  const getReplyUserProfilePicture = (reply: ReplyType): string | null | undefined => {
    if (reply.user) return reply.user.profile_picture_url;
    if (reply.contact) return reply.contact.profile_picture_url;
    return null;
  };

  const isAgentReply = (reply: ReplyType) => {
    return reply.user !== undefined && reply.user !== null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = [...replyAttachments, ...Array.from(files)].slice(0, 5);
      setReplyAttachments(newFiles);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index: number) => {
    const updated = replyAttachments.filter((_, i) => i !== index);
    setReplyAttachments(updated);
  };

  const handleSendReply = async () => {
    if ((!replyContent.trim() && replyAttachments.length === 0) || isSending) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('ticket_id', ticket.id.toString());
      formData.append('details', replyContent);

      replyAttachments.forEach((file) => {
        formData.append('files[]', file);
      });

      const response = await fetch(`/tickets/${ticket.uid}/reply`, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: formData,
      });

      if (response.ok) {
        const newReply = await response.json();
        setReplies(prev => {
          const exists = prev.some(reply => reply.id === newReply.id);
          if (exists) return prev;
          return [...prev, newReply];
        });
        setReplyContent('');
        setReplyAttachments([]);
      } else {
        console.error('Failed to send reply:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!resolutionDetails.trim() || resolutionDetails.trim().length < 10) return;

    setIsResolving(true);
    try {
      router.post(`/tickets/${ticket.uid}/resolve`, {
        resolution_details: resolutionDetails,
      }, {
        onSuccess: () => {
          setShowResolveModal(false);
          setResolutionDetails('');
        },
        onFinish: () => {
          setIsResolving(false);
        }
      });
    } catch (error) {
      console.error('Failed to resolve ticket:', error);
      setIsResolving(false);
    }
  };

  // Avatar component
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
        'bg-danger',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
      ];
      const index = name.charCodeAt(0) % colors.length;
      return colors[index];
    };

    if (profilePicture) {
      return (
        <img
          src={profilePicture}
          alt={name}
          className={`size-10 rounded-full object-cover ${className}`}
        />
      );
    }

    return (
      <div className={`size-10 rounded-full ${getColorClass(name)} flex items-center justify-center text-white font-semibold text-sm ${className}`}>
        {getInitials(name)}
      </div>
    );
  };

  return (
    <AppLayout>
      <PageMeta title={`${t('ticket.viewTicket')} #${ticket.uid}`} />
      <main className="pb-8">

        <Breadcrumb
          items={[
            { label: t('menus.tickets'), href: '/tickets' },
            { label: `#${ticket.uid}` }
          ]}
          className="mb-4"
        />

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Ticket className="size-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-default-900">
                  #{ticket.uid}
                </h1>
                {ticket.closed && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success flex items-center gap-1">
                    <CheckCircle className="size-3" />
                    {t('ticket.ticketResolved')}
                  </span>
                )}
              </div>
              <p className="text-default-600 text-sm mt-1 line-clamp-2">{ticket.subject}</p>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-default-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-4" />
                  <span>{t('ticket.created')} {ticket.created_at}</span>
                </div>
                {ticket.due && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    <span>{t('ticket.due')} {ticket.due}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Mail className="size-4" />
                  <span>{ticket.source}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  <span>{t('ticket.lastUpdated')} {ticket.updated_at}</span>
                </div>
              </div>

              {/* Status Badges Row */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(ticket.status_label)}`}>
                  {ticket.status_label}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadgeClass(ticket.priority_label)}`}>
                  {ticket.priority_label}
                </span>
                {parsedTags.length > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-default-200 text-default-700 flex items-center gap-1">
                    <Tag className="size-3" />
                    {parsedTags.length} {t('ticket.tags')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {!ticket.closed && (
              <button
                type="button"
                onClick={() => setShowResolveModal(true)}
                className="btn btn-sm bg-success text-white hover:bg-success/90"
              >
                <CheckCircle className="size-4 me-1" />
                {t('ticket.resolveTicket')}
              </button>
            )}
            <Link href={`/tickets/${ticket.uid}/edit`}>
              <button type="button" className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/10">
                <Edit3 className="size-4 me-1" />
                {t('common.edit')}
              </button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="card">
              <div className="card-header">
                <h6 className="card-title">{t('ticket.description')}</h6>
              </div>
              <div className="card-body">
                <div
                  className="prose prose-sm max-w-none text-default-700 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-default-300 [&_blockquote]:pl-4 [&_blockquote]:italic"
                  dangerouslySetInnerHTML={{ __html: ticket.details || `<p class="text-default-400 italic">${t('ticket.noDescription')}</p>` }}
                />
              </div>
            </div>

            {/* Replies/Discussion Card */}
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h6 className="card-title flex items-center gap-2">
                  <MessageSquare className="size-4" />
                  {t('ticket.reply')} ({replies.length})
                </h6>
              </div>
              <div className="card-body">
                {/* Replies List */}
                {replies.length > 0 ? (
                  <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto">
                    {replies.map((reply) => {
                      const isAgent = isAgentReply(reply);
                      const userName = getReplyUserName(reply);
                      const userProfilePicture = getReplyUserProfilePicture(reply);

                      return (
                        <div
                          key={reply.id}
                          className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] ${isAgent ? 'order-1' : ''}`}>
                            <div className={`flex items-start gap-3 ${isAgent ? 'flex-row-reverse' : ''}`}>
                              <Avatar
                                name={userName}
                                profilePicture={userProfilePicture}
                                className="size-8 shrink-0"
                              />
                              <div className="flex-1">
                                <div className={`flex items-center gap-2 mb-1 ${isAgent ? 'justify-end' : ''}`}>
                                  <span className="font-medium text-default-900 text-sm">
                                    {userName}
                                  </span>
                                  <span className="text-xs text-default-500">
                                    {reply.created_at}
                                  </span>
                                </div>
                                <div
                                  className={`rounded-2xl px-4 py-3 ${isAgent
                                      ? 'bg-primary text-white rounded-tr-md'
                                      : 'bg-default-100 text-default-800 rounded-tl-md'
                                    }`}
                                >
                                  <div
                                    className="text-sm [&_p]:mb-0"
                                    dangerouslySetInnerHTML={{ __html: reply.details }}
                                  />

                                  {/* Reply Attachments */}
                                  {reply.attachments && reply.attachments.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                      {reply.attachments.map((attachment) => (
                                        <a
                                          key={attachment.id}
                                          href={attachment.url || attachment.path}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isAgent
                                              ? 'bg-white/10 hover:bg-white/20 text-white'
                                              : 'bg-white hover:bg-default-50 text-primary border border-default-200'
                                            } transition-colors`}
                                        >
                                          <FileText className="size-4" />
                                          <span className="flex-1 truncate">{attachment.name}</span>
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="text-center py-8 text-default-400">
                    <MessageSquare className="size-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">
                      {ticket.closed ? t('ticket.noRepliesClosed') : t('ticket.noRepliesYet')}
                    </p>
                    {!ticket.closed && (
                      <p className="text-xs mt-1">{t('ticket.noRepliesDescription')}</p>
                    )}
                  </div>
                )}

                {/* Reply Input - Only show if ticket is not closed */}
                {!ticket.closed && (
                  <div className="border-t border-default-200 pt-4">
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      {t('ticket.newReply')}
                    </label>

                    {/* Selected Attachments Preview */}
                    {replyAttachments.length > 0 && (
                      <div className="mb-3 p-3 border border-default-200 rounded-lg bg-default-50">
                        <div className="flex flex-wrap gap-2">
                          {replyAttachments.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 px-3 py-2 bg-white border border-default-200 rounded-lg text-sm"
                            >
                              <FileText className="size-4 text-default-500" />
                              <span className="truncate max-w-[200px]">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="text-default-400 hover:text-danger transition-colors"
                              >
                                <X className="size-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={t('ticket.writeMessage')}
                        className="form-input w-full min-h-[100px] resize-none pr-12"
                        rows={3}
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute right-3 top-3 p-2 rounded-lg text-default-400 hover:text-default-600 hover:bg-default-100 transition-colors"
                        title={t('ticket.attachFiles')}
                      >
                        <Paperclip className="size-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-end mt-3">
                      <button
                        type="button"
                        onClick={handleSendReply}
                        disabled={(!replyContent.trim() && replyAttachments.length === 0) || isSending}
                        className="btn bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSending ? (
                          <>
                            <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin me-2" />
                            {t('chat.sending')}
                          </>
                        ) : (
                          <>
                            <Send className="size-4 me-2" />
                            {t('ticket.sendMessage')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Review Card - Only show if ticket is closed and has review */}
            {ticket.closed && ticket.review && (
              <div className="card border-success/30 bg-success/5">
                <div className="card-header">
                  <h6 className="card-title flex items-center gap-2 text-success">
                    <Star className="size-4" />
                    {t('ticket.customerReview')}
                  </h6>
                </div>
                <div className="card-body">
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`size-5 ${star <= ticket.review!.rating ? 'text-warning fill-warning' : 'text-default-300'}`}
                      />
                    ))}
                    <span className="ms-2 text-sm text-default-600">
                      ({ticket.review.rating}/5)
                    </span>
                  </div>
                  {ticket.review.feedback && (
                    <p className="text-sm text-default-700">{ticket.review.feedback}</p>
                  )}
                  <p className="text-xs text-default-500 mt-2">{ticket.review.created_at}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Properties Card */}
            <div className="card">
              <div className="card-header">
                <h6 className="card-title">{t('ticket.details')}</h6>
              </div>
              <div className="card-body space-y-4">
                {/* Contact */}
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-default-500 mb-0.5">{t('ticket.contact')}</p>
                    <p className="text-sm font-medium text-default-900">{getContactDisplayName()}</p>
                    {ticket.contact?.email && (
                      <p className="text-xs text-default-500">{ticket.contact.email}</p>
                    )}
                  </div>
                </div>

                {/* Organization */}
                {ticket.contact?.organization && (
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                      <Building className="size-4 text-info" />
                    </div>
                    <div>
                      <p className="text-xs text-default-500 mb-0.5">{t('menus.organizations')}</p>
                      <p className="text-sm font-medium text-default-900">{ticket.contact.organization.name}</p>
                    </div>
                  </div>
                )}

                {/* Assigned To */}
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                    <User className="size-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-default-500 mb-0.5">{t('ticket.assignedTo')}</p>
                    <p className="text-sm font-medium text-default-900">
                      {ticket.assigned_user || t('ticket.unassigned')}
                    </p>
                  </div>
                </div>

                {/* Region */}
                {ticket.region && (
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                      <MapPin className="size-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-xs text-default-500 mb-0.5">{t('ticket.region')}</p>
                      <p className="text-sm font-medium text-default-900">{ticket.region}</p>
                    </div>
                  </div>
                )}

                {/* Category */}
                {ticket.category && (
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                      <FolderOpen className="size-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs text-default-500 mb-0.5">{t('ticket.category')}</p>
                      <p className="text-sm font-medium text-default-900">{ticket.category}</p>
                    </div>
                  </div>
                )}

                {/* Type */}
                {ticket.type && (
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                      <Ticket className="size-4 text-pink-500" />
                    </div>
                    <div>
                      <p className="text-xs text-default-500 mb-0.5">{t('ticket.type')}</p>
                      <p className="text-sm font-medium text-default-900">{ticket.type}</p>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {parsedTags.length > 0 && (
                  <div>
                    <p className="text-xs text-default-500 mb-2">{t('ticket.tags')}</p>
                    <div className="flex flex-wrap gap-1">
                      {parsedTags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Card */}
            <div className="card">
              <div className="card-header">
                <h6 className="card-title">{t('ticket.timeline')}</h6>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {/* Created */}
                  <div className="flex gap-3">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-default-900">{t('ticket.ticketCreated')}</p>
                      <p className="text-xs text-default-500">{ticket.created_at}</p>
                    </div>
                  </div>

                  {/* Due Date */}
                  {ticket.due && (
                    <div className="flex gap-3">
                      <div className="size-8 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                        <Clock className="size-4 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-default-900">{t('ticket.dueDate')}</p>
                        <p className="text-xs text-default-500">{ticket.due}</p>
                      </div>
                    </div>
                  )}

                  {/* Last Updated */}
                  <div className="flex gap-3">
                    <div className="size-8 rounded-full bg-info/10 flex items-center justify-center shrink-0">
                      <Edit3 className="size-4 text-info" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-default-900">{t('ticket.lastUpdated')}</p>
                      <p className="text-xs text-default-500">{ticket.updated_at}</p>
                    </div>
                  </div>

                  {/* Closed */}
                  {ticket.closed && ticket.closed_at && (
                    <div className="flex gap-3">
                      <div className="size-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                        <CheckCircle className="size-4 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-default-900">{t('ticket.closed')}</p>
                        <p className="text-xs text-default-500">{ticket.closed_at}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Attachments Card */}
            {attachments.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h6 className="card-title">{t('ticket.attachments')} ({attachments.length})</h6>
                </div>
                <div className="card-body">
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 p-2 rounded-lg border border-default-200 bg-default-50"
                      >
                        <div className="flex-shrink-0 text-default-500">
                          <FileText className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-default-900 truncate">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-default-500">
                            {formatFileSize(attachment.size)}
                          </p>
                        </div>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 size-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                          title={t('common.view')}
                        >
                          <Eye className="size-4" />
                        </a>
                        <a
                          href={attachment.url}
                          download={attachment.name}
                          className="flex-shrink-0 size-8 bg-success/10 text-success rounded-lg flex items-center justify-center hover:bg-success hover:text-white transition-colors"
                          title="Download"
                        >
                          <Download className="size-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resolve Ticket Modal */}
        {showResolveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 m-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-default-900">{t('ticket.resolveTicket')}</h3>
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setResolutionDetails('');
                  }}
                  className="text-default-400 hover:text-default-600"
                >
                  <XCircle className="size-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-default-600 mb-3">
                  {t('ticket.resolutionDetails')}
                </p>
                <textarea
                  value={resolutionDetails}
                  onChange={(e) => setResolutionDetails(e.target.value)}
                  placeholder={t('ticket.writeMessage')}
                  className="w-full px-3 py-2 border border-default-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px] resize-y"
                  minLength={10}
                />
                {resolutionDetails.trim().length > 0 && resolutionDetails.trim().length < 10 && (
                  <p className="text-xs text-danger mt-1">
                    Please provide at least 10 characters
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResolveModal(false);
                    setResolutionDetails('');
                  }}
                  className="btn btn-sm bg-transparent border border-default-200 text-default-600 hover:bg-default-50"
                  disabled={isResolving}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleResolveTicket}
                  className="btn btn-sm bg-success text-white hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isResolving || !resolutionDetails.trim() || resolutionDetails.trim().length < 10}
                >
                  {isResolving ? t('common.loading') : t('ticket.resolveTicket')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
