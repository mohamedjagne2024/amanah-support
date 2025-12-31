import { useForm, Link, router } from '@inertiajs/react';
import { useMemo, useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  FileText, 
  Calendar, 
  Mail, 
  Clock, 
  Eye, 
  Trash2, 
  Edit3, 
  Tag,
  Ticket,
  Download
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageMeta from '@/components/PageMeta';
import InputError from '@/components/input-error';
import Combobox, { SelectOption } from '@/components/Combobox';
import TextEditor from '@/components/TextEditor';
import DatePicker from '@/components/DatePicker';
import { ConfirmDialog } from '@/components/Dialog';
import Breadcrumb from '@/components/Breadcrumb';

type ContactOption = {
  id: number;
  name: string;
};

type DepartmentOption = {
  id: number;
  name: string;
};

type PriorityOption = {
  value: string;
  name: string;
};

type StatusOption = {
  value: string;
  name: string;
};

type TypeOption = {
  id: number;
  name: string;
};

type CategoryOption = {
  id: number;
  name: string;
};

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
  files: File[];
  comment_access: string;
};

type EditTicketPageProps = {
  title: string;
  ticket: TicketData;
  contacts: ContactOption[];
  usersExceptContacts: ContactOption[];
  departments: DepartmentOption[];
  priorities: PriorityOption[];
  statuses: StatusOption[];
  types: TypeOption[];
  all_categories: CategoryOption[];
  attachments: AttachmentType[];
  comments: CommentType[];
  requiredFields: string[];
};

export default function Edit({
  title,
  ticket,
  contacts,
  usersExceptContacts,
  departments,
  priorities,
  statuses,
  types,
  all_categories,
  attachments,
  comments,
  requiredFields = [],
}: EditTicketPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [removedFileIds, setRemovedFileIds] = useState<number[]>([]);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    contact_id: ticket.contact_id?.toString() || '',
    priority: ticket.priority || '',
    status: ticket.status || '',
    type_id: ticket.type_id?.toString() || '',
    department_id: ticket.department_id?.toString() || '',
    assigned_to: ticket.assigned_to?.toString() || '',
    category_id: ticket.category_id?.toString() || '',
    subject: ticket.subject || '',
    details: ticket.details || '',
    due: ticket.due || '',
    source: ticket.source || 'Email',
    tags: ticket.tags || '',
    files: [] as File[],
    removedFiles: [] as number[],
    comment: '',
  });

  // Parse tags from comma-separated string
  const parsedTags = useMemo(() => {
    return data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t) : [];
  }, [data.tags]);

  const contactOptions = useMemo<SelectOption[]>(
    () =>
      contacts.map((contact) => ({
        label: contact.name,
        value: contact.id,
      })),
    [contacts]
  );

  const assigneeOptions = useMemo<SelectOption[]>(
    () =>
      usersExceptContacts.map((user) => ({
        label: user.name,
        value: user.id,
      })),
    [usersExceptContacts]
  );

  const departmentOptions = useMemo<SelectOption[]>(
    () =>
      departments.map((dept) => ({
        label: dept.name,
        value: dept.id,
      })),
    [departments]
  );

  const priorityOptions = useMemo<SelectOption[]>(
    () =>
      priorities.map((priority) => ({
        label: priority.name,
        value: priority.value,
      })),
    [priorities]
  );

  const statusOptions = useMemo<SelectOption[]>(
    () =>
      statuses.map((status) => ({
        label: status.name,
        value: status.value,
      })),
    [statuses]
  );

  const typeOptions = useMemo<SelectOption[]>(
    () =>
      types.map((type) => ({
        label: type.name,
        value: type.id,
      })),
    [types]
  );

  const categoryOptions = useMemo<SelectOption[]>(
    () =>
      all_categories.map((category) => ({
        label: category.name,
        value: category.id,
      })),
    [all_categories]
  );

  const sourceOptions: SelectOption[] = [
    { label: 'Email', value: 'Email' },
    { label: 'Phone', value: 'Phone' },
    { label: 'Web', value: 'Web' },
    { label: 'Chat', value: 'Chat' },
    { label: 'Social Media', value: 'Social Media' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const updatedFiles = [...newAttachments, ...newFiles].slice(0, 5);
      setNewAttachments(updatedFiles);
      setData('files', updatedFiles);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveNewFile = (index: number) => {
    const updatedFiles = newAttachments.filter((_, i) => i !== index);
    setNewAttachments(updatedFiles);
    setData('files', updatedFiles);
  };

  const handleRemoveExistingFile = (fileId: number) => {
    const updatedRemovedIds = [...removedFileIds, fileId];
    setRemovedFileIds(updatedRemovedIds);
    setData('removedFiles', updatedRemovedIds);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDetailsChange = (content: string) => {
    setData('details', content);
  };

  const handleCommentChange = (content: string) => {
    setData('comment', content);
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const currentTags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t) : [];
      if (!currentTags.includes(tagInput.trim())) {
        const newTags = [...currentTags, tagInput.trim()].join(', ');
        setData('tags', newTags);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t) : [];
    const newTags = currentTags.filter(tag => tag !== tagToRemove).join(', ');
    setData('tags', newTags);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(`/tickets/${ticket.id}`, {
      forceFormData: true,
      onSuccess: () => {
        // Clear the local attachments state after successful upload
        setNewAttachments([]);
        setRemovedFileIds([]);
        setData('files', []);
        setData('removedFiles', []);
      },
    });
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    router.delete(`/tickets/${ticket.uid}`, {
      onStart: () => setIsDeleting(true),
      onFinish: () => {
        setIsDeleting(false);
        handleCloseDeleteDialog();
      }
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
    if (s.includes('closed') || s.includes('resolved')) return 'bg-danger text-white';
    if (s.includes('open') || s.includes('new')) return 'bg-info text-white';
    if (s.includes('pending')) return 'bg-warning text-white';
    if (s.includes('progress')) return 'bg-primary text-white';
    return 'bg-default-200 text-default-700';
  };

  const visibleAttachments = attachments.filter(
    (attachment) => !removedFileIds.includes(attachment.id)
  );

  return (
    <AppLayout>
      <PageMeta title={`Edit Ticket #${ticket.uid}`} />
      <main className="pb-8">
        
        <Breadcrumb 
          items={[
            { label: 'Tickets', href: '/tickets' },
            { label: `#${ticket.uid}`, href: `/tickets/${ticket.uid}` },
            { label: 'Edit' }
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
                  Edit Ticket #{ticket.uid}
                </h1>
                {ticket.closed && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">
                    Closed
                  </span>
                )}
              </div>
              <p className="text-default-600 text-sm mt-1 line-clamp-1">{ticket.subject}</p>
              
              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-default-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-4" />
                  <span>Created {ticket.created_at}</span>
                </div>
                {ticket.due && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    <span>Due {ticket.due}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Mail className="size-4" />
                  <span>{ticket.source}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  <span>Last modified {ticket.updated_at}</span>
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
                    {parsedTags.length} tags
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/tickets/${ticket.uid}`}>
              <button type="button" className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/10">
                <Eye className="size-4 me-1" />
                View Ticket
              </button>
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              className="btn btn-sm bg-danger/15 text-danger hover:bg-danger hover:text-white"
            >
              <Trash2 className="size-4 me-1" />
              Delete
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information Card */}
              <div className="card">
                <div className="card-header">
                  <h6 className="card-title">Basic Information</h6>
                </div>
                <div className="card-body space-y-6">
                  {/* Subject */}
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Subject <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={data.subject}
                      onChange={(e) => setData('subject', e.target.value)}
                      placeholder="Enter subject"
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.subject} />
                  </div>

                  {/* Description */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block font-medium text-default-900 text-sm">
                        Description <span className="text-danger">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsEditingDescription(!isEditingDescription)}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="size-3" />
                        Edit
                      </button>
                    </div>
                    {isEditingDescription ? (
                      <>
                        <input type="hidden" name="details" value={data.details} />
                        <TextEditor
                          placeholder="Enter detailed request information..."
                          onChange={handleDetailsChange}
                          showToolbar={true}
                          className="min-h-[200px]"
                          initialValue={data.details}
                        />
                      </>
                    ) : (
                      <div 
                        className="max-w-none p-4 bg-default-50 rounded-lg border border-default-200 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-default-300 [&_blockquote]:pl-4 [&_blockquote]:italic"
                        dangerouslySetInnerHTML={{ __html: data.details || '<p class="text-default-400 italic">No description provided</p>' }}
                      />
                    )}
                    <InputError message={errors.details} />
                  </div>
                </div>
              </div>

              {/* Attachments Card */}
              <div className="card">
                <div className="card-header">
                  <h6 className="card-title">Attachments</h6>
                </div>
                <div className="card-body">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={processing}
                    multiple
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processing}
                    className="btn btn-sm bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                  >
                    <Upload className="size-4 mr-2" />
                    Attach Files
                  </button>

                  {/* Existing Attachments */}
                  {visibleAttachments.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {visibleAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-default-200 bg-default-50"
                        >
                          <div className="flex-shrink-0 text-default-500">
                            <FileText className="size-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-default-900 truncate">
                              {attachment.name}
                            </p>
                            <p className="text-xs text-default-500">
                              {formatFileSize(attachment.size)}
                              {attachment.user && ` • Uploaded by ${attachment.user.name}`}
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
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingFile(attachment.id)}
                            className="flex-shrink-0 size-8 bg-danger/10 text-danger rounded-lg flex items-center justify-center hover:bg-danger hover:text-white transition-colors"
                            title="Remove"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Attachments */}
                  {newAttachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-default-500 font-medium">New Files:</p>
                      {newAttachments.map((file, index) => (
                        <div
                          key={`new-${file.name}-${index}`}
                          className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5"
                        >
                          <div className="flex-shrink-0 text-primary">
                            <FileText className="size-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-default-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-default-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveNewFile(index)}
                            className="flex-shrink-0 size-6 bg-danger text-white rounded flex items-center justify-center hover:bg-danger/80 transition-colors"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {visibleAttachments.length === 0 && newAttachments.length === 0 && (
                    <p className="text-sm text-default-400 italic">No attachments</p>
                  )}
                </div>
              </div>

              {/* Comments Card */}
              <div className="card">
                <div className="card-header">
                  <h6 className="card-title">Comments</h6>
                </div>
                <div className="card-body">
                  {/* Existing Comments */}
                  {comments.length > 0 && (
                    <div className="space-y-4 mb-6">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm uppercase shrink-0">
                            {comment.user?.name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-default-900 text-sm">
                                {comment.user?.name || 'Unknown User'}
                              </span>
                              <span className="text-xs text-default-500">
                                {comment.created_at}
                              </span>
                            </div>
                            <div 
                              className="text-sm text-default-600 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: comment.details }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {comments.length === 0 && (
                    <p className="text-sm text-default-400 italic mb-6">No comments yet</p>
                  )}

                  {/* Add Comment */}
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Add Comment
                    </label>
                    <TextEditor
                      placeholder="Write a comment..."
                      onChange={handleCommentChange}
                      showToolbar={true}
                      className="min-h-[150px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Properties Card */}
              <div className="card">
                <div className="card-header">
                  <h6 className="card-title">Properties</h6>
                </div>
                <div className="card-body space-y-4">
                  {/* Contact */}
                  <div>
                    <input type="hidden" name="contact_id" value={data.contact_id} />
                    <Combobox
                      label="Contact"
                      options={contactOptions}
                      value={
                        contactOptions.find(
                          (opt) => String(opt.value) === data.contact_id
                        ) || null
                      }
                      onChange={(option) =>
                        setData('contact_id', option?.value?.toString() || '')
                      }
                      placeholder="Search contact"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.contact_id}
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <input type="hidden" name="priority" value={data.priority} />
                    <Combobox
                      label="Priority"
                      options={priorityOptions}
                      value={
                        priorityOptions.find(
                          (opt) => String(opt.value) === data.priority
                        ) || null
                      }
                      onChange={(option) =>
                        setData('priority', option?.value?.toString() || '')
                      }
                      placeholder="Select priority"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.priority}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <input type="hidden" name="status" value={data.status} />
                    <Combobox
                      label="Status"
                      options={statusOptions}
                      value={
                        statusOptions.find(
                          (opt) => String(opt.value) === data.status
                        ) || null
                      }
                      onChange={(option) =>
                        setData('status', option?.value?.toString() || '')
                      }
                      placeholder="Select status"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.status}
                    />
                  </div>

                  {/* Assigned To */}
                  <div>
                    <input type="hidden" name="assigned_to" value={data.assigned_to} />
                    <Combobox
                      label={
                        <>
                          Assigned to
                          {requiredFields.includes('assigned_to') && (
                            <span className="text-danger">*</span>
                          )}
                        </>
                      }
                      options={assigneeOptions}
                      value={
                        assigneeOptions.find(
                          (opt) => String(opt.value) === data.assigned_to
                        ) || null
                      }
                      onChange={(option) =>
                        setData('assigned_to', option?.value?.toString() || '')
                      }
                      placeholder="Select assignee"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.assigned_to}
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <input type="hidden" name="type_id" value={data.type_id} />
                    <Combobox
                      label={
                        <>
                          Type
                          {requiredFields.includes('ticket_type') && (
                            <span className="text-danger">*</span>
                          )}
                        </>
                      }
                      options={typeOptions}
                      value={
                        typeOptions.find(
                          (opt) => String(opt.value) === data.type_id
                        ) || null
                      }
                      onChange={(option) =>
                        setData('type_id', option?.value?.toString() || '')
                      }
                      placeholder="Select type"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.type_id}
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <input type="hidden" name="department_id" value={data.department_id} />
                    <Combobox
                      label={
                        <>
                          Department
                          {requiredFields.includes('department') && (
                            <span className="text-danger">*</span>
                          )}
                        </>
                      }
                      options={departmentOptions}
                      value={
                        departmentOptions.find(
                          (opt) => String(opt.value) === data.department_id
                        ) || null
                      }
                      onChange={(option) =>
                        setData('department_id', option?.value?.toString() || '')
                      }
                      placeholder="Select department"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.department_id}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <input type="hidden" name="category_id" value={data.category_id} />
                    <Combobox
                      label={
                        <>
                          Category
                          {requiredFields.includes('category') && (
                            <span className="text-danger">*</span>
                          )}
                        </>
                      }
                      options={categoryOptions}
                      value={
                        categoryOptions.find(
                          (opt) => String(opt.value) === data.category_id
                        ) || null
                      }
                      onChange={(option) => setData('category_id', option?.value?.toString() || '')}
                      placeholder="Select category"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.category_id}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Details Card */}
              <div className="card">
                <div className="card-header">
                  <h6 className="card-title">Additional Details</h6>
                </div>
                <div className="card-body space-y-4">
                  {/* Due Date */}
                  <div>
                    <DatePicker
                      label="Due Date"
                      value={data.due}
                      onChange={(dates, dateStr) => setData('due', dateStr)}
                      placeholder="Select due date"
                      disabled={processing}
                      options={{
                        enableTime: true,
                      }}
                    />
                  </div>

                  {/* Source */}
                  <div>
                    <Combobox
                      label="Source"
                      options={sourceOptions}
                      value={
                        sourceOptions.find(
                          (opt) => String(opt.value) === data.source
                        ) || null
                      }
                      onChange={(option) =>
                        setData('source', option?.value?.toString() || 'Email')
                      }
                      placeholder="Select source"
                      disabled={processing}
                      isSearchable={false}
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Tags
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="email, notifications, configuration"
                        className="form-input flex-1"
                        disabled={processing}
                      />
                    </div>
                    {parsedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {parsedTags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-danger transition-colors"
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <input type="hidden" name="tags" value={data.tags} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <Link href={`/tickets/${ticket.uid}`}>
                  <button
                    type="button"
                    className="btn border-default-200 text-default-900"
                    disabled={processing}
                  >
                    Cancel
                  </button>
                </Link>
                <button
                  type="submit"
                  className="btn bg-primary text-white"
                  disabled={processing}
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <div className="inline-block border-2 border-white rounded-full size-4 animate-spin border-s-transparent" />
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDeleteDialog();
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        description={`Are you sure you want to delete the ticket "${ticket.subject}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isDeleting}
        size="lg"
      />
    </AppLayout>
  );
}
