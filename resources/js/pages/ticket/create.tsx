import { useForm, Link } from '@inertiajs/react';
import { useMemo, useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageMeta from '@/components/PageMeta';
import InputError from '@/components/input-error';
import Combobox, { SelectOption } from '@/components/Combobox';
import TextEditor from '@/components/TextEditor';
import PageHeader from '@/components/Pageheader';
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

type TypeOption = {
  id: number;
  name: string;
};

type CategoryOption = {
  id: number;
  name: string;
  parent_id: number | null;
};

type CreateTicketPageProps = {
  contacts: ContactOption[];
  usersExceptContacts: ContactOption[];
  departments: DepartmentOption[];
  priorities: PriorityOption[];
  types: TypeOption[];
  all_categories: CategoryOption[];
  requiredFields: string[];
};

export default function Create({
  contacts,
  usersExceptContacts,
  departments,
  priorities,
  types,
  all_categories,
  requiredFields = [],
}: CreateTicketPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  const { data, setData, post, processing, errors } = useForm({
    contact_id: '',
    priority: '',
    type_id: '',
    department_id: '',
    assigned_to: '',
    category_id: '',
    subject: '',
    details: '',
    files: [] as File[],
  });

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const updatedFiles = [...attachments, ...newFiles].slice(0, 5); // Max 5 files
      setAttachments(updatedFiles);
      setData('files', updatedFiles);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = attachments.filter((_, i) => i !== index);
    setAttachments(updatedFiles);
    setData('files', updatedFiles);
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


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/tickets', {
      forceFormData: true,
    });
  };

  return (
    <AppLayout>
      <PageMeta title="Create Ticket" />
      <main className="max-w-5xl">
        <Breadcrumb
          items={[
            { label: 'Tickets', href: '/tickets' },
            { label: 'Create Ticket' }
          ]}
          className="mb-4"
        />
        <PageHeader title="Create Ticket" />
        <form onSubmit={handleSubmit} className="space-y-6 pb-8">
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Ticket Information</h6>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {/* First 3-Column Grid: Contact, Priority, Type */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <input type="hidden" name="contact_id" value={data.contact_id} />
                    <Combobox
                      label={
                        <>
                          Contact <span className="text-danger">*</span>
                        </>
                      }
                      options={contactOptions}
                      value={
                        contactOptions.find(
                          (opt) => String(opt.value) === data.contact_id
                        ) || null
                      }
                      onChange={(option) =>
                        setData('contact_id', option?.value?.toString() || '')
                      }
                      placeholder="Start typing"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.contact_id}
                    />
                  </div>

                  <div>
                    <input type="hidden" name="priority" value={data.priority} />
                    <Combobox
                      label={
                        <>
                          Priority{requiredFields.includes('priority') && <span className="text-danger">*</span>}
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

                  <div>
                    <input type="hidden" name="type_id" value={data.type_id} />
                    <Combobox
                      label={
                        <>
                          Type{requiredFields.includes('ticket_type') && <span className="text-danger">*</span>}
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
                </div>

                {/* Second 2-Column Grid: Department, Assigned to */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <input type="hidden" name="department_id" value={data.department_id} />
                    <Combobox
                      label={
                        <>
                          Department{requiredFields.includes('department') && <span className="text-danger">*</span>}
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
                      placeholder="Select a department"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.department_id}
                    />
                  </div>

                  <div>
                    <input type="hidden" name="assigned_to" value={data.assigned_to} />
                    <Combobox
                      label={
                        <>
                          Assigned to{requiredFields.includes('assigned_to') && <span className="text-danger">*</span>}
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
                      placeholder="Start typing"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.assigned_to}
                    />
                  </div>
                </div>

                {/* Category Field */}
                <div>
                  <input type="hidden" name="category_id" value={data.category_id} />
                  <Combobox
                    label={
                      <>
                        Category{requiredFields.includes('category') && <span className="text-danger">*</span>}
                      </>
                    }
                    options={categoryOptions}
                    value={
                      categoryOptions.find(
                        (opt) => String(opt.value) === data.category_id
                      ) || null
                    }
                    onChange={(option) => setData('category_id', option?.value?.toString() || '')}
                    placeholder="Select a category"
                    disabled={processing}
                    isClearable
                    isSearchable
                    error={errors.category_id}
                  />
                </div>

                {/* Subject Field - Full Width */}
                <div className="w-full">
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

                {/* Request Details Field - Full Width with Rich Text Editor */}
                <div className="w-full">
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    Request Details <span className="text-danger">*</span>
                  </label>
                  <input type="hidden" name="details" value={data.details} />
                  <TextEditor
                    placeholder="Enter detailed request information..."
                    onChange={handleDetailsChange}
                    showToolbar={true}
                    className="min-h-[200px]"
                  />
                  <InputError message={errors.details} />
                </div>

                {/* Attachments Upload Field */}
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    Attach Files
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
                    Attach Files
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
                  <InputError message={errors.files} />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link href="/tickets">
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
                'Create Ticket'
              )}
            </button>
          </div>
        </form>
      </main>
    </AppLayout>
  );
}
