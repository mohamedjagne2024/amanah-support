import { useForm, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageMeta from '@/components/PageMeta';
import TextEditor from '@/components/TextEditor';

type PageData = {
  title: string;
  content: string;
};

type TermsPageProps = {
  title: string;
  page: {
    id: number;
    title: string;
    slug: string;
    is_active: boolean;
    html: PageData | string | null;
  } | null;
};

const defaultPageData: PageData = {
  title: '',
  content: '',
};

export default function Terms({ title, page }: TermsPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialData = useMemo(() => {
    if (!page?.html) return defaultPageData;
    try {
      return typeof page.html === 'string' ? JSON.parse(page.html) : page.html;
    } catch (e) {
      console.error('Error parsing page data:', e);
      return defaultPageData;
    }
  }, [page?.html]);

  const { data, setData, processing } = useForm<PageData>({
    title: initialData.title || defaultPageData.title,
    content: initialData.content || defaultPageData.content,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    router.put('/front_pages/terms', {
      title: data.title,
      slug: 'terms',
      html: data,
    }, {
      onFinish: () => setIsSubmitting(false),
    });
  };

  const handleReset = () => {
    setData(defaultPageData);
  };

  return (
    <AppLayout>
      <PageMeta title="Terms of Service Settings" />
      <main className="pb-24">
        <form onSubmit={handleSubmit}>
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-default-900">Terms of Service Settings</h1>
            <p className="text-default-500 mt-1">Configure your terms of service page content</p>
          </div>

          <div className="space-y-6 max-w-5xl">
            {/* Content Section */}
            <div className="card">
              <div className="card-header flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="size-5 text-primary" />
                </div>
                <div>
                  <h6 className="card-title">Page Content</h6>
                  <p className="text-sm text-default-500">Terms of service title and content</p>
                </div>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">Page Title</label>
                  <input
                    type="text"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="Terms of Service"
                    className="form-input"
                    disabled={processing || isSubmitting}
                  />
                </div>
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">Page Content</label>
                  <TextEditor
                    placeholder="Enter your terms of service content..."
                    onChange={(content) => setData('content', content)}
                    showToolbar={true}
                    className="min-h-[400px]"
                    initialValue={data.content}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 max-w-5xl">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="btn border-default-200 text-default-700"
                disabled={isSubmitting}
              >
                Reset
              </button>
              <button
                type="submit"
                className="btn bg-primary text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
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
        </form>
      </main>
    </AppLayout>
  );
}

