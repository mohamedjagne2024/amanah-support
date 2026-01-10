import { Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Tag, BookOpen, ChevronRight } from 'lucide-react';
import PageMeta from '@/components/PageMeta';
import PublicLayout from '@/layouts/public-layout';
import { useLanguageContext } from '@/context/useLanguageContext';

type TypeOption = {
  id: number;
  name: string;
};

type KbItem = {
  id: number;
  title: string;
  details: string;
  updated_at: string;
  created_at?: string;
};

type KbDetailsProps = {
  title: string;
  kb: {
    id: number;
    title: string;
    type: string;
    typeId: number;
    details: string;
    created_at: string;
    updated_at: string;
  };
  types: TypeOption[];
  random_kb: KbItem[];
  footer?: any;
};

export default function KbDetails({ title, kb, types = [], random_kb = [], footer }: KbDetailsProps) {
  const { t } = useLanguageContext();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    const stripped = text.replace(/<[^>]*>/g, '');
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength) + '...';
  };

  return (
    <>
      <PageMeta title={title} />

      <PublicLayout currentPage="kb" footer={footer} className="pt-16">
        {/* Breadcrumb */}
        <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-default-500">
              <Link href="/" className="hover:text-primary transition-colors">{t('landing.kbDetails.home')}</Link>
              <ChevronRight className="size-4" />
              <Link href="/kb" className="hover:text-primary transition-colors">{t('landing.kbDetails.knowledgeBase')}</Link>
              <ChevronRight className="size-4" />
              <span className="text-default-700 truncate max-w-[200px]">{kb.title}</span>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Article Content */}
            <div className="lg:col-span-2">
              <article className="bg-card rounded-xl border border-default-200 overflow-hidden">
                <div className="p-6 lg:p-8">
                  {/* Article Header */}
                  <div className="mb-6">
                    {kb.type && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <Tag className="size-4 text-primary" />
                        <span className="text-sm font-medium text-primary">{kb.type}</span>
                      </div>
                    )}
                    <h1 className="text-2xl lg:text-3xl font-bold text-default-900 mb-4">
                      {kb.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-default-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="size-4" />
                        {formatDate(kb.created_at)}
                      </span>
                      {kb.updated_at !== kb.created_at && (
                        <span className="text-default-400">
                          {t('landing.kbDetails.updated')}: {formatDate(kb.updated_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Article Body */}
                  <div
                    className="prose prose-lg max-w-none text-default-700
                      prose-headings:text-default-900 
                      prose-p:text-default-600 
                      prose-strong:text-default-800
                      prose-ul:text-default-600
                      prose-ol:text-default-600
                      prose-li:text-default-600
                      prose-a:text-primary hover:prose-a:text-primary/80
                      prose-table:text-default-600
                      prose-th:text-default-800 prose-th:bg-default-50
                      prose-td:border-default-200
                      prose-img:rounded-lg"
                    dangerouslySetInnerHTML={{ __html: kb.details }}
                  />
                </div>
              </article>

              {/* Back Link */}
              <div className="mt-6">
                <Link
                  href="/kb"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  <ArrowLeft className="size-4" />
                  {t('landing.kbDetails.backToKnowledgeBase')}
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">

              {/* Related Articles */}
              {random_kb.length > 0 && (
                <div className="bg-card rounded-xl border border-default-200 p-5">
                  <h3 className="font-semibold text-default-900 mb-4 flex items-center gap-2">
                    <BookOpen className="size-4 text-primary" />
                    {t('landing.kbDetails.relatedArticles')}
                  </h3>
                  <div className="space-y-3">
                    {random_kb.map((article) => (
                      <Link
                        key={article.id}
                        href={`/kb/${article.id}`}
                        className="block group"
                      >
                        <h4 className="font-medium text-default-800 group-hover:text-primary transition-colors line-clamp-2 text-sm">
                          {article.title}
                        </h4>
                        <p className="text-xs text-default-500 mt-1 line-clamp-2">
                          {truncateText(article.details, 80)}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Help CTA */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-5 text-center">
                <h3 className="font-semibold text-default-900 mb-2">{t('landing.kbDetails.needMoreHelp')}</h3>
                <p className="text-sm text-default-600 mb-4">
                  {t('landing.kbDetails.cantFindLooking')}
                </p>
                <Link
                  href="/contact"
                  className="btn bg-primary text-white w-full"
                >
                  {t('landing.kbDetails.contactSupport')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </PublicLayout>
    </>
  );
}
