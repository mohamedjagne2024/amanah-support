import { useForm, usePage } from '@inertiajs/react';
import { useMemo, useRef, useState } from 'react';
import {
  Ticket,
  MessageCircle,
  Mail,
  CheckCircle,
  Users,
  Clock,
  Star,
  Shield,
  Settings,
  Home as HomeIcon,
  ChevronRight,
  Upload,
  X,
  FileText,
} from 'lucide-react';
import PageMeta from '@/components/PageMeta';
import Combobox, { SelectOption } from '@/components/Combobox';
import TextEditor from '@/components/TextEditor';
import PublicLayout from '@/layouts/public-layout';
import type { SharedData } from '@/types';

type HeroButton = {
  text: string;
  link: string;
  new_tab: boolean;
};

type FeatureItem = {
  icon: string;
  title: string;
  description: string;
};

type StatItem = {
  label: string;
  value: string;
  icon: string;
};

type TestimonialItem = {
  name: string;
  company: string;
  content: string;
  rating: number;
};

type PageData = {
  settings?: {
    badge_text?: string;
    section_title?: string;
    section_subtitle?: string;
    form_header_title?: string;
    form_header_subtitle?: string;
    submit_button_label?: string;
    enable_ticket_section?: boolean;
  };
  hero?: {
    enabled?: boolean;
    title?: string;
    description?: string;
    badge_text?: string;
    trust_indicators?: string[];
    buttons?: HeroButton[];
    image?: string;
  };
  features?: {
    enabled?: boolean;
    tagline?: string;
    title?: string;
    description?: string;
    items?: FeatureItem[];
  };
  stats?: {
    enabled?: boolean;
    tagline?: string;
    title?: string;
    description?: string;
    items?: StatItem[];
  };
  testimonials?: {
    enabled?: boolean;
    tagline?: string;
    title?: string;
    description?: string;
    items?: TestimonialItem[];
  };
};



type CustomField = {
  id: number;
  name: string;
  label: string;
  type: string;
  options?: string;
  required?: boolean;
};

type HomePageProps = {
  title: string;
  page: {
    id: number;
    title: string;
    slug: string;
    is_active: boolean;
    html: PageData | string | null;
  } | null;
  regions: Array<{ id: number; name: string }>;
  types: Array<{ id: number; name: string }>;
  custom_fields: CustomField[];
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ticket: Ticket,
  chat: MessageCircle,
  email: Mail,
  tick: CheckCircle,
  users: Users,
  clock: Clock,
  star: Star,
  shield: Shield,
  settings: Settings,
  home: HomeIcon,
};

const getIcon = (iconName: string) => {
  return iconMap[iconName] || CheckCircle;
};

export default function Home({
  title,
  page,
  regions = [],
  types = [],
  custom_fields = [],
  footer,
}: HomePageProps & { footer?: any }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const { auth } = usePage<SharedData>().props;

  const isLoggedIn = !!auth?.user;

  const pageData = useMemo(() => {
    if (!page?.html) return {};
    try {
      return typeof page.html === 'string' ? JSON.parse(page.html) : page.html;
    } catch (e) {
      console.error('Error parsing page data:', e);
      return {};
    }
  }, [page?.html]);

  const hero = pageData.hero || {};
  const features = pageData.features || {};
  const stats = pageData.stats || {};
  const testimonials = pageData.testimonials || {};
  const settings = pageData.settings || {};

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/ticket/store', {
      forceFormData: true,
      onSuccess: () => {
        reset();
        setAttachments([]);
      },
    });
  };


  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`size-4 ${i < rating ? 'text-warning fill-warning' : 'text-default-300'}`}
      />
    ));
  };

  return (
    <>
      <PageMeta title={title} />

      <PublicLayout currentPage="/" footer={footer}>

        {/* Hero Section */}
        {hero.enabled !== false && (
          <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  {hero.badge_text && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      <Star className="size-4 fill-primary" />
                      {hero.badge_text}
                    </div>
                  )}

                  <h1
                    className="text-4xl sm:text-5xl lg:text-6xl font-bold text-default-900 leading-tight [&>span]:text-primary"
                    dangerouslySetInnerHTML={{ __html: hero.title || 'Welcome to Amanah Support' }}
                  />

                  {hero.description && (
                    <div
                      className="text-lg text-default-600 leading-relaxed max-w-xl"
                      dangerouslySetInnerHTML={{ __html: hero.description }}
                    />
                  )}

                  {/* Trust Indicators */}
                  {hero.trust_indicators && hero.trust_indicators.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                      {hero.trust_indicators.map((indicator, index) => (
                        <div key={index} className="flex items-center gap-2 text-default-600">
                          <CheckCircle className="size-5 text-success" />
                          <span className="text-sm font-medium">{indicator}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA Buttons */}
                  {hero.buttons && hero.buttons.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                      {hero.buttons.map((button, index) => (
                        <a
                          key={index}
                          href={button.link}
                          target={button.new_tab ? '_blank' : undefined}
                          rel={button.new_tab ? 'noopener noreferrer' : undefined}
                          className={`btn ${index === 0
                              ? 'bg-primary text-white'
                              : 'border-default-200 text-default-900'
                            }`}
                        >
                          {button.text}
                          {index === 0 && <ChevronRight className="size-5 ml-1" />}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hero Image */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-info/20 rounded-3xl blur-3xl transform -rotate-6" />
                  {hero.image ? (
                    <img
                      src={hero.image}
                      alt="Amanah Support Dashboard"
                      className="relative rounded-2xl shadow-2xl border border-default-200/50"
                    />
                  ) : (
                    <div className="relative aspect-video rounded-2xl bg-gradient-to-br from-default-100 to-default-200 flex items-center justify-center">
                      <Ticket className="size-20 text-default-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        {features.enabled !== false && features.items && features.items.length > 0 && (
          <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                {features.tagline && (
                  <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold uppercase tracking-wider mb-4">
                    {features.tagline}
                  </span>
                )}
                <h2 className="text-3xl sm:text-4xl font-bold text-default-900 mb-4">
                  {features.title || 'How It Works'}
                </h2>
                {features.description && (
                  <p className="text-lg text-default-600 max-w-2xl mx-auto">
                    {features.description}
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.items.map((feature, index) => {
                  const Icon = getIcon(feature.icon);
                  return (
                    <div
                      key={index}
                      className="card group relative overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      <div className="card-body">
                        <div className="absolute top-4 right-4 text-6xl font-bold text-default-100 group-hover:text-primary/10 transition-colors">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="relative">
                          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                            <Icon className="size-6 text-primary group-hover:text-white transition-colors" />
                          </div>
                          <h3 className="text-lg font-semibold text-default-900 mb-2">
                            {feature.title}
                          </h3>
                          <div
                            className="text-default-600 text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: feature.description }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Stats Section */}
        {stats.enabled !== false && stats.items && stats.items.length > 0 && (
          <section id="stats" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary to-primary/90">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                {stats.tagline && (
                  <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-semibold uppercase tracking-wider mb-4">
                    {stats.tagline}
                  </span>
                )}
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  {stats.title || 'Our Impact'}
                </h2>
                {stats.description && (
                  <p className="text-lg text-white/80 max-w-2xl mx-auto">
                    {stats.description}
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.items.map((stat, index) => {
                  const Icon = getIcon(stat.icon);
                  return (
                    <div
                      key={index}
                      className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300"
                    >
                      {stat.icon && (
                        <div className="size-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                          <Icon className="size-7 text-white" />
                        </div>
                      )}
                      <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                        {stat.value}
                      </div>
                      <div className="text-white/80 font-medium">
                        {stat.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Testimonials Section */}
        {testimonials.enabled !== false && testimonials.items && testimonials.items.length > 0 && (
          <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-default-50">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                {testimonials.tagline && (
                  <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold uppercase tracking-wider mb-4">
                    {testimonials.tagline}
                  </span>
                )}
                <h2 className="text-3xl sm:text-4xl font-bold text-default-900 mb-4">
                  {testimonials.title || 'What Our Customers Say'}
                </h2>
                {testimonials.description && (
                  <p className="text-lg text-default-600 max-w-2xl mx-auto">
                    {testimonials.description}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.items.map((testimonial, index) => (
                  <div
                    key={index}
                    className="card hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="card-body">
                      <div className="flex gap-1 mb-4">
                        {renderStars(testimonial.rating)}
                      </div>
                      <blockquote className="text-default-700 mb-6 leading-relaxed">
                        "{testimonial.content}"
                      </blockquote>
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {testimonial.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-default-900">{testimonial.name}</div>
                          <div className="text-sm text-default-500">{testimonial.company}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Ticket Submission Section */}
        {settings.enable_ticket_section && (
          <section id="submit-ticket" className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                {settings.badge_text && (
                  <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold uppercase tracking-wider mb-4">
                    {settings.badge_text}
                  </span>
                )}
                <h2 className="text-3xl sm:text-4xl font-bold text-default-900 mb-4">
                  {settings.form_header_title || 'Submit a Amanah Support Ticket'}
                </h2>
                {settings.form_header_subtitle && (
                  <div
                    className="text-lg text-default-600 max-w-2xl mx-auto"
                    dangerouslySetInnerHTML={{ __html: settings.form_header_subtitle }}
                  />
                )}
              </div>

              <div className="card">
                <div className="card-header">
                  <h6 className="card-title">Amanah Support Ticket Information</h6>
                  <p className="text-sm text-default-500 mt-1">
                    Fill in the details below to submit your support ticket. We'll get back to you as soon as possible.
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
                          className={`form-input ${errors.name ? 'border-danger' : ''}`}
                          placeholder="Mohamed Ahmed"
                          disabled={processing}
                        />
                        {errors.name && <p className="text-danger text-sm mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label className="block font-medium text-default-900 text-sm mb-2">
                          Email Address <span className="text-danger">*</span>
                        </label>
                        <input
                          type="email"
                          value={data.email}
                          onChange={(e) => setData('email', e.target.value)}
                          className={`form-input ${errors.email ? 'border-danger' : ''}`}
                          placeholder="mohamed@example.com"
                          disabled={processing}
                        />
                        {errors.email && <p className="text-danger text-sm mt-1">{errors.email}</p>}
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
                          className={`form-input ${errors.phone ? 'border-danger' : ''}`}
                          placeholder="+252 612345678"
                          disabled={processing}
                        />
                        {errors.phone && <p className="text-danger text-sm mt-1">{errors.phone}</p>}
                      </div>
                      <div>
                        <label className="block font-medium text-default-900 text-sm mb-2">
                          Member Number
                        </label>
                        <input
                          type="text"
                          value={data.member_number}
                          onChange={(e) => setData('member_number', e.target.value)}
                          className={`form-input ${errors.member_number ? 'border-danger' : ''}`}
                          placeholder="AMI-12345"
                          disabled={processing}
                        />
                        {errors.member_number && <p className="text-danger text-sm mt-1">{errors.member_number}</p>}
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
                          className={`form-input ${errors.type_id ? 'border-danger' : ''}`}
                          disabled={processing}
                        >
                          <option value="">Select ticket type...</option>
                          {types.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                        {errors.type_id && <p className="text-danger text-sm mt-1">{errors.type_id}</p>}
                      </div>
                      <div>
                        <label className="block font-medium text-default-900 text-sm mb-2">
                          Region
                        </label>
                        <select
                          value={data.region_id}
                          onChange={(e) => setData('region_id', e.target.value)}
                          className={`form-input ${errors.region_id ? 'border-danger' : ''}`}
                          disabled={processing}
                        >
                          <option value="">Select region...</option>
                          {regions.map((region) => (
                            <option key={region.id} value={region.id}>
                              {region.name}
                            </option>
                          ))}
                        </select>
                        {errors.region_id && <p className="text-danger text-sm mt-1">{errors.region_id}</p>}
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block font-medium text-default-900 text-sm mb-2">
                        Subject <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={data.subject}
                        onChange={(e) => setData('subject', e.target.value)}
                        className={`form-input ${errors.subject ? 'border-danger' : ''}`}
                        placeholder="Brief description of your issue"
                        disabled={processing}
                      />
                      {errors.subject && <p className="text-danger text-sm mt-1">{errors.subject}</p>}
                    </div>

                    {/* Details */}
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
                      {errors.details && <p className="text-danger text-sm mt-1">{errors.details}</p>}
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

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={processing}
                      className="btn bg-primary text-white w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="inline-block border-2 border-white rounded-full size-4 animate-spin border-s-transparent" />
                          Submitting...
                        </span>
                      ) : (
                        settings.submit_button_label || 'Submit Ticket'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        )}
      </PublicLayout>
    </>
  );
}

