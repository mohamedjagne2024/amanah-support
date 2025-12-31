import { Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Calendar, 
  Mail, 
  Clock, 
  Edit3, 
  Tag,
  Ticket,
  Copy,
  Check,
  MessageSquare,
  Plus,
  Star,
  UserPlus,
  Eye,
  Download,
  XCircle,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageMeta from '@/components/PageMeta';
import TextEditor from '@/components/TextEditor';
import Breadcrumb from '@/components/Breadcrumb';
import { useTicketCommentListener } from '@/hooks/usePusher';
import { ConfirmDialog } from '@/components/Dialog';

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

type CommentType = {
  id: number;
  details: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    profile_picture_url?: string | null;
  };
};

type TicketData = {
  id: number;
  uid: string;
  contact_id: number | null;
  contact: any;
  priority: string;
  created_at: string;
  updated_at: string;
  priority_label: string;
  status: string;
  status_label: string;
  closed: boolean;
  review: any;
  department_id: number | null;
  department: string;
  category_id: number | null;
  sub_category_id: number | null;
  category: string;
  sub_category: string;
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
  estimated_hours: string;
  actual_hours: string;
  files: File[];
  comment_access: string;
  created_by: {
    id: number;
    name: string;
    profile_picture_url?: string | null;
  } | null;
};

type ViewTicketPageProps = {
  title: string;
  ticket: TicketData;
  attachments: AttachmentType[];
  comments: CommentType[];
};

export default function View({
  title,
  ticket,
  attachments,
  comments: initialComments,
}: ViewTicketPageProps) {
  const [copiedUid, setCopiedUid] = useState(false);
  const [showNewComment, setShowNewComment] = useState(false);
  const [localComments, setLocalComments] = useState<CommentType[]>(initialComments);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Listen for real-time comment updates via Pusher
  useTicketCommentListener(ticket.id, (newComment) => {
    // Add the new comment to local state if it doesn't already exist
    setLocalComments((prev) => {
      const exists = prev.some((c) => c.id === newComment.id);
      if (exists) return prev;
      return [...prev, newComment];
    });
  });

  // Parse tags from comma-separated string
  const parsedTags = useMemo(() => {
    return ticket.tags ? ticket.tags.split(',').map(t => t.trim()).filter(t => t) : [];
  }, [ticket.tags]);

  // Generate activity log from system events (excludes comments - they appear in Conversations)
  const activityLog = useMemo(() => {
    const activities: Array<{
      id: number;
      type: 'system' | 'assignment' | 'created';
      message: string;
      created_at: string;
      user?: { id: number; name: string; profile_picture_url?: string | null };
    }> = [];
    
    // Add ticket created event with the user who created it
    activities.push({
      id: 0,
      type: 'created',
      message: 'Ticket created',
      created_at: ticket.created_at,
      user: ticket.created_by || undefined,
    });

    // Add assignment event if assigned
    if (ticket.assigned_to && ticket.assigned_user) {
      activities.push({
        id: -1,
        type: 'assignment',
        message: `Ticket assigned to ${ticket.assigned_user}`,
        created_at: ticket.created_at,
        user: undefined,
      });
    }

    return activities.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [ticket]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCopyUid = () => {
    navigator.clipboard.writeText(`${ticket.uid}`);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleCommentChange = (content: string) => {
    setCommentText(content);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await axios.post(`/tickets/${ticket.id}/comment`, {
        comment: commentText,
      });
      
      // Add the comment to local state immediately
      if (response.data.comment) {
        setLocalComments((prev) => {
          const exists = prev.some((c) => c.id === response.data.comment.id);
          if (exists) return prev;
          return [...prev, response.data.comment];
        });
      }
      
      setCommentText('');
      setEditorKey((prev) => prev + 1);
      setShowNewComment(false);
    } catch {
      // Error handling - comment failed to submit
    } finally {
      setIsSubmitting(false);
    }
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

  const handleCloseTicket = async () => {
    setIsClosing(true);
    try {
      await axios.post(`/tickets/${ticket.id}/close`);
      setShowCloseModal(false);
      router.reload();
    } catch {
      // Error handling - close failed
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <AppLayout>
      <PageMeta title={`Ticket #${ticket.uid} - ${ticket.subject}`} />
      <main className="pb-8">
        <Breadcrumb 
          items={[
            { label: 'Tickets', href: '/tickets' },
            { label: `#${ticket.uid}` }
          ]}
          className="mb-4"
        />

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            {/* Ticket Icon */}
            <div className="relative shrink-0">
              <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Ticket className="size-7 text-primary" />
              </div>
              {ticket.status === 'open' && (
                <span className="absolute -top-1 -right-1 size-4 bg-success rounded-full border-2 border-white" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Ticket ID with copy button */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-default-900">
                  #{ticket.uid}
                </h1>
                <button
                  onClick={handleCopyUid}
                  className="p-1 rounded hover:bg-default-100 transition-colors"
                  title="Copy ticket ID"
                >
                  {copiedUid ? (
                    <Check className="size-4 text-success" />
                  ) : (
                    <Copy className="size-4 text-default-400" />
                  )}
                </button>
                {ticket.closed && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">
                    Closed
                  </span>
                )}
              </div>
              
              {/* Subject */}
              <p className="text-default-600 text-sm mt-1 line-clamp-2">{ticket.subject}</p>
              
              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-default-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-4" />
                  <span>Created {formatDate(ticket.created_at)}</span>
                </div>
                {ticket.due && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    <span>Due {formatDate(ticket.due)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Mail className="size-4" />
                  <span>{ticket.source}</span>
                </div>
              </div>

              {/* Status Badges Row */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(ticket.status_label)}`}>
                  {ticket.status_label}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getPriorityBadgeClass(ticket.priority_label)}`}>
                  <Star className="size-3" />
                  {ticket.priority_label}
                </span>
                {parsedTags.length > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-default-200 text-default-700 flex items-center gap-1">
                    <Tag className="size-3" />
                    {parsedTags.length} tags
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
                onClick={() => setShowCloseModal(true)}
                className="btn bg-danger text-white btn-sm"
              >
                <XCircle className="size-4 me-1" />
                Close Ticket
              </button>
            )}
            <Link href={`/tickets/${ticket.uid}/edit`}>
              <button type="button" className="btn bg-primary text-white btn-sm">
                <Edit3 className="size-4 me-1" />
                Edit Ticket
              </button>
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Information Card */}
            <div className="card">
              <div className="card-header">
                <h6 className="card-title">Ticket Information</h6>
              </div>
              <div className="card-body">
                <div className="mb-4">
                  <h6 className="text-sm font-semibold text-default-900 mb-3 flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    Description
                  </h6>
                  <div 
                    className="max-w-none p-4 bg-default-50 rounded-lg border border-default-200 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-default-300 [&_blockquote]:pl-4 [&_blockquote]:italic"
                    dangerouslySetInnerHTML={{ 
                      __html: ticket.details || '<p class="text-default-400 italic">No description provided</p>' 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Ticket Activity Log Card */}
            <div className="card">
              <div className="card-header">
                <h6 className="card-title">Ticket Activity Log</h6>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {activityLog.map((activity, index) => (
                    <div key={`${activity.type}-${activity.id}-${index}`} className="flex gap-3">
                      {activity.type === 'created' && activity.user ? (
                        activity.user.profile_picture_url ? (
                          <img 
                            src={activity.user.profile_picture_url} 
                            alt={activity.user.name} 
                            className="size-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="size-8 rounded-full bg-success/10 flex items-center justify-center text-success font-semibold text-sm uppercase shrink-0">
                            {activity.user.name.charAt(0)}
                          </div>
                        )
                      ) : activity.type === 'assignment' ? (
                        <div className="size-8 rounded-full bg-info/10 flex items-center justify-center shrink-0">
                          <UserPlus className="size-4 text-info" />
                        </div>
                      ) : (
                        <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Ticket className="size-4 text-white" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        {activity.type === 'created' ? (
                          <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-default-900 text-sm">
                                {activity.message}
                              </span>
                              <span className="px-2 py-0.5 rounded text-xs bg-success/10 text-success font-medium">
                                Created
                              </span>
                            </div>
                            <span className="text-xs text-default-400">
                              by {activity.user?.name || 'Unknown'} • {formatDateTime(activity.created_at)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-default-900 text-sm">
                                {activity.message}
                              </span>
                              <span className="px-2 py-0.5 rounded text-xs bg-info/10 text-info font-medium">
                                Assigned
                              </span>
                            </div>
                            <span className="text-xs text-default-400">
                              {formatDateTime(activity.created_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reply Card */}
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h6 className="card-title">Reply</h6>
                <button
                  onClick={() => setShowNewComment(true)}
                  className="btn btn-sm bg-transparent btn-outline-dashed border-primary text-primary hover:bg-primary/10"
                >
                  <Plus className="size-4 me-1" />
                  New Reply
                </button>
              </div>
              <div className="card-body">
                {localComments.length === 0 && !showNewComment ? (
                  <div className="text-center py-12">
                    <div className="size-16 mx-auto mb-4 rounded-full bg-default-100 flex items-center justify-center">
                      <MessageSquare className="size-8 text-default-400" />
                    </div>
                    <h6 className="text-default-900 font-medium mb-1">No replies yet</h6>
                    <p className="text-default-500 text-sm mb-4">Reply to discuss this ticket</p>
                    <button
                      onClick={() => setShowNewComment(true)}
                      className="btn btn-sm bg-transparent btn-outline-dashed border-primary text-primary hover:bg-primary/10"
                    >
                      <Plus className="size-4 me-1" />
                      Reply
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Always show existing comments */}
                    {localComments.map((comment: CommentType) => (
                      <div key={comment.id} className="flex gap-3 p-4 bg-default-50 rounded-lg">
                        {comment.user?.profile_picture_url ? (
                          <img 
                            src={comment.user.profile_picture_url} 
                            alt={comment.user.name || 'User'} 
                            className="size-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm uppercase shrink-0">
                            {comment.user?.name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-default-900">
                              {comment.user?.name || 'Unknown User'}
                            </span>
                            <span className="text-xs text-default-400">
                              {formatDateTime(comment.created_at)}
                            </span>
                          </div>
                          <div 
                            className="text-sm text-default-600 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: comment.details }}
                          />
                        </div>
                      </div>
                    ))}
                    
                    {/* Show reply form or add reply button */}
                    {showNewComment ? (
                      <form onSubmit={handleSubmitComment} className="space-y-4 pt-4 border-t border-default-200">
                        <TextEditor
                          key={editorKey}
                          placeholder="Write your message..."
                          onChange={handleCommentChange}
                          showToolbar={true}
                          className="min-h-[150px]"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowNewComment(false)}
                            className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting || !commentText.trim()}
                            className="btn bg-primary text-white btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Send Message
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowNewComment(true)}
                        className="w-full btn btn-sm bg-transparent text-default-600 border border-dashed border-default-300 hover:bg-primary/10 hover:text-primary"
                      >
                        <Plus className="size-4 me-1" />
                        Add Reply
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Details Card */}
            <div className="card">
              <div className="card-header">
                <h6 className="card-title">Details</h6>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-default-100">
                    <span className="text-sm text-default-500">Contact</span>
                    <span className="text-sm font-medium text-default-900">{ticket.contact?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-default-100">
                    <span className="text-sm text-default-500">Assigned to</span>
                    <span className="text-sm font-medium text-default-900">{ticket.assigned_user || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-default-100">
                    <span className="text-sm text-default-500">Department</span>
                    <span className="text-sm font-medium text-default-900">{ticket.department || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-default-100">
                    <span className="text-sm text-default-500">Category</span>
                    <span className="text-sm font-medium text-default-900">{ticket.category || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-default-100">
                    <span className="text-sm text-default-500">Type</span>
                    <span className="text-sm font-medium text-default-900">{ticket.type || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-default-500">Source</span>
                    <span className="text-sm font-medium text-default-900">{ticket.source}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="card">
              <div className="card-header">
                <h6 className="card-title">Timeline</h6>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="size-3 mt-1.5 rounded-full bg-success" />
                    <div>
                      <p className="text-sm font-medium text-default-900">Created</p>
                      <p className="text-xs text-default-500">{formatDateTime(ticket.created_at)}</p>
                    </div>
                  </div>
                  {ticket.due && (
                    <div className="flex items-start gap-3">
                      <div className="size-3 mt-1.5 rounded-full bg-warning" />
                      <div>
                        <p className="text-sm font-medium text-default-900">Due Date</p>
                        <p className="text-xs text-default-500">{formatDateTime(ticket.due)}</p>
                      </div>
                    </div>
                  )}
                  {ticket.updated_at !== ticket.created_at && (
                    <div className="flex items-start gap-3">
                      <div className="size-3 mt-1.5 rounded-full bg-info" />
                      <div>
                        <p className="text-sm font-medium text-default-900">Last Updated</p>
                        <p className="text-xs text-default-500">{formatDateTime(ticket.updated_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tags Card */}
            <div className="card">
              <div className="card-header">
                <h6 className="card-title">Tags</h6>
              </div>
              <div className="card-body">
                {parsedTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {parsedTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-default-400 italic">No tags</p>
                )}
              </div>
            </div>

            {/* Attachments Card */}
            {attachments.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h6 className="card-title">Attachments ({attachments.length})</h6>
                </div>
                <div className="card-body">
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-default-50 border border-default-200"
                      >
                        <FileText className="size-5 text-default-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-default-900 truncate">
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
                          title="View"
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

        {/* Close Ticket Confirmation Modal */}
        <ConfirmDialog
          open={showCloseModal}
          onOpenChange={setShowCloseModal}
          onConfirm={handleCloseTicket}
          title="Close Ticket"
          description="Are you sure you want to close this ticket? This action will mark the ticket as resolved."
          confirmText="Close Ticket"
          cancelText="Cancel"
          confirmVariant="danger"
          isLoading={isClosing}
        />
      </main>
    </AppLayout>
  );
}
