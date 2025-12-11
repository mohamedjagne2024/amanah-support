import { useForm, Link } from '@inertiajs/react';
import { useMemo, useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import InputError from '@/components/input-error';
import Combobox, { SelectOption } from '@/components/Combobox';
import DatePicker from '@/components/DatePicker';

type AssetOption = {
  id: number;
  name: string;
  serial_number: string | null;
};

type StaffOption = {
  id: number;
  name: string;
};

type CreateWorkOrderPageProps = {
  assets: AssetOption[];
  staff: StaffOption[];
};

const priorityOptions: SelectOption[] = [
  { label: 'Low', value: '0' },
  { label: 'Medium', value: '1' },
  { label: 'High', value: '2' },
];

export default function Create({ assets, staff }: CreateWorkOrderPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  const { data, setData, post, processing, errors } = useForm({
    title: '',
    description: '',
    due_date: '',
    priority: '',
    asset_id: '',
    staff_id: '',
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

  const staffOptions = useMemo<SelectOption[]>(
    () =>
      staff.map((s) => ({
        label: s.name,
        value: s.id,
      })),
    [staff]
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
    post('/work-orders', {
      forceFormData: true,
    });
  };

  return (
    <AppLayout>
      <PageMeta title="Create Work Order" />
      <main className="max-w-4xl">
        <PageBreadcrumb title="Create Work Order" subtitle="Maintenance" />

        <form onSubmit={handleSubmit} className="space-y-6 pb-8">
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Work Order Information</h6>
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
                    placeholder="Enter work order title"
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
                    placeholder="Enter detailed description"
                    disabled={processing}
                    rows={4}
                    className="form-input"
                  />
                  <InputError message={errors.description} />
                </div>

                {/* First 2-Column Grid: Assign To, Asset */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <input type="hidden" name="staff_id" value={data.staff_id} />
                    <Combobox
                      label="Assign To"
                      options={staffOptions}
                      value={
                        staffOptions.find(
                          (opt) => String(opt.value) === data.staff_id
                        ) || null
                      }
                      onChange={(option) =>
                        setData('staff_id', option?.value?.toString() || '')
                      }
                      placeholder="Select staff member"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.staff_id}
                    />
                  </div>

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
                      placeholder="Select asset"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.asset_id}
                    />
                  </div>
                </div>

                {/* Second 2-Column Grid: Due Date, Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <input type="hidden" name="due_date" value={data.due_date} />
                    <DatePicker
                      label="Due Date"
                      required
                      inputClassName="form-input"
                      value={data.due_date}
                      onChange={(dates, dateStr) => setData('due_date', dateStr)}
                      placeholder="Select due date"
                      disabled={processing}
                      error={errors.due_date}
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
                      placeholder="Select priority"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.priority}
                    />
                  </div>
                </div>

                {/* Attachments Upload Field */}
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    Attachments
                  </label>
                  <p className="text-xs text-default-500 mb-3">
                    Upload up to 5 files (PDF, DOC, DOCX, JPG, PNG, XLS, XLSX). Max 5MB per file.
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
            <Link href="/work-orders">
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
                  Creating...
                </span>
              ) : (
                'Create Work Order'
              )}
            </button>
          </div>
        </form>
      </main>
    </AppLayout>
  );
}

