import { useForm } from "@inertiajs/react";
import { FormEvent, useMemo, useRef, useState } from "react";
import PublicLayout from "@/layouts/public-layout";
import PageMeta from "@/components/PageMeta";
import { Ticket, ArrowLeft, Send, Upload, X, FileText } from "lucide-react";
import { Link } from "@inertiajs/react";
import Combobox, { SelectOption } from "@/components/Combobox";
import TextEditor from "@/components/TextEditor";
import Breadcrumb from "@/components/Breadcrumb";

type Department = {
  id: number;
  name: string;
};

type CategoryOption = {
  id: number;
  name: string;
  parent_id?: number | null;
};

type TypeOption = {
  id: number;
  name: string;
};

type PageProps = {
  title: string;
  departments: Department[];
  all_categories: CategoryOption[];
  types: TypeOption[];
  hide_ticket_fields: string[];
  footer?: any;
};

export default function CreateContactTicket({ 
  title, 
  departments = [], 
  all_categories = [],
  types = [],
  hide_ticket_fields = [],
  footer 
}: PageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    subject: '',
    details: '',
    department_id: '',
    category_id: '',
    sub_category_id: '',
    type_id: '',
    files: [] as File[],
  });

  const departmentOptions = useMemo<SelectOption[]>(
    () => departments.map((d) => ({ label: d.name, value: d.id })),
    [departments]
  );

  const categoryOptions = useMemo<SelectOption[]>(
    () => all_categories.filter((c) => !c.parent_id).map((c) => ({ label: c.name, value: c.id })),
    [all_categories]
  );

  const subCategoryOptions = useMemo<SelectOption[]>(
    () => all_categories.filter((c) => c.parent_id === Number(data.category_id)).map((c) => ({ label: c.name, value: c.id })),
    [all_categories, data.category_id]
  );

  const typeOptions = useMemo<SelectOption[]>(
    () => types.map((t) => ({ label: t.name, value: t.id })),
    [types]
  );

  const isFieldHidden = (field: string) => hide_ticket_fields.includes(field);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = [...attachments, ...Array.from(files)].slice(0, 5);
      setAttachments(newFiles);
      setData('files', newFiles);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    setAttachments(updated);
    setData('files', updated);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    post('/contact/tickets', {
      forceFormData: true,
      onStart: () => setIsSubmitting(true),
      onFinish: () => setIsSubmitting(false),
      onSuccess: () => {
        reset();
        setAttachments([]);
      },
    });
  };

  return (
    <>
      <PageMeta title={title} />
      
      <PublicLayout currentPage="/contact/tickets" footer={footer} showToast>

        {/* Page Content */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <Breadcrumb
                items={[
                  { label: 'Tickets', href: '/contact/tickets' },
                  { label: 'Create New Ticket', href: '/contact/tickets/create' },
                ]}
              />
              <div className="mt-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-default-900">Create New Ticket</h1>
              </div>
            </div>

            {/* Form Card */}
            <div className="card">
              <div className="card-header">
                <h6 className="card-title">Submit a Support Request</h6>
                <p className="text-sm text-default-500 mt-1">
                  Please fill in the details below to create a new support ticket.
                </p>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Subject Field */}
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Subject <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={data.subject}
                      onChange={(e) => setData('subject', e.target.value)}
                      placeholder="Brief description of your issue"
                      className={`form-input ${
                        errors.subject ? 'border-danger focus:border-danger focus:ring-danger' : ''
                      }`}
                      disabled={processing}
                    />
                    {errors.subject && (
                      <p className="mt-1 text-sm text-danger">{errors.subject}</p>
                    )}
                  </div>

                  {/* Optional Fields - Department & Type */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    {!isFieldHidden('department') && (
                      <div>
                        <Combobox
                          label="Department"
                          options={departmentOptions}
                          value={departmentOptions.find((opt) => String(opt.value) === data.department_id) || null}
                          onChange={(option) => setData('department_id', option?.value?.toString() || '')}
                          placeholder="Select department"
                          disabled={processing}
                          isClearable
                          isSearchable
                        />
                        {errors.department_id && (
                          <p className="text-danger text-sm mt-1">{errors.department_id}</p>
                        )}
                      </div>
                    )}
                    {!isFieldHidden('ticket_type') && (
                      <div>
                        <Combobox
                          label="Type"
                          options={typeOptions}
                          value={typeOptions.find((opt) => String(opt.value) === data.type_id) || null}
                          onChange={(option) => setData('type_id', option?.value?.toString() || '')}
                          placeholder="Select type"
                          disabled={processing}
                          isClearable
                          isSearchable
                        />
                        {errors.type_id && (
                          <p className="text-danger text-sm mt-1">{errors.type_id}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Category & Sub-category */}
                  {!isFieldHidden('category') && (
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <Combobox
                          label="Category"
                          options={categoryOptions}
                          value={categoryOptions.find((opt) => String(opt.value) === data.category_id) || null}
                          onChange={(option) => {
                            setData('category_id', option?.value?.toString() || '');
                            setData('sub_category_id', '');
                          }}
                          placeholder="Select category"
                          disabled={processing}
                          isClearable
                          isSearchable
                        />
                        {errors.category_id && (
                          <p className="text-danger text-sm mt-1">{errors.category_id}</p>
                        )}
                      </div>
                      {!isFieldHidden('sub_category') && data.category_id && subCategoryOptions.length > 0 && (
                        <div>
                          <Combobox
                            label="Sub Category"
                            options={subCategoryOptions}
                            value={subCategoryOptions.find((opt) => String(opt.value) === data.sub_category_id) || null}
                            onChange={(option) => setData('sub_category_id', option?.value?.toString() || '')}
                            placeholder="Select sub category"
                            disabled={processing}
                            isClearable
                            isSearchable
                          />
                          {errors.sub_category_id && (
                            <p className="text-danger text-sm mt-1">{errors.sub_category_id}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Details Field */}
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Details <span className="text-danger">*</span>
                    </label>
                    <TextEditor
                      placeholder="Please describe your issue in detail..."
                      onChange={(content) => setData('details', content)}
                      showToolbar={true}
                      className="min-h-[200px]"
                      initialValue={data.details}
                    />
                    {errors.details && (
                      <p className="text-danger text-sm mt-1">{errors.details}</p>
                    )}
                  </div>

                  {/* File Attachments */}
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
                      onChange={handleFileChange}
                      className="hidden"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-sm border-default-200 text-default-700 hover:bg-default-50"
                      disabled={processing || attachments.length >= 5}
                    >
                      <Upload className="size-4 mr-2" />
                      Attach Files
                    </button>
                    {attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 rounded-lg border border-default-200 bg-default-50">
                            <div className="flex-shrink-0 text-default-500">
                              <FileText className="size-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-default-900 truncate">{file.name}</p>
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
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-4 pt-4 border-t border-default-200">
                    <Link
                      href="/contact/tickets"
                      className="btn border-default-200 text-default-700"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={processing || isSubmitting}
                      className="btn bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                      {processing || isSubmitting ? (
                        <>
                          <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="size-4" />
                          Submit Ticket
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </PublicLayout>
    </>
  );
}
