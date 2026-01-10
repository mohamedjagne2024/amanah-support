import { useForm, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
  FileText,
  MapPin,
  Phone,
  Mail,
  Link as LinkIcon,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageMeta from '@/components/PageMeta';
import { useLanguageContext } from '@/context/useLanguageContext';

type PageData = {
  description: string;
  email: string;
  phone: string;
  address: string;
  company_name: string;
  copyright_text: string;
  social: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
  };
};

type FooterPageProps = {
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
  description: '',
  email: '',
  phone: '',
  address: '',
  company_name: '',
  copyright_text: '',
  social: {
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
  },
};

export default function Footer({ title, page }: FooterPageProps) {
  const { t } = useLanguageContext();
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
    description: initialData.description || defaultPageData.description,
    email: initialData.email || defaultPageData.email,
    phone: initialData.phone || defaultPageData.phone,
    address: initialData.address || defaultPageData.address,
    company_name: initialData.company_name || defaultPageData.company_name,
    copyright_text: initialData.copyright_text || defaultPageData.copyright_text,
    social: initialData.social || defaultPageData.social,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    router.put('/front_pages/footer', {
      title: 'Footer Settings',
      slug: 'footer',
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
      <PageMeta title={t('frontPages.footer.title')} />
      <main className="pb-24">
        <form onSubmit={handleSubmit}>
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-default-900">{t('frontPages.footer.title')}</h1>
            <p className="text-default-500 mt-1">{t('frontPages.footer.subtitle')}</p>
          </div>

          <div className="space-y-6 max-w-5xl">
            {/* General Section */}
            <div className="card">
              <div className="card-header flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="size-5 text-primary" />
                </div>
                <div>
                  <h6 className="card-title">{t('frontPages.footer.generalSection')}</h6>
                  <p className="text-sm text-default-500">{t('frontPages.footer.generalDescription')}</p>
                </div>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">{t('frontPages.footer.companyName')}</label>
                  <input
                    type="text"
                    value={data.company_name}
                    onChange={(e) => setData('company_name', e.target.value)}
                    placeholder="Amanah Support"
                    className="form-input"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">{t('frontPages.footer.description')}</label>
                  <textarea
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Professional support desk solution for your business needs."
                    className="form-input min-h-[100px]"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-default-500 mt-1">{t('frontPages.footer.descriptionHint')}</p>
                </div>
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">{t('frontPages.footer.copyrightText')}</label>
                  <input
                    type="text"
                    value={data.copyright_text}
                    onChange={(e) => setData('copyright_text', e.target.value)}
                    placeholder="All rights reserved."
                    className="form-input"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-default-500 mt-1">Will be displayed as: © {new Date().getFullYear()} {data.company_name || 'Company'}. {data.copyright_text || 'All rights reserved.'}</p>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="card">
              <div className="card-header flex items-center gap-3">
                <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Phone className="size-5 text-emerald-500" />
                </div>
                <div>
                  <h6 className="card-title">{t('frontPages.footer.contactSection')}</h6>
                  <p className="text-sm text-default-500">{t('frontPages.footer.contactDescription')}</p>
                </div>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      <span className="flex items-center gap-2">
                        <Mail className="size-4" /> {t('frontPages.footer.emailAddress')}
                      </span>
                    </label>
                    <input
                      type="email"
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                      placeholder="contact@company.com"
                      className="form-input"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      <span className="flex items-center gap-2">
                        <Phone className="size-4" /> {t('frontPages.footer.phoneNumber')}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={data.phone}
                      onChange={(e) => setData('phone', e.target.value)}
                      placeholder="+1 234 567 890"
                      className="form-input"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    <span className="flex items-center gap-2">
                      <MapPin className="size-4" /> {t('frontPages.footer.address')}
                    </span>
                  </label>
                  <textarea
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                    placeholder="123 Business Street, City, Country"
                    className="form-input min-h-[80px]"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Social Media Section */}
            <div className="card">
              <div className="card-header flex items-center gap-3">
                <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <LinkIcon className="size-5 text-blue-500" />
                </div>
                <div>
                  <h6 className="card-title">{t('frontPages.footer.socialSection')}</h6>
                  <p className="text-sm text-default-500">{t('frontPages.footer.socialDescription')}</p>
                </div>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      <span className="flex items-center gap-2">
                        <Facebook className="size-4" /> {t('frontPages.footer.facebook')}
                      </span>
                    </label>
                    <input
                      type="url"
                      value={data.social.facebook}
                      onChange={(e) => setData('social', { ...data.social, facebook: e.target.value })}
                      placeholder="https://facebook.com/yourpage"
                      className="form-input"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      <span className="flex items-center gap-2">
                        <Twitter className="size-4" /> {t('frontPages.footer.twitter')}
                      </span>
                    </label>
                    <input
                      type="url"
                      value={data.social.twitter}
                      onChange={(e) => setData('social', { ...data.social, twitter: e.target.value })}
                      placeholder="https://twitter.com/yourhandle"
                      className="form-input"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      <span className="flex items-center gap-2">
                        <Instagram className="size-4" /> {t('frontPages.footer.instagram')}
                      </span>
                    </label>
                    <input
                      type="url"
                      value={data.social.instagram}
                      onChange={(e) => setData('social', { ...data.social, instagram: e.target.value })}
                      placeholder="https://instagram.com/yourprofile"
                      className="form-input"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      <span className="flex items-center gap-2">
                        <Linkedin className="size-4" /> {t('frontPages.footer.linkedin')}
                      </span>
                    </label>
                    <input
                      type="url"
                      value={data.social.linkedin}
                      onChange={(e) => setData('social', { ...data.social, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/company/yourcompany"
                      className="form-input"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 max-w-5xl">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <p className="text-sm text-default-500">
                {t('frontPages.changesSavedMessage')}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn border-default-200 text-default-700"
                  disabled={isSubmitting}
                >
                  {t('frontPages.reset')}
                </button>
                <button
                  type="submit"
                  className="btn bg-primary text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="inline-block border-2 border-white rounded-full size-4 animate-spin border-s-transparent" />
                      {t('frontPages.saving')}
                    </span>
                  ) : (
                    t('frontPages.saveChanges')
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </AppLayout>
  );
}
