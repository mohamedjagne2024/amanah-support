import { useMemo } from 'react';
import PageMeta from '@/components/PageMeta';
import PublicLayout from '@/layouts/public-layout';
import { useLanguageContext } from '@/context/useLanguageContext';

type PageData = {
  title?: string;
  content?: string;
};

type TermsPageProps = {
  title: string;
  data: {
    id: number;
    title: string;
    slug: string;
    is_active: boolean;
    html: PageData | string | null;
  } | null;
  footer?: any;
};

export default function Terms({ title, data: pageInfo, footer }: TermsPageProps) {
  const { t } = useLanguageContext();

  const pageData = useMemo(() => {
    if (!pageInfo?.html) return {};
    try {
      return typeof pageInfo.html === 'string' ? JSON.parse(pageInfo.html) : pageInfo.html;
    } catch (e) {
      console.error('Error parsing page data:', e);
      return {};
    }
  }, [pageInfo?.html]);

  return (
    <>
      <PageMeta title={title || t('landing.terms.defaultTitle')} />

      <PublicLayout currentPage="/terms" footer={footer}>
        {/* Hero Section */}
        <section className="pt-32 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-default-900 mb-4">
              {pageData.title || t('landing.terms.defaultTitle')}
            </h1>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="card">
              <div className="card-body prose prose-default max-w-none">
                {pageData.content ? (
                  <div dangerouslySetInnerHTML={{ __html: pageData.content }} />
                ) : (
                  <p className="text-default-500">{t('landing.terms.noContent')}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </PublicLayout>
    </>
  );
}
