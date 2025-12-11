import { useForm, Link, router } from '@inertiajs/react';
import { useMemo, useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Undo2, Paperclip, Calendar, History, User, CheckCircle2, XCircle, Clock, Wrench } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import InputError from '@/components/input-error';
import Combobox, { SelectOption } from '@/components/Combobox';
import DatePicker from '@/components/DatePicker';
import { Badge } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/Dialog';
import Drawer from '@/components/Drawer';

type AssetOption = {
  id: number;
  name: string;
  serial_number: string | null;
};

type UserWorkOrder = {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: number;
  status: number;
  asset: {
    id: number;
    name: string;
    serial_number: string | null;
  } | null;
  staff: {
    id: number;
    name: string;
  } | null;
  approved_user: {
    id: number;
    name: string;
  } | null;
  rejected_user: {
    id: number;
    name: string;
  } | null;
  completed_user: {
    id: number;
    name: string;
  } | null;
  approved_at: string | null;
  rejected_at: string | null;
  completed_at: string | null;
  attachments_count: number;
  created_at: string;
};

type RequestWorkOrderPageProps = {
  assets: AssetOption[];
  userWorkOrders: UserWorkOrder[];
};

const priorityOptions: SelectOption[] = [
  { label: 'Low', value: '0' },
  { label: 'Medium', value: '1' },
  { label: 'High', value: '2' },
];

const STATUS_LOOKUP: Record<number, { label: string; variant: 'default' | 'warning' | 'danger' | 'success' | 'info' }> = {
  0: { label: 'Pending', variant: 'warning' },
  1: { label: 'Approved', variant: 'info' },
  2: { label: 'In Progress', variant: 'default' },
  3: { label: 'Completed', variant: 'success' },
  4: { label: 'Rejected', variant: 'danger' },
};

// Progress steps for the timeline
const PROGRESS_STEPS = [
  { status: 0, label: 'Pending', icon: Clock },
  { status: 1, label: 'Approved', icon: CheckCircle2 },
  { status: 2, label: 'In Progress', icon: Wrench },
  { status: 3, label: 'Completed', icon: CheckCircle2 },
];

const PRIORITY_LOOKUP: Record<number, { label: string; variant: 'default' | 'warning' | 'danger' }> = {
  0: { label: 'Low', variant: 'default' },
  1: { label: 'Medium', variant: 'warning' },
  2: { label: 'High', variant: 'danger' },
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
};

const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return dateString;
  }
};

export default function Request({ assets, userWorkOrders = [] }: RequestWorkOrderPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingWorkOrder, setDeletingWorkOrder] = useState<UserWorkOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Count pending requests for badge
  const pendingCount = useMemo(() => 
    userWorkOrders.filter(wo => wo.status === 0 || wo.status === 4).length, 
    [userWorkOrders]
  );

  const { data, setData, post, processing, errors, reset } = useForm({
    title: '',
    description: '',
    due_date: '',
    priority: '',
    asset_id: '',
    attachments: [] as File[],
  });

  const assetOptions = useMemo<SelectOption[]>(
    () =>
      assets.map((asset) => ({
        label: asset.serial_number
          ? `${asset.name} (${asset.serial_number})`
          : asset.name,
        value: asset.id,
      })),
    [assets]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const updatedFiles = [...attachments, ...newFiles].slice(0, 5); // Max 5 files
      setAttachments(updatedFiles);
      setData('attachments', updatedFiles);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = attachments.filter((_, i) => i !== index);
    setAttachments(updatedFiles);
    setData('attachments', updatedFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/work-orders/request', {
      forceFormData: true,
      onSuccess: () => {
        reset();
        setAttachments([]);
      },
    });
  };

  // Delete handlers
  const handleOpenDeleteDialog = useCallback((workOrder: UserWorkOrder) => {
    setDeletingWorkOrder(workOrder);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setDeletingWorkOrder(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deletingWorkOrder) return;

    setIsDeleting(true);
    router.delete(`/work-orders/request/${deletingWorkOrder.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        handleCloseDeleteDialog();
      },
      onFinish: () => {
        setIsDeleting(false);
      },
    });
  }, [deletingWorkOrder, handleCloseDeleteDialog]);

  // Get the progress level for a work order (0-4 based on status)
  const getProgressLevel = (status: number): number => {
    if (status === 4) return -1; // Rejected
    return status;
  };

  return (
    <AppLayout>
      <PageMeta title="Request Maintenance" />
      <main className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <PageBreadcrumb title="Request Maintenance" subtitle="Maintenance" />
          
          {/* History Button */}
          {userWorkOrders.length > 0 && (
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="btn border-default-200 text-default-700 hover:bg-default-50 relative"
            >
              <History className="size-4 mr-2" />
              History
              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center size-5 text-xs font-medium bg-warning text-white rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </div>

        <div className="space-y-8 pb-8">
          {/* New Request Form */}
          <form onSubmit={handleSubmit}>
            <div className="card">
              <div className="card-header">
                <h6 className="card-title">New Maintenance Request</h6>
              </div>
              <div className="card-body">
                <div className="space-y-6">
                  {/* Title Field - Half Width */}
                  <div className="w-full md:w-1/2">
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={data.title}
                      onChange={(e) => setData('title', e.target.value)}
                      placeholder="Enter maintenance request title"
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.title} />
                  </div>

                  {/* Description Field - Full Width */}
                  <div className="w-full">
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                      placeholder="Enter detailed description of the maintenance issue"
                      disabled={processing}
                      rows={4}
                      className="form-input"
                    />
                    <p className="mt-1 text-xs text-default-500">
                      Please provide detailed information about the maintenance needed
                    </p>
                    <InputError message={errors.description} />
                  </div>

                  {/* 2-Column Grid: Asset, Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <input type="hidden" name="asset_id" value={data.asset_id} />
                      <Combobox
                        label={
                          <>
                            Asset <span className="text-danger">*</span>
                          </>
                        }
                        options={assetOptions}
                        value={
                          assetOptions.find(
                            (opt) => String(opt.value) === data.asset_id
                          ) || null
                        }
                        onChange={(option) =>
                          setData('asset_id', option?.value?.toString() || '')
                        }
                        placeholder="Search or select asset"
                        disabled={processing}
                        isClearable
                        isSearchable
                        error={errors.asset_id}
                      />
                    </div>

                    <div>
                      <input type="hidden" name="priority" value={data.priority} />
                      <Combobox
                        label={
                          <>
                            Priority <span className="text-danger">*</span>
                          </>
                        }
                        options={priorityOptions}
                        value={
                          priorityOptions.find(
                            (opt) => String(opt.value) === data.priority
                          ) || null
                        }
                        onChange={(option) =>
                          setData('priority', option?.value?.toString() || '')
                        }
                        placeholder="Search or select priority"
                        disabled={processing}
                        isClearable
                        isSearchable
                        error={errors.priority}
                      />
                    </div>
                  </div>

                  {/* Due Date - Half Width */}
                  <div className="w-full md:w-1/2">
                    <input type="hidden" name="due_date" value={data.due_date} />
                    <DatePicker
                      label="Due Date"
                      required
                      inputClassName="form-input"
                      value={data.due_date}
                      onChange={(dates, dateStr) => setData('due_date', dateStr)}
                      placeholder="Select preferred completion date"
                      disabled={processing}
                      error={errors.due_date}
                    />
                    <p className="mt-1 text-xs text-default-500">
                      When would you like this maintenance to be completed?
                    </p>
                  </div>

                  {/* Attachments Upload Field */}
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Attachments
                    </label>
                    <p className="text-xs text-default-500 mb-3">
                      Upload up to 5 files (PDF, DOC, DOCX, JPG, PNG, XLS, XLSX). Max 5MB per file. 
                      You can attach photos or documents related to the maintenance issue.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={processing || attachments.length >= 5}
                      multiple
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={processing || attachments.length >= 5}
                      className="btn btn-sm border-default-200 text-default-700 hover:bg-default-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="size-4 mr-2" />
                      Upload Attachments
                    </button>

                    {/* Attachments List */}
                    {attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {attachments.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center gap-3 p-2 rounded-lg border border-default-200 bg-default-50"
                          >
                            <div className="flex-shrink-0 text-default-500">
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
                              onClick={() => handleRemoveFile(index)}
                              className="flex-shrink-0 size-6 bg-danger text-white rounded flex items-center justify-center hover:bg-danger/80 transition-colors"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <InputError message={errors.attachments} />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Link href="/">
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
                    Submitting...
                  </span>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseDeleteDialog();
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Undo"
        description={`Are you sure you want to undo and delete the maintenance request "${deletingWorkOrder?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isDeleting}
        size="sm"
      />

      {/* History Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Your Maintenance Requests"
        size="4xl"
        placement="right"
      >
        <div className="space-y-4">
          {userWorkOrders.length === 0 ? (
            <div className="text-center py-8 text-default-500">
              <History className="size-12 mx-auto mb-3 opacity-50" />
              <p>No maintenance requests yet</p>
            </div>
          ) : (
            userWorkOrders.map((workOrder) => {
              const statusInfo = STATUS_LOOKUP[workOrder.status] || { label: 'Unknown', variant: 'default' as const };
              const priorityInfo = PRIORITY_LOOKUP[workOrder.priority] || { label: 'Unknown', variant: 'default' as const };
              const progressLevel = getProgressLevel(workOrder.status);
              const isRejected = workOrder.status === 4;
              const canUndo = workOrder.status === 0 || workOrder.status === 4;
              
              return (
                <div
                  key={workOrder.id}
                  className="p-4 rounded-lg border border-default-200 bg-default-50/30"
                >
                  {/* Header with title and badges */}
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-default-800 mb-1">
                        {workOrder.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                        <Badge variant={priorityInfo.variant}>
                          {priorityInfo.label} Priority
                        </Badge>
                      </div>
                    </div>
                    
                    {canUndo && (
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteDialog(workOrder)}
                        className="btn btn-sm border-danger text-danger hover:bg-danger/10 shrink-0"
                      >
                        <Undo2 className="size-4" />
                        Undo
                      </button>
                    )}
                  </div>

                  {/* Progress Timeline */}
                  {!isRejected && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        {PROGRESS_STEPS.map((step, index) => {
                          const isCompleted = progressLevel >= step.status;
                          const isCurrent = progressLevel === step.status;
                          const StepIcon = step.icon;
                          
                          return (
                            <div key={step.status} className="flex items-center flex-1">
                              <div className="flex flex-col items-center">
                                <div
                                  className={`flex items-center justify-center size-8 rounded-full border-2 transition-colors ${
                                    isCompleted
                                      ? 'bg-success border-success text-white'
                                      : isCurrent
                                      ? 'bg-primary border-primary text-white'
                                      : 'bg-default-100 border-default-300 text-default-400'
                                  }`}
                                >
                                  <StepIcon className="size-4" />
                                </div>
                                <span className={`text-xs mt-1 ${isCompleted || isCurrent ? 'text-default-700 font-medium' : 'text-default-400'}`}>
                                  {step.label}
                                </span>
                              </div>
                              {index < PROGRESS_STEPS.length - 1 && (
                                <div
                                  className={`flex-1 h-0.5 mx-2 ${
                                    progressLevel > step.status ? 'bg-success' : 'bg-default-200'
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rejected indicator */}
                  {isRejected && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-danger/10 border border-danger/20 mb-3">
                      <XCircle className="size-5 text-danger" />
                      <div className="text-sm">
                        <span className="font-medium text-danger">Rejected</span>
                        {workOrder.rejected_user && (
                          <span className="text-default-600"> by {workOrder.rejected_user.name}</span>
                        )}
                        {workOrder.rejected_at && (
                          <span className="text-default-500"> on {formatDateTime(workOrder.rejected_at)}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {workOrder.description && (
                    <p className="text-sm text-default-600 mb-3 line-clamp-2">
                      {workOrder.description}
                    </p>
                  )}
                  
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Asset */}
                    {workOrder.asset && (
                      <div className="flex items-center gap-1.5 text-default-600">
                        <span className="font-medium text-default-700">Asset:</span>
                        <span className="truncate">
                          {workOrder.asset.serial_number
                            ? `${workOrder.asset.name} (${workOrder.asset.serial_number})`
                            : workOrder.asset.name}
                        </span>
                      </div>
                    )}
                    
                    {/* Due Date */}
                    {workOrder.due_date && (
                      <div className="flex items-center gap-1.5 text-default-600">
                        <Calendar className="size-3" />
                        <span className="font-medium text-default-700">Due:</span>
                        <span>{formatDate(workOrder.due_date)}</span>
                      </div>
                    )}
                    
                    {/* Assigned To */}
                    {workOrder.staff && (
                      <div className="flex items-center gap-1.5 text-default-600">
                        <User className="size-3" />
                        <span className="font-medium text-default-700">Assigned:</span>
                        <span>{workOrder.staff.name}</span>
                      </div>
                    )}
                    
                    {/* Attachments */}
                    {workOrder.attachments_count > 0 && (
                      <div className="flex items-center gap-1.5 text-default-600">
                        <Paperclip className="size-3" />
                        <span>{workOrder.attachments_count} attachment(s)</span>
                      </div>
                    )}
                  </div>

                  {/* Status History */}
                  <div className="mt-3 pt-3 border-t border-default-200">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-default-500">
                      <span>Created: {formatDateTime(workOrder.created_at)}</span>
                      
                      {workOrder.approved_at && workOrder.approved_user && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="size-3 text-success" />
                          Approved by {workOrder.approved_user.name}
                        </span>
                      )}
                      
                      {workOrder.completed_at && workOrder.completed_user && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="size-3 text-success" />
                          Completed by {workOrder.completed_user.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Drawer>
    </AppLayout>
  );
}

