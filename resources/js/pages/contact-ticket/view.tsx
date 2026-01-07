import { useState } from 'react';
import axios from 'axios';
import {
  FileText,
  Calendar,
  Mail,
  Clock,
  Ticket,
  Copy,
  Check,
  MessageSquare,
  Plus,
  Star,
  Eye,
  Download,
  CheckCircle,
} from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import PageMeta from '@/components/PageMeta';
import TextEditor from '@/components/TextEditor';
import Breadcrumb from '@/components/Breadcrumb';
import { useTicketCommentListener } from '@/hooks/usePusher';

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

type ReviewType = {
  id: number;
  rating: number;
  review: string | null;
  created_at: string;
};

type TicketData = {
  id: number;
  uid: string;
  contact_id: number | null;
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
  region_id: number | null;
  region: string;
  category_id: number | null;
  sub_category_id: number | null;
  category: string;
  sub_category: string;
  assigned_to: number | null;
  assigned_user: string;
  type_id: number | null;
  type: string;
  subject: string;
  details: string;
  due: string | null;
  source: string;
  response: string | null;
  created_by: {
    id: number;
    name: string;
    profile_picture_url?: string | null;
  } | null;
  resolution_details: string | null;
  resolve: string | null;
};

type ViewTicketPageProps = {
  title: string;
  ticket: TicketData;
  attachments: AttachmentType[];
  comments: CommentType[];
  review: ReviewType | null;
  footer?: any;
};

export default function ContactTicketView({
  title,
  ticket,
  attachments,
  comments: initialComments,
  review: initialReview,
  footer,
}: ViewTicketPageProps) {
  const [copiedUid, setCopiedUid] = useState(false);
  const [showNewComment, setShowNewComment] = useState(false);
  const [localComments, setLocalComments] = useState<CommentType[]>(initialComments);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  // Review state
  const [localReview, setLocalReview] = useState<ReviewType | null>(initialReview);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(initialReview?.rating || 0);
  const [reviewText, setReviewText] = useState(initialReview?.review || '');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Listen for real-time comment updates via Pusher
  useTicketCommentListener(ticket.id, (newComment) => {
    // Add the new comment to local state if it doesn't already exist
    setLocalComments((prev) => {
      const exists = prev.some((c) => c.id === newComment.id);
      if (exists) return prev;
      return [...prev, newComment];
    });
  });

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
      const response = await axios.post(`/contact/tickets/${ticket.id}/comment`, {
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
    if (s.includes('closed') || s.includes('resolved')) return 'bg-success text-white';
    if (s.includes('open') || s.includes('new')) return 'bg-info text-white';
    if (s.includes('pending')) return 'bg-warning text-white';
    if (s.includes('progress')) return 'bg-primary text-white';
    return 'bg-default-200 text-default-700';
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewRating === 0 || isSubmittingReview) return;

    setIsSubmittingReview(true);
    try {
      const response = await axios.post(`/contact/tickets/${ticket.id}/review`, {
        rating: reviewRating,
        review: reviewText.trim() || null,
      });

      if (response.data.review) {
        setLocalReview(response.data.review);
        setShowReviewForm(false);
      }
    } catch {
      // Error handling - review submission failed
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <>
      <PageMeta title={title} />

      <PublicLayout currentPage="/contact/tickets" footer={footer} showToast>

        {/* Page Content */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="mb-3">
                <Breadcrumb
                  items={[
                    { label: 'Tickets', href: '/contact/tickets' },
                    { label: ticket.uid, href: `/contact/tickets/${ticket.id}` },
                  ]}
                />
              </div>
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
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
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {!ticket.closed && ticket.response && (
                    <button
                      type="button"
                      onClick={() => setShowNewComment(true)}
                      className="btn btn-sm bg-primary text-white"
                    >
                      <MessageSquare className="size-4 me-1" />
                      Reply to Ticket
                    </button>
                  )}
                </div>
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

                {/* Resolution Details Card - Only show when ticket is resolved */}
                {ticket.resolution_details && (ticket.status?.slug === 'resolved' || ticket.closed) && (
                  <div className="card">
                    <div className="card-header">
                      <h6 className="card-title flex items-center gap-2">
                        <CheckCircle className="size-5 text-success" />
                        Resolution Details
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="p-4 bg-gradient-to-r from-success/5 to-primary/5 rounded-xl border border-success/20">
                        <div className="flex items-start gap-4">
                          <div className="size-10 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0">
                            <CheckCircle className="size-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-default-900">Ticket Resolved</span>
                              {ticket.resolve && (
                                <span className="text-xs text-default-400">
                                  {formatDateTime(ticket.resolve)}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-default-600 whitespace-pre-wrap">
                              {ticket.resolution_details}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conversations Card */}
                <div className="card">
                  <div className="card-header flex items-center justify-between">
                    <h6 className="card-title">Conversations</h6>
                    {!ticket.closed && ticket.response && (
                      <button
                        onClick={() => setShowNewComment(true)}
                        className="btn btn-sm bg-transparent btn-outline-dashed border-primary text-primary hover:bg-primary/10"
                      >
                        <Plus className="size-4 me-1" />
                        New Reply
                      </button>
                    )}
                  </div>
                  <div className="card-body">
                    {localComments.length === 0 && !showNewComment ? (
                      <div className="text-center py-12">
                        <div className="size-16 mx-auto mb-4 rounded-full bg-default-100 flex items-center justify-center">
                          <MessageSquare className="size-8 text-default-400" />
                        </div>
                        <h6 className="text-default-900 font-medium mb-1">No conversations yet</h6>
                        <p className="text-default-500 text-sm mb-4">
                          {ticket.closed
                            ? 'No conversations were made for this ticket'
                            : !ticket.response
                              ? 'Waiting for staff response...'
                              : 'Start a conversation to discuss this ticket'}
                        </p>
                        {!ticket.closed && ticket.response && (
                          <button
                            onClick={() => setShowNewComment(true)}
                            className="btn btn-sm bg-transparent btn-outline-dashed border-primary text-primary hover:bg-primary/10"
                          >
                            <Plus className="size-4 me-1" />
                            Start First Conversation
                          </button>
                        )}
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

                        {/* Show reply form or add reply button - only when ticket is open AND staff has responded */}
                        {!ticket.closed && ticket.response && (
                          <>
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
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Section - Only show when ticket is closed */}
                {ticket.closed && (
                  <div className="card">
                    <div className="card-header">
                      <h6 className="card-title flex items-center gap-2">
                        <Star className="size-5 text-warning" />
                        Rate Your Experience
                      </h6>
                    </div>
                    <div className="card-body">
                      {localReview ? (
                        <div className="space-y-4">
                          {/* Existing Review Display */}
                          <div className="p-4 bg-gradient-to-r from-warning/5 to-primary/5 rounded-xl border border-warning/20">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm font-medium text-default-700">Your Rating:</span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`size-5 ${star <= localReview.rating
                                      ? 'text-warning fill-warning'
                                      : 'text-default-300'
                                      }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-semibold text-warning">{localReview.rating}/5</span>
                            </div>
                            {localReview.review && (
                              <div className="text-sm text-default-600 italic">
                                "{localReview.review}"
                              </div>
                            )}
                          </div>

                          {/* Edit Review Button */}
                          <button
                            type="button"
                            onClick={() => setShowReviewForm(true)}
                            className="w-full btn btn-sm bg-transparent text-default-600 border border-dashed border-default-300 hover:bg-warning/10 hover:text-warning hover:border-warning"
                          >
                            <Star className="size-4 me-1" />
                            Update Your Review
                          </button>
                        </div>
                      ) : !showReviewForm ? (
                        <div className="text-center py-8">
                          <div className="size-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-warning/20 to-primary/20 flex items-center justify-center">
                            <Star className="size-8 text-warning" />
                          </div>
                          <h6 className="text-default-900 font-medium mb-1">How was your experience?</h6>
                          <p className="text-default-500 text-sm mb-4">Your feedback helps us improve our service</p>
                          <button
                            onClick={() => setShowReviewForm(true)}
                            className="btn btn-sm bg-gradient-to-r from-warning to-amber-500 text-white hover:from-warning/90 hover:to-amber-500/90 shadow-lg shadow-warning/20"
                          >
                            <Star className="size-4 me-1" />
                            Leave a Review
                          </button>
                        </div>
                      ) : null}

                      {/* Review Form */}
                      {showReviewForm && (
                        <form onSubmit={handleSubmitReview} className="space-y-5">
                          {/* Star Rating */}
                          <div>
                            <label className="block text-sm font-medium text-default-700 mb-3">
                              How would you rate our support?
                            </label>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewRating(star)}
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-warning/50 rounded"
                                >
                                  <Star
                                    className={`size-8 transition-colors ${star <= (hoverRating || reviewRating)
                                      ? 'text-warning fill-warning'
                                      : 'text-default-300 hover:text-default-400'
                                      }`}
                                  />
                                </button>
                              ))}
                              {reviewRating > 0 && (
                                <span className="ml-2 text-sm font-medium text-default-600">
                                  {reviewRating === 1 && 'Poor'}
                                  {reviewRating === 2 && 'Fair'}
                                  {reviewRating === 3 && 'Good'}
                                  {reviewRating === 4 && 'Very Good'}
                                  {reviewRating === 5 && 'Excellent!'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Review Text */}
                          <div>
                            <label className="block text-sm font-medium text-default-700 mb-2">
                              Tell us more (optional)
                            </label>
                            <textarea
                              value={reviewText}
                              onChange={(e) => setReviewText(e.target.value)}
                              placeholder="Share your thoughts about the support you received..."
                              rows={4}
                              maxLength={1000}
                              className="w-full px-4 py-3 rounded-lg border border-default-200 bg-white text-default-900 placeholder-default-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                            />
                            <div className="text-xs text-default-400 mt-1 text-right">
                              {reviewText.length}/1000 characters
                            </div>
                          </div>

                          {/* Submit Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowReviewForm(false);
                                if (!localReview) {
                                  setReviewRating(0);
                                  setReviewText('');
                                }
                              }}
                              className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-default-100"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmittingReview || reviewRating === 0}
                              className="btn btn-sm bg-gradient-to-r from-warning to-amber-500 text-white hover:from-warning/90 hover:to-amber-500/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-warning/20"
                            >
                              {isSubmittingReview ? 'Submitting...' : localReview ? 'Update Review' : 'Submit Review'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}
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
                        <span className="text-sm text-default-500">Assigned to</span>
                        <span className="text-sm font-medium text-default-900">{ticket.assigned_user || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-default-100">
                        <span className="text-sm text-default-500">Region</span>
                        <span className="text-sm font-medium text-default-900">{ticket.region || 'N/A'}</span>
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
          </div>


        </section>
      </PublicLayout>
    </>
  );
}
