import { router, useForm } from "@inertiajs/react";
import { useState, useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import PageHeader from "@/components/Pageheader";
import PageMeta from "@/components/PageMeta";
import { Mail, Eye, Code2, ArrowLeft } from "lucide-react";

type EmailTemplate = {
  id: number;
  name: string;
  details: string;
  slug: string;
  language: string;
  html: string;
};

type EditPageProps = {
  template: EmailTemplate;
};

export default function Edit({ template }: EditPageProps) {
  const { data, setData, put, processing, errors } = useForm({
    name: template.name,
    html: template.html,
  });

  const [previewHtml, setPreviewHtml] = useState(template.html);

  useEffect(() => {
    // Update preview when HTML changes
    setPreviewHtml(data.html);
  }, [data.html]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/settings/templates/${template.id}`, {
      preserveScroll: true,
    });
  };

  return (
    <AppLayout>
      <PageMeta title={`Edit Template - ${template.name}`} />
      <main>
        <PageHeader 
          title={`Edit: ${template.name}`}
          subtitle={template.details}
          icon={Mail}
        />

        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-end">

            <div className="flex items-center gap-2">
              <div className="text-sm text-default-500">
                Slug: <span className="font-mono bg-default-100 px-2 py-1 rounded">{template.slug}</span>
              </div>
              <button
                type="submit"
                form="template-form"
                disabled={processing}
                className="btn bg-primary text-white hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed btn-sm"
              >
                {processing ? (
                  <span className="inline-flex items-center gap-2">
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Template'
                )}
              </button>
            </div>
          </div>

          {/* Split View Editor */}
          <form id="template-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Editable Fields */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-default-50 rounded-lg border border-default-200 overflow-hidden">
                  <div className="bg-default-100 border-b border-default-200 px-4 py-3 flex items-center gap-2">
                    <Code2 className="size-4 text-default-600" />
                    <h3 className="font-semibold text-default-900">Template Editor</h3>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {/* Name Field */}
                    <div>
                      <label className="block font-medium text-default-900 text-sm mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        disabled={processing}
                        className={`form-input w-full ${errors.name ? 'border-danger focus:ring-danger' : ''}`}
                      />
                      {errors.name && (
                        <p className="text-danger text-sm mt-1">{errors.name}</p>
                      )}
                      <p className="text-default-500 text-xs mt-1">
                        A new comment has been added on a ticket
                      </p>
                    </div>

                    {/* Email HTML Field */}
                    <div className="flex-1 flex flex-col">
                      <label className="block font-medium text-default-900 text-sm mb-2">
                        Email Html
                      </label>
                      <textarea
                        value={data.html}
                        onChange={(e) => setData("html", e.target.value)}
                        disabled={processing}
                        rows={20}
                        className={`form-input w-full font-mono text-sm resize-none ${errors.html ? 'border-danger focus:ring-danger' : ''}`}
                        placeholder="Enter HTML template..."
                      />
                      {errors.html && (
                        <p className="text-danger text-sm mt-1">{errors.html}</p>
                      )}
                      <p className="text-default-500 text-xs mt-1">
                        Edit the HTML template. Changes will be reflected in the preview.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Live Preview */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-default-50 rounded-lg border border-default-200 overflow-hidden sticky top-4">
                  <div className="bg-default-100 border-b border-default-200 px-4 py-3 flex items-center gap-2">
                    <Eye className="size-4 text-default-600" />
                    <h3 className="font-semibold text-default-900">Details</h3>
                  </div>
                  
                  <div className="p-4">
                    <div className="text-sm text-default-600 mb-3">
                      {template.details}
                    </div>
                    
                    {/* Live HTML Preview */}
                    <div className="border border-default-200 rounded-lg overflow-hidden">
                      <div className="bg-default-50 px-3 py-2 border-b border-default-200">
                        <span className="text-xs font-medium text-default-600">Live Preview</span>
                      </div>
                      <div 
                        className="p-4 bg-white overflow-auto max-h-[600px]"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Help Section */}
          <div className="bg-info-50 border border-info-200 rounded-lg p-4">
            <h4 className="font-semibold text-info-900 mb-2">Template Variables</h4>
            <div className="text-info-700 text-sm space-y-1">
              <p>You can use the following variables in your template:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li><code className="bg-info-100 px-1 rounded">{'{{ticket_number}}'}</code> - The ticket number</li>
                <li><code className="bg-info-100 px-1 rounded">{'{{user_name}}'}</code> - The user's name</li>
                <li><code className="bg-info-100 px-1 rounded">{'{{ticket_title}}'}</code> - The ticket title</li>
                <li><code className="bg-info-100 px-1 rounded">{'{{comment_content}}'}</code> - The comment content</li>
                <li><code className="bg-info-100 px-1 rounded">{'{{link}}'}</code> - Link to view the ticket</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
