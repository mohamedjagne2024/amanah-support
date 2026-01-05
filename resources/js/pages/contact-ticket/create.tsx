import { useForm } from "@inertiajs/react";
import { FormEvent, useRef, useState } from "react";
import PublicLayout from "@/layouts/public-layout";
import PageMeta from "@/components/PageMeta";
import { Send, Upload, X, FileText } from "lucide-react";
import { Link } from "@inertiajs/react";
import TextEditor from "@/components/TextEditor";
import Breadcrumb from "@/components/Breadcrumb";

type PageProps = {
  title: string;
  footer?: any;
  regions: Array<{ id: number; name: string }>;
  types: Array<{ id: number; name: string }>;
};

export default function CreateContactTicket({ 
  title, 
  footer,
  regions = [],
  types = [],
}: PageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    phone: '',
    member_number: '',
    type_id: '',
    region_id: '',
    subject: '',
    details: '',
    files: [] as File[],
  });


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
                  {/* Name & Email Fields */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block font-medium text-default-900 text-sm mb-2">
                        Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="John Doe"
                        className={`form-input ${
                          errors.name ? 'border-danger focus:border-danger focus:ring-danger' : ''
                        }`}
                        disabled={processing}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-danger">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block font-medium text-default-900 text-sm mb-2">
                        Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="john@example.com"
                        className={`form-input ${
                          errors.email ? 'border-danger focus:border-danger focus:ring-danger' : ''
                        }`}
                        disabled={processing}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-danger">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Phone & Member Number Fields */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block font-medium text-default-900 text-sm mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className={`form-input ${
                          errors.phone ? 'border-danger focus:border-danger focus:ring-danger' : ''
                        }`}
                        disabled={processing}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-danger">{errors.phone}</p>
                      )}
                    </div>
                    <div>
                      <label className="block font-medium text-default-900 text-sm mb-2">
                        Member Number
                      </label>
                      <input
                        type="text"
                        value={data.member_number}
                        onChange={(e) => setData('member_number', e.target.value)}
                        placeholder="MEM-12345"
                        className={`form-input ${
                          errors.member_number ? 'border-danger focus:border-danger focus:ring-danger' : ''
                        }`}
                        disabled={processing}
                      />
                      {errors.member_number && (
                        <p className="mt-1 text-sm text-danger">{errors.member_number}</p>
                      )}
                    </div>
                  </div>

                  {/* Type & Region Fields */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block font-medium text-default-900 text-sm mb-2">
                        Ticket Type
                      </label>
                      <select
                        value={data.type_id}
                        onChange={(e) => setData('type_id', e.target.value)}
                        className={`form-input ${
                          errors.type_id ? 'border-danger focus:border-danger focus:ring-danger' : ''
                        }`}
                        disabled={processing}
                      >
                        <option value="">Select ticket type...</option>
                        {types.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      {errors.type_id && (
                        <p className="mt-1 text-sm text-danger">{errors.type_id}</p>
                      )}
                    </div>
                    <div>
                      <label className="block font-medium text-default-900 text-sm mb-2">
                        Region
                      </label>
                      <select
                        value={data.region_id}
                        onChange={(e) => setData('region_id', e.target.value)}
                        className={`form-input ${
                          errors.region_id ? 'border-danger focus:border-danger focus:ring-danger' : ''
                        }`}
                        disabled={processing}
                      >
                        <option value="">Select region...</option>
                        {regions.map((region) => (
                          <option key={region.id} value={region.id}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                      {errors.region_id && (
                        <p className="mt-1 text-sm text-danger">{errors.region_id}</p>
                      )}
                    </div>
                  </div>

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


                  {/* Details Field */}
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Description <span className="text-danger">*</span>
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
                      Attach Files (Optional)
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
