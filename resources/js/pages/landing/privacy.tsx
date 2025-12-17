import PageMeta from '@/components/PageMeta';
import { LandingNav, LandingFooter } from '@/components/landing';

type PageData = {
  title?: string;
  content?: string;
};

type PrivacyPageProps = {
  title: string;
  data: {
    id: number;
    title: string;
    slug: string;
    is_active: boolean;
    html: PageData | null;
  } | null;
  footer?: any;
};

export default function Privacy({ title, data: pageInfo, footer }: PrivacyPageProps) {
  const pageData = pageInfo?.html || {};

  return (
    <>
      <PageMeta title={title || 'Privacy Policy'} />
      
      <div className="min-h-screen bg-default-50">
        {/* Navigation */}
        <LandingNav currentPage="/privacy" />

        {/* Hero Section */}
        <section className="pt-32 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-default-900 mb-4">
              {pageData.title || 'Privacy Policy'}
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
                  <p className="text-default-500">No privacy policy content available.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12">
          <LandingFooter footerData={footer} />
        </div>
      </div>
    </>
  );
}

