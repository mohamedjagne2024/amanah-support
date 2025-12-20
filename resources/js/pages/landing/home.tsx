import { useForm } from '@inertiajs/react';
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
import { LandingNav, LandingFooter } from '@/components/landing';

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

type CategoryOption = {
  id: number;
  name: string;
  parent_id?: number | null;
};

type DepartmentOption = {
  id: number;
  name: string;
};

type TypeOption = {
  id: number;
  name: string;
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
    html: PageData | null;
  } | null;
  custom_fields: CustomField[];
  hide_ticket_fields: string[];
  require_login: boolean | null;
  departments: DepartmentOption[];
  all_categories: CategoryOption[];
  types: TypeOption[];
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
  custom_fields = [],
  hide_ticket_fields = [],
  require_login,
  departments = [],
  all_categories = [],
  types = [],
  footer,
}: HomePageProps & { footer?: any }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  const pageData = page?.html || {};
  const hero = pageData.hero || {};
  const features = pageData.features || {};
  const stats = pageData.stats || {};
  const testimonials = pageData.testimonials || {};
  const settings = pageData.settings || {};

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    subject: '',
    details: '',
    department_id: '',
    category_id: '',
    sub_category_id: '',
    type_id: '',
    files: [] as File[],
    custom_field: {} as Record<string, string>,
  });

  const departmentOptions = useMemo<SelectOption[]>(
    () => departments.map((d) => ({ label: d.name, value: d.id })),
    [departments]
  );

  const categoryOptions = useMemo<SelectOption[]>(
    () => all_categories.filter((c) => !c.parent_id).map((c) => ({ label: c.name, value: c.id })),
    [all_categories]
  );

  const subCategoryOptions = useMemo<SelectOption[]>(
    () => all_categories.filter((c) => c.parent_id === Number(data.category_id)).map((c) => ({ label: c.name, value: c.id })),
    [all_categories, data.category_id]
  );

  const typeOptions = useMemo<SelectOption[]>(
    () => types.map((t) => ({ label: t.name, value: t.id })),
    [types]
  );

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

  const isFieldHidden = (field: string) => hide_ticket_fields.includes(field);

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
      
      <div className="min-h-screen bg-default-50">
        {/* Navigation */}
        <LandingNav currentPage="/" />

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
                          className={`btn ${
                            index === 0
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
        {settings.enable_ticket_section && !require_login && (
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
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name & Email Fields */}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block font-medium text-default-900 text-sm mb-2">
                          Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          value={data.name}
                          onChange={(e) => setData('name', e.target.value)}
                          className="form-input"
                          placeholder="John Doe"
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
                          className="form-input"
                          placeholder="john@example.com"
                          disabled={processing}
                        />
                        {errors.email && <p className="text-danger text-sm mt-1">{errors.email}</p>}
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
                        className="form-input"
                        placeholder="Brief description of your issue"
                        disabled={processing}
                      />
                      {errors.subject && <p className="text-danger text-sm mt-1">{errors.subject}</p>}
                    </div>

                    {/* Optional Fields */}
                    <div className="grid sm:grid-cols-2 gap-5">
                      {!isFieldHidden('department') && (
                        <div>
                          <Combobox
                            label="Department"
                            options={departmentOptions}
                            value={departmentOptions.find((opt) => String(opt.value) === data.department_id) || null}
                            onChange={(option) => setData('department_id', option?.value?.toString() || '')}
                            placeholder="Select department"
                            disabled={processing}
                            isClearable
                            isSearchable
                          />
                        </div>
                      )}
                      {!isFieldHidden('ticket_type') && (
                        <div>
                          <Combobox
                            label="Type"
                            options={typeOptions}
                            value={typeOptions.find((opt) => String(opt.value) === data.type_id) || null}
                            onChange={(option) => setData('type_id', option?.value?.toString() || '')}
                            placeholder="Select type"
                            disabled={processing}
                            isClearable
                            isSearchable
                          />
                        </div>
                      )}
                    </div>

                    {!isFieldHidden('category') && (
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <Combobox
                            label="Category"
                            options={categoryOptions}
                            value={categoryOptions.find((opt) => String(opt.value) === data.category_id) || null}
                            onChange={(option) => {
                              setData('category_id', option?.value?.toString() || '');
                              setData('sub_category_id', '');
                            }}
                            placeholder="Select category"
                            disabled={processing}
                            isClearable
                            isSearchable
                          />
                        </div>
                        {!isFieldHidden('sub_category') && data.category_id && subCategoryOptions.length > 0 && (
                          <div>
                            <Combobox
                              label="Sub Category"
                              options={subCategoryOptions}
                              value={subCategoryOptions.find((opt) => String(opt.value) === data.sub_category_id) || null}
                              onChange={(option) => setData('sub_category_id', option?.value?.toString() || '')}
                              placeholder="Select sub category"
                              disabled={processing}
                              isClearable
                              isSearchable
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Details */}
                    <div>
                      <label className="block font-medium text-default-900 text-sm mb-2">
                        Details <span className="text-danger">*</span>
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

                    {/* Custom Fields */}
                    {custom_fields.length > 0 && (
                      <div className="space-y-4">
                        {custom_fields.map((field) => (
                          <div key={field.id}>
                            <label className="block font-medium text-default-900 text-sm mb-2">
                              {field.label} {field.required && <span className="text-danger">*</span>}
                            </label>
                            {field.type === 'textarea' ? (
                              <textarea
                                value={data.custom_field[field.name] || ''}
                                onChange={(e) => setData('custom_field', { ...data.custom_field, [field.name]: e.target.value })}
                                className="form-input min-h-[100px]"
                                disabled={processing}
                              />
                            ) : field.type === 'select' && field.options ? (
                              <select
                                value={data.custom_field[field.name] || ''}
                                onChange={(e) => setData('custom_field', { ...data.custom_field, [field.name]: e.target.value })}
                                className="form-input"
                                disabled={processing}
                              >
                                <option value="">Select...</option>
                                {field.options.split(',').map((opt, i) => (
                                  <option key={i} value={opt.trim()}>{opt.trim()}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={field.type || 'text'}
                                value={data.custom_field[field.name] || ''}
                                onChange={(e) => setData('custom_field', { ...data.custom_field, [field.name]: e.target.value })}
                                className="form-input"
                                disabled={processing}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* File Attachments */}
                    <div>
                      <label className="block font-medium text-default-900 text-sm mb-2">
                        Attach Files
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
                      className="btn bg-primary text-white w-full"
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

        {/* Footer */}
        <LandingFooter footerData={footer} />
      </div>
    </>
  );
}

