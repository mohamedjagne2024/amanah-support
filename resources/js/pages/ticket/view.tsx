import { useForm, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { 
  FileText, 
  Calendar, 
  Mail, 
  Clock, 
  Edit3, 
  Tag,
  ChevronRight,
  Ticket,
  Copy,
  Check,
  MessageSquare,
  Plus,
  Star,
  ExternalLink,
  UserPlus,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageMeta from '@/components/PageMeta';
import TextEditor from '@/components/TextEditor';

type AttachmentType = {
  id: number;
  name: string;
  size: number;
  path: string;
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
  };
};

type TicketData = {
  id: number;
  uid: string;
  user_id: number | null;
  contact_id: number | null;
  user: string;
  contact: any;
  priority_id: number | null;
  created_at: string;
  updated_at: string;
  priority: string;
  status_id: number | null;
  status: {
    id: number;
    name: string;
    slug: string;
  } | null;
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
  impact_level: string;
  urgency_level: string;
  estimated_hours: string;
  actual_hours: string;
  files: File[];
  comment_access: string;
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
  comments,
}: ViewTicketPageProps) {
  const [copiedUid, setCopiedUid] = useState(false);
  const [showNewComment, setShowNewComment] = useState(false);

  const { data, setData, post, processing } = useForm({
    comment: '',
  });

  // Parse tags from comma-separated string
  const parsedTags = useMemo(() => {
    return ticket.tags ? ticket.tags.split(',').map(t => t.trim()).filter(t => t) : [];
  }, [ticket.tags]);

  // Generate activity log from comments and system events
  const activityLog = useMemo(() => {
    const activities: Array<{
      id: number;
      type: 'system' | 'comment' | 'assignment';
      message: string;
      created_at: string;
      user?: { id: number; name: string };
    }> = [];
    
    // Add ticket created event
    activities.push({
      id: 0,
      type: 'system',
      message: 'Ticket created',
      created_at: ticket.created_at,
      user: undefined,
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

    // Add comments as activities
    comments.forEach((comment) => {
      activities.push({
        id: comment.id,
        type: 'comment',
        message: comment.details,
        created_at: comment.created_at,
        user: comment.user,
      });
    });

    return activities.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [ticket, comments]);

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
    setData('comment', content);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.comment.trim()) return;
    
    post(`/tickets/${ticket.id}/comment`, {
      onSuccess: () => {
        setData('comment', '');
        setShowNewComment(false);
      },
    });
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
    if (s.includes('closed') || s.includes('resolved')) return 'bg-success text-white';
    if (s.includes('open') || s.includes('new')) return 'bg-info text-white';
    if (s.includes('pending')) return 'bg-warning text-white';
    if (s.includes('progress')) return 'bg-primary text-white';
    return 'bg-default-200 text-default-700';
  };

  const getImpactBadgeClass = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('critical') || l.includes('high')) return 'bg-warning/10 text-warning border border-warning/20';
    if (l.includes('medium')) return 'bg-info/10 text-info border border-info/20';
    if (l.includes('low')) return 'bg-success/10 text-success border border-success/20';
    return 'bg-default-100 text-default-600 border border-default-200';
  };

  return (
    <AppLayout>
      <PageMeta title={`Ticket #${ticket.uid} - ${ticket.subject}`} />
      <main className="pb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-4">
          <Link href="/tickets" className="text-default-500 hover:text-primary flex items-center gap-1">
            Tickets
          </Link>
          <ChevronRight className="size-4 text-default-400" />
          <span className="text-default-700 font-medium">
            #{ticket.uid}
          </span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            {/* Ticket Icon */}
            <div className="relative shrink-0">
              <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Ticket className="size-7 text-primary" />
              </div>
              {ticket.status?.slug?.includes('open') && (
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
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(ticket.status?.name || null)}`}>
                  {ticket.status?.name || 'Unknown'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getPriorityBadgeClass(ticket.priority)}`}>
                  <Star className="size-3" />
                  {ticket.priority}
                </span>
                {ticket.impact_level && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getImpactBadgeClass(ticket.impact_level)}`}>
                    <span className="opacity-70">Impact:</span> {ticket.impact_level}
                  </span>
                )}
                {ticket.urgency_level && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getImpactBadgeClass(ticket.urgency_level)}`}>
                    <span className="opacity-70">Urgency:</span> {ticket.urgency_level}
                  </span>
                )}
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
            <button
              type="button"
              onClick={() => setShowNewComment(true)}
              className="btn btn-sm bg-transparent btn-outline-dashed border-primary text-primary hover:bg-primary/10"
            >
              <MessageSquare className="size-4 me-1" />
              Start Conversation
            </button>
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
                    className="prose prose-sm max-w-none text-default-600 p-4 bg-default-50 rounded-lg border border-default-200"
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
                      {activity.type === 'comment' && activity.user ? (
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm uppercase shrink-0">
                          {activity.user.name.charAt(0)}
                        </div>
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
                        {activity.type === 'comment' ? (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-default-900 text-sm">
                                {activity.user?.name || 'Unknown User'}
                              </span>
                              <span className="text-xs text-default-400">
                                {formatDateTime(activity.created_at)}
                              </span>
                            </div>
                            <div 
                              className="text-sm text-default-600 bg-default-50 rounded-lg p-3 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: activity.message }}
                            />
                          </>
                        ) : (
                          <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-default-900 text-sm">
                                {activity.message}
                              </span>
                              <span className="px-2 py-0.5 rounded text-xs bg-info/10 text-info font-medium">
                                System Event
                              </span>
                            </div>
                            <span className="text-xs text-default-400">
                              by System • {formatDateTime(activity.created_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversations Card */}
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h6 className="card-title">Conversations</h6>
                <button
                  onClick={() => setShowNewComment(true)}
                  className="btn btn-sm bg-transparent btn-outline-dashed border-primary text-primary hover:bg-primary/10"
                >
                  <Plus className="size-4 me-1" />
                  New Conversation
                </button>
              </div>
              <div className="card-body">
                {showNewComment ? (
                  <form onSubmit={handleSubmitComment} className="space-y-4">
                    <TextEditor
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
                        disabled={processing || !data.comment.trim()}
                        className="btn bg-primary text-white btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send Message
                      </button>
                    </div>
                  </form>
                ) : comments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="size-16 mx-auto mb-4 rounded-full bg-default-100 flex items-center justify-center">
                      <MessageSquare className="size-8 text-default-400" />
                    </div>
                    <h6 className="text-default-900 font-medium mb-1">No conversations yet</h6>
                    <p className="text-default-500 text-sm mb-4">Start a conversation to discuss this ticket</p>
                    <button
                      onClick={() => setShowNewComment(true)}
                      className="btn btn-sm bg-transparent btn-outline-dashed border-primary text-primary hover:bg-primary/10"
                    >
                      <Plus className="size-4 me-1" />
                      Start First Conversation
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 p-4 bg-default-50 rounded-lg">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm uppercase shrink-0">
                          {comment.user?.name?.charAt(0) || 'U'}
                        </div>
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
                    <button
                      onClick={() => setShowNewComment(true)}
                      className="w-full btn btn-sm bg-transparent text-default-600 border border-dashed border-default-300 hover:bg-primary/10 hover:text-primary"
                    >
                      <Plus className="size-4 me-1" />
                      Add Reply
                    </button>
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
                    <span className="text-sm text-default-500">Customer</span>
                    <span className="text-sm font-medium text-default-900">{ticket.user || 'N/A'}</span>
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
                      <a
                        key={attachment.id}
                        href={`/storage/${attachment.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg bg-default-50 hover:bg-default-100 transition-colors group"
                      >
                        <FileText className="size-5 text-default-500 group-hover:text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-default-900 truncate">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-default-500">
                            {formatFileSize(attachment.size)}
                          </p>
                        </div>
                        <ExternalLink className="size-4 text-default-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
