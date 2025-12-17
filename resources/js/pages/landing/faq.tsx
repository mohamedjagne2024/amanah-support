import { useState, useMemo } from 'react';
import { ChevronDown, Search, HelpCircle } from 'lucide-react';
import PageMeta from '@/components/PageMeta';
import { LandingNav, LandingFooter } from '@/components/landing';

type FaqItem = {
  id: number;
  name: string;
  details: string;
  active: boolean;
};

type FaqPageProps = {
  title: string;
  faqs: {
    data: FaqItem[];
  };
  filters?: {
    search?: string;
  };
  footer?: any;
};

export default function Faq({ title, faqs, filters, footer }: FaqPageProps) {
  const [searchQuery, setSearchQuery] = useState(filters?.search || '');
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const faqData = faqs?.data || [];

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqData;
    const query = searchQuery.toLowerCase();
    return faqData.filter(
      faq => 
        faq.name.toLowerCase().includes(query) || 
        faq.details.toLowerCase().includes(query)
    );
  }, [faqData, searchQuery]);

  const toggleItem = (id: number) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setOpenItems(new Set(filteredFaqs.map(faq => faq.id)));
  };

  const collapseAll = () => {
    setOpenItems(new Set());
  };

  return (
    <>
      <PageMeta title={title || 'FAQ'} />
      <LandingNav currentPage="faq" />
      
      <div className="min-h-screen bg-default-50 pt-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/10 mb-6">
              <HelpCircle className="size-8 text-primary" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-default-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-default-600 max-w-2xl mx-auto">
              Find answers to common questions about our services and support.
            </p>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="bg-card rounded-xl shadow-lg border border-default-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-default-400" />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input w-full pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={expandAll}
                  className="btn btn-sm border-default-200 text-default-700 hover:bg-default-50"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="btn btn-sm border-default-200 text-default-700 hover:bg-default-50"
                >
                  Collapse All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center size-16 rounded-full bg-default-100 mb-4">
                <HelpCircle className="size-8 text-default-400" />
              </div>
              <h3 className="text-lg font-medium text-default-900 mb-2">No FAQs found</h3>
              <p className="text-default-500">
                {searchQuery ? 'Try adjusting your search terms.' : 'No frequently asked questions available yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-card rounded-xl border border-default-200 overflow-hidden transition-shadow hover:shadow-md"
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <span className="font-medium text-default-900 pr-4">{faq.name}</span>
                    <ChevronDown 
                      className={`size-5 text-default-500 flex-shrink-0 transition-transform duration-200 ${
                        openItems.has(faq.id) ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                  
                  <div 
                    className={`overflow-hidden transition-all duration-200 ${
                      openItems.has(faq.id) ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 pb-4 border-t border-default-100 pt-4">
                      <div 
                        className="prose prose-sm max-w-none text-default-600"
                        dangerouslySetInnerHTML={{ __html: faq.details }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results count */}
          {filteredFaqs.length > 0 && (
            <p className="text-center text-sm text-default-500 mt-8">
              Showing {filteredFaqs.length} of {faqData.length} FAQs
            </p>
          )}
        </div>

        {/* Contact CTA */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-xl font-semibold text-default-900 mb-2">
              Still have questions?
            </h2>
            <p className="text-default-600 mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <a href="/contact" className="btn bg-primary text-white">
              Contact Support
            </a>
          </div>
        </div>

        {/* Footer */}
        <LandingFooter footerData={footer} />
      </div>
    </>
  );
}

