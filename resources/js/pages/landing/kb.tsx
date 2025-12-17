import { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { Search, BookOpen, Calendar, ChevronRight, Tag } from 'lucide-react';
import PageMeta from '@/components/PageMeta';
import { LandingNav, LandingFooter } from '@/components/landing';

type TypeOption = {
  id: number;
  name: string;
};

type KbItem = {
  id: number;
  title: string;
  type: string;
  typeId: number;
  details: string;
  created_at: string;
  updated_at: string;
};

type KbPageProps = {
  title: string;
  kb: {
    data: KbItem[];
    current_page: number;
    last_page: number;
    total: number;
  };
  types: TypeOption[];
  filters?: {
    search?: string;
  };
  footer?: any;
};

export default function KnowledgeBase({ title, kb, types = [], filters, footer }: KbPageProps) {
  const [searchQuery, setSearchQuery] = useState(filters?.search || '');
  const [selectedType, setSelectedType] = useState<number | null>(null);

  const kbData = kb?.data || [];

  const filteredKb = useMemo(() => {
    let items = kbData;
    
    if (selectedType !== null) {
      items = items.filter(item => item.typeId === selectedType);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        item => 
          item.title.toLowerCase().includes(query) || 
          item.details.toLowerCase().includes(query)
      );
    }
    
    return items;
  }, [kbData, searchQuery, selectedType]);

  const truncateText = (text: string, maxLength: number = 150) => {
    const stripped = text.replace(/<[^>]*>/g, '');
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength) + '...';
  };

  return (
    <>
      <PageMeta title={title || 'Knowledge Base'} />
      <LandingNav currentPage="kb" />
      
      <div className="min-h-screen bg-default-50 pt-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent py-16 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/10 mb-6">
              <BookOpen className="size-8 text-primary" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-default-900 mb-4">
              Knowledge Base
            </h1>
            <p className="text-lg text-default-600 max-w-2xl mx-auto">
              Browse our collection of articles, guides, and tutorials to help you get the most out of our services.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="bg-card rounded-xl shadow-lg border border-default-200 p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-default-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input w-full pl-10"
                />
              </div>
              {types.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setSelectedType(null)}
                    className={`btn btn-sm ${
                      selectedType === null 
                        ? 'bg-primary text-white' 
                        : 'border-default-200 text-default-700 hover:bg-default-50'
                    }`}
                  >
                    All
                  </button>
                  {types.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`btn btn-sm ${
                        selectedType === type.id 
                          ? 'bg-primary text-white' 
                          : 'border-default-200 text-default-700 hover:bg-default-50'
                      }`}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {filteredKb.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center size-16 rounded-full bg-default-100 mb-4">
                <BookOpen className="size-8 text-default-400" />
              </div>
              <h3 className="text-lg font-medium text-default-900 mb-2">No articles found</h3>
              <p className="text-default-500">
                {searchQuery || selectedType ? 'Try adjusting your search or filter.' : 'No knowledge base articles available yet.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredKb.map((article) => (
                  <Link
                    key={article.id}
                    href={`/kb/${article.id}`}
                    className="group bg-card rounded-xl border border-default-200 overflow-hidden transition-all hover:shadow-lg hover:border-primary/30"
                  >
                    <div className="p-6">
                      {article.type && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <Tag className="size-3.5 text-primary" />
                          <span className="text-xs font-medium text-primary">{article.type}</span>
                        </div>
                      )}
                      <h3 className="font-semibold text-default-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-default-500 mb-4 line-clamp-3">
                        {truncateText(article.details)}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-default-400">
                          <Calendar className="size-3.5" />
                          {article.created_at}
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          Read more <ChevronRight className="size-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Results count */}
              <p className="text-center text-sm text-default-500 mt-8">
                Showing {filteredKb.length} of {kbData.length} articles
              </p>
            </>
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-xl font-semibold text-default-900 mb-2">
              Can't find what you're looking for?
            </h2>
            <p className="text-default-600 mb-6">
              Check our FAQ section or contact our support team for personalized assistance.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/faq" className="btn border-default-200 text-default-700 hover:bg-default-50">
                Browse FAQs
              </Link>
              <Link href="/contact" className="btn bg-primary text-white">
                Contact Support
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <LandingFooter footerData={footer} />
      </div>
    </>
  );
}

