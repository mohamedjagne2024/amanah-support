import { useForm, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { 
  Settings, 
  Home as HomeIcon, 
  Star, 
  BarChart3, 
  MessageSquare,
  Plus,
  X,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageMeta from '@/components/PageMeta';
import Combobox, { SelectOption } from '@/components/Combobox';
import TextEditor from '@/components/TextEditor';

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
  settings: {
    badge_text: string;
    section_title: string;
    section_subtitle: string;
    form_header_title: string;
    form_header_subtitle: string;
    submit_button_label: string;
    enable_ticket_section: boolean;
  };
  hero: {
    enabled: boolean;
    title: string;
    description: string;
    badge_text: string;
    trust_indicators: string[];
    buttons: HeroButton[];
    image: string;
  };
  features: {
    enabled: boolean;
    tagline: string;
    title: string;
    description: string;
    items: FeatureItem[];
  };
  stats: {
    enabled: boolean;
    tagline: string;
    title: string;
    description: string;
    items: StatItem[];
  };
  testimonials: {
    enabled: boolean;
    tagline: string;
    title: string;
    description: string;
    items: TestimonialItem[];
  };
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
};

const defaultPageData: PageData = {
  settings: {
    badge_text: '',
    section_title: 'Our Impact',
    section_subtitle: '',
    form_header_title: '',
    form_header_subtitle: '',
    submit_button_label: 'Submit',
    enable_ticket_section: false,
  },
  hero: {
    enabled: true,
    title: 'Simplify your workflow with <span>Amanah Support</span>',
    description: 'Easily create, assign, manage, and resolve tickets. Just host Amanah Support on your preferred server and start using it right away.',
    badge_text: 'Trusted by 10,000+ companies',
    trust_indicators: ['Free 14-day trial', 'No credit card required', '24/7 support'],
    buttons: [
      { text: 'Login Amanah Support', link: '/login', new_tab: false },
      { text: 'Submit ticket', link: '/ticket/open', new_tab: false },
    ],
    image: '/landing/images/dashboard-amanah-support.png',
  },
  features: {
    enabled: true,
    tagline: 'Process',
    title: 'How Amanah Support Works',
    description: "Here's how the Amanah Support process makes support simple and efficient.",
    items: [
      { icon: 'ticket', title: 'Submit A ticket', description: "Create a ticket directly from the home page or dashboard." },
      { icon: 'chat', title: 'Instant talk with agent', description: "Connect instantly with an agent through the \"Chat with us\" button." },
      { icon: 'email', title: 'Track Progress by Email', description: "Stay updated via email whenever your ticket status changes." },
      { icon: 'tick', title: 'Close the Ticket', description: "Once your issue is resolved, the agent will close the ticket." },
    ],
  },
  stats: {
    enabled: true,
    tagline: 'Statistics',
    title: 'Our Impact',
    description: 'Key metrics that showcase our success and reliability.',
    items: [
      { label: 'Tickets Resolved', value: '10,000+', icon: 'tick' },
      { label: 'Happy Customers', value: '500+', icon: 'users' },
      { label: 'Avg. Response Time', value: '< 2 hours', icon: 'clock' },
      { label: 'Rating', value: '5.0★', icon: '' },
    ],
  },
  testimonials: {
    enabled: true,
    tagline: 'Testimonials',
    title: 'What Our Customers Say',
    description: 'Read what our satisfied customers say about our Amanah Support solution.',
    items: [
      { name: 'John Doe', company: 'Acme Inc.', content: 'Amanah Support streamlined our support operations.', rating: 5 },
      { name: 'Jane Smith', company: 'BetaCorp', content: 'Great UX and fast to deploy.', rating: 5 },
    ],
  },
};

const iconOptions: SelectOption[] = [
  { label: 'Ticket', value: 'ticket' },
  { label: 'Chat', value: 'chat' },
  { label: 'Email', value: 'email' },
  { label: 'Tick / Check', value: 'tick' },
  { label: 'Users', value: 'users' },
  { label: 'Clock', value: 'clock' },
  { label: 'Star', value: 'star' },
  { label: 'Shield', value: 'shield' },
  { label: 'Settings', value: 'settings' },
  { label: 'Home', value: 'home' },
];

const tabs = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'hero', label: 'Hero Section', icon: HomeIcon },
  { id: 'features', label: 'Features', icon: Star },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
];

export default function Home({ title, page }: HomePageProps) {
  const [activeTab, setActiveTab] = useState('settings');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initialData = page?.html || defaultPageData;
  
  const { data, setData, processing, errors } = useForm<PageData>({
    settings: initialData.settings || defaultPageData.settings,
    hero: initialData.hero || defaultPageData.hero,
    features: initialData.features || defaultPageData.features,
    stats: initialData.stats || defaultPageData.stats,
    testimonials: initialData.testimonials || defaultPageData.testimonials,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    router.put('/front_pages/home', {
      title: 'Home Page',
      slug: 'home',
      html: data,
    }, {
      onFinish: () => setIsSubmitting(false),
    });
  };

  const handleReset = () => {
    setData(defaultPageData);
  };

  // Hero Section Handlers
  const handleAddTrustIndicator = () => {
    setData('hero', {
      ...data.hero,
      trust_indicators: [...data.hero.trust_indicators, ''],
    });
  };

  const handleRemoveTrustIndicator = (index: number) => {
    setData('hero', {
      ...data.hero,
      trust_indicators: data.hero.trust_indicators.filter((_, i) => i !== index),
    });
  };

  const handleTrustIndicatorChange = (index: number, value: string) => {
    const updated = [...data.hero.trust_indicators];
    updated[index] = value;
    setData('hero', { ...data.hero, trust_indicators: updated });
  };

  const handleAddButton = () => {
    setData('hero', {
      ...data.hero,
      buttons: [...data.hero.buttons, { text: '', link: '', new_tab: false }],
    });
  };

  const handleRemoveButton = (index: number) => {
    setData('hero', {
      ...data.hero,
      buttons: data.hero.buttons.filter((_, i) => i !== index),
    });
  };

  const handleButtonChange = (index: number, field: keyof HeroButton, value: string | boolean) => {
    const updated = [...data.hero.buttons];
    updated[index] = { ...updated[index], [field]: value };
    setData('hero', { ...data.hero, buttons: updated });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/upload/image', {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });
      const result = await response.json();
      if (result.image) {
        setData('hero', { ...data.hero, image: result.image });
      }
    } catch (error) {
      console.error('Image upload failed:', error);
    }
  };

  // Features Section Handlers
  const handleAddFeature = () => {
    setData('features', {
      ...data.features,
      items: [...data.features.items, { icon: 'ticket', title: '', description: '' }],
    });
  };

  const handleRemoveFeature = (index: number) => {
    setData('features', {
      ...data.features,
      items: data.features.items.filter((_, i) => i !== index),
    });
  };

  const handleFeatureChange = (index: number, field: keyof FeatureItem, value: string) => {
    const updated = [...data.features.items];
    updated[index] = { ...updated[index], [field]: value };
    setData('features', { ...data.features, items: updated });
  };

  // Stats Section Handlers
  const handleAddStat = () => {
    setData('stats', {
      ...data.stats,
      items: [...data.stats.items, { label: '', value: '', icon: 'tick' }],
    });
  };

  const handleRemoveStat = (index: number) => {
    setData('stats', {
      ...data.stats,
      items: data.stats.items.filter((_, i) => i !== index),
    });
  };

  const handleStatChange = (index: number, field: keyof StatItem, value: string) => {
    const updated = [...data.stats.items];
    updated[index] = { ...updated[index], [field]: value };
    setData('stats', { ...data.stats, items: updated });
  };

  // Testimonials Section Handlers
  const handleAddTestimonial = () => {
    setData('testimonials', {
      ...data.testimonials,
      items: [...data.testimonials.items, { name: '', company: '', content: '', rating: 5 }],
    });
  };

  const handleRemoveTestimonial = (index: number) => {
    setData('testimonials', {
      ...data.testimonials,
      items: data.testimonials.items.filter((_, i) => i !== index),
    });
  };

  const handleTestimonialChange = (index: number, field: keyof TestimonialItem, value: string | number) => {
    const updated = [...data.testimonials.items];
    updated[index] = { ...updated[index], [field]: value };
    setData('testimonials', { ...data.testimonials, items: updated });
  };

  const renderSettingsTab = () => (
    <div className="space-y-6 max-w-5xl">
      {/* Page Settings Card */}
      <div className="card">
        <div className="card-header">
          <h6 className="card-title">Page Settings</h6>
          <p className="text-sm text-default-500 mt-1">Configure page behavior and ticket submission options</p>
        </div>
        <div className="card-body space-y-6">
          {/* Ticket Section Card */}
          <div className="border border-default-200 rounded-lg p-4 space-y-4">
            <h6 className="font-semibold text-default-900">Ticket Section</h6>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-default-900 text-sm mb-2">Badge Text</label>
                <input
                  type="text"
                  value={data.settings.badge_text}
                  onChange={(e) => setData('settings', { ...data.settings, badge_text: e.target.value })}
                  placeholder="Enter badge text"
                  className="form-input"
                  disabled={processing}
                />
              </div>
              <div>
                <label className="block font-medium text-default-900 text-sm mb-2">Section Title</label>
                <input
                  type="text"
                  value={data.settings.section_title}
                  onChange={(e) => setData('settings', { ...data.settings, section_title: e.target.value })}
                  placeholder="Our Impact"
                  className="form-input"
                  disabled={processing}
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">Section Subtitle</label>
              <TextEditor
                placeholder="Enter section subtitle..."
                onChange={(content) => setData('settings', { ...data.settings, section_subtitle: content })}
                showToolbar={true}
                className="min-h-[100px]"
                initialValue={data.settings.section_subtitle}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-default-900 text-sm mb-2">Form Header Title</label>
                <input
                  type="text"
                  value={data.settings.form_header_title}
                  onChange={(e) => setData('settings', { ...data.settings, form_header_title: e.target.value })}
                  placeholder="Enter form header title"
                  className="form-input"
                  disabled={processing}
                />
              </div>
              <div>
                <label className="block font-medium text-default-900 text-sm mb-2">Submit Button Label</label>
                <input
                  type="text"
                  value={data.settings.submit_button_label}
                  onChange={(e) => setData('settings', { ...data.settings, submit_button_label: e.target.value })}
                  placeholder="Submit"
                  className="form-input"
                  disabled={processing}
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">Form Header Subtitle</label>
              <TextEditor
                placeholder="Enter form header subtitle..."
                onChange={(content) => setData('settings', { ...data.settings, form_header_subtitle: content })}
                showToolbar={true}
                className="min-h-[100px]"
                initialValue={data.settings.form_header_subtitle}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg border border-default-200">
              <div>
                <p className="font-medium text-default-900">Enable Ticket Section</p>
                <p className="text-sm text-default-500">Show ticket submission form on the homepage</p>
              </div>
              <button
                type="button"
                onClick={() => setData('settings', { ...data.settings, enable_ticket_section: !data.settings.enable_ticket_section })}
                disabled={processing}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  data.settings.enable_ticket_section ? 'bg-primary' : 'bg-default-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    data.settings.enable_ticket_section ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHeroTab = () => (
    <div className="space-y-6 max-w-5xl">
      {/* Hero Section Card */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div>
            <h6 className="card-title">Hero Section</h6>
            <p className="text-sm text-default-500 mt-1">Main banner section with title, description, and call-to-action buttons</p>
          </div>
          <button
            type="button"
            onClick={() => setData('hero', { ...data.hero, enabled: !data.hero.enabled })}
            disabled={processing}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              data.hero.enabled ? 'bg-primary' : 'bg-default-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                data.hero.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <div className="card-body space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">Hero Title</label>
              <input
                type="text"
                value={data.hero.title}
                onChange={(e) => setData('hero', { ...data.hero, title: e.target.value })}
                placeholder="Simplify your workflow with <span>Amanah Support</span>"
                className="form-input"
                disabled={processing}
              />
              <p className="text-xs text-default-500 mt-1">Use &lt;span&gt; tags to highlight text</p>
            </div>
            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">Hero Badge Text</label>
              <input
                type="text"
                value={data.hero.badge_text}
                onChange={(e) => setData('hero', { ...data.hero, badge_text: e.target.value })}
                placeholder="Trusted by 10,000+ companies"
                className="form-input"
                disabled={processing}
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">Hero Description</label>
            <TextEditor
              placeholder="Enter hero description..."
              onChange={(content) => setData('hero', { ...data.hero, description: content })}
              showToolbar={true}
              className="min-h-[120px]"
              initialValue={data.hero.description}
            />
          </div>

          {/* Trust Indicators */}
          <div className="border border-default-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h6 className="font-semibold text-default-900">Trust Indicators</h6>
              <button
                type="button"
                onClick={handleAddTrustIndicator}
                className="btn btn-sm bg-primary text-white"
                disabled={processing}
              >
                <Plus className="size-4 mr-1" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {data.hero.trust_indicators.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleTrustIndicatorChange(index, e.target.value)}
                    placeholder="Free 14-day trial"
                    className="form-input flex-1"
                    disabled={processing}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTrustIndicator(index)}
                    className="size-9 bg-danger text-white rounded-lg flex items-center justify-center hover:bg-danger/80"
                    disabled={processing}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Call-to-Action Buttons */}
          <div className="border border-default-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h6 className="font-semibold text-default-900">Call-to-Action Buttons</h6>
              <button
                type="button"
                onClick={handleAddButton}
                className="btn btn-sm bg-primary text-white"
                disabled={processing}
              >
                <Plus className="size-4 mr-1" /> Add Button
              </button>
            </div>
            <div className="space-y-4">
              {data.hero.buttons.map((button, index) => (
                <div key={index} className="flex items-start gap-4 p-3 bg-default-50 rounded-lg border border-default-200">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-default-900 text-sm mb-2">Button Text</label>
                      <input
                        type="text"
                        value={button.text}
                        onChange={(e) => handleButtonChange(index, 'text', e.target.value)}
                        placeholder="Login Amanah Support"
                        className="form-input"
                        disabled={processing}
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-default-900 text-sm mb-2">Button Link</label>
                      <input
                        type="text"
                        value={button.link}
                        onChange={(e) => handleButtonChange(index, 'link', e.target.value)}
                        placeholder="/login"
                        className="form-input"
                        disabled={processing}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-7">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={button.new_tab}
                        onChange={(e) => handleButtonChange(index, 'new_tab', e.target.checked)}
                        className="size-4 rounded border-default-300 text-primary focus:ring-primary"
                        disabled={processing}
                      />
                      <span className="text-sm text-default-700">Open in new tab</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveButton(index)}
                      className="size-9 bg-danger text-white rounded-lg flex items-center justify-center hover:bg-danger/80"
                      disabled={processing}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image */}
          <div className="border border-default-200 rounded-lg p-4 space-y-4">
            <h6 className="font-semibold text-default-900">Hero Image</h6>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={processing}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-sm bg-default-100 text-default-700 hover:bg-default-200"
              disabled={processing}
            >
              <ImageIcon className="size-4 mr-2" /> Change Image
            </button>
            {data.hero.image && (
              <div className="relative">
                <img
                  src={data.hero.image}
                  alt="Hero preview"
                  className="max-w-xs rounded-lg border border-default-200"
                />
                <button
                  type="button"
                  onClick={() => setData('hero', { ...data.hero, image: '' })}
                  className="absolute -top-2 -right-2 size-6 bg-danger text-white rounded-full flex items-center justify-center hover:bg-danger/80"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeaturesTab = () => (
    <div className="space-y-6 max-w-5xl">
      {/* Features Section Card */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div>
            <h6 className="card-title">Features Section</h6>
            <p className="text-sm text-default-500 mt-1">Showcase your Amanah Support features and benefits</p>
          </div>
          <button
            type="button"
            onClick={() => setData('features', { ...data.features, enabled: !data.features.enabled })}
            disabled={processing}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              data.features.enabled ? 'bg-primary' : 'bg-default-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                data.features.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <div className="card-body space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">Section Tagline</label>
              <input
                type="text"
                value={data.features.tagline}
                onChange={(e) => setData('features', { ...data.features, tagline: e.target.value })}
                placeholder="Process"
                className="form-input"
                disabled={processing}
              />
            </div>
            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">Section Title</label>
              <input
                type="text"
                value={data.features.title}
                onChange={(e) => setData('features', { ...data.features, title: e.target.value })}
                placeholder="How Amanah Support Works"
                className="form-input"
                disabled={processing}
              />
            </div>
            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">Section Description</label>
              <textarea
                value={data.features.description}
                onChange={(e) => setData('features', { ...data.features, description: e.target.value })}
                placeholder="Here's how the Amanah Support process makes support simple and efficient."
                className="form-input min-h-[80px]"
                disabled={processing}
              />
            </div>
          </div>

          {/* Feature List */}
          <div className="border border-default-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h6 className="font-semibold text-default-900">Feature List</h6>
              <button
                type="button"
                onClick={handleAddFeature}
                className="btn btn-sm bg-primary text-white"
                disabled={processing}
              >
                <Plus className="size-4 mr-1" /> Add Feature
              </button>
            </div>
            <div className="space-y-4">
              {data.features.items.map((feature, index) => (
                <div key={index} className="p-4 bg-default-50 rounded-lg border border-default-200">
                  <div className="flex items-start gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
                      <div className="md:col-span-2">
                        <label className="block font-medium text-default-900 text-sm mb-2">Icon</label>
                        <Combobox
                          options={iconOptions}
                          value={iconOptions.find(opt => opt.value === feature.icon) || null}
                          onChange={(option) => handleFeatureChange(index, 'icon', option?.value?.toString() || 'ticket')}
                          placeholder="Select icon"
                          disabled={processing}
                          isSearchable
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block font-medium text-default-900 text-sm mb-2">Feature Title</label>
                        <input
                          type="text"
                          value={feature.title}
                          onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                          placeholder="Submit A ticket"
                          className="form-input"
                          disabled={processing}
                        />
                      </div>
                      <div className="md:col-span-6">
                        <label className="block font-medium text-default-900 text-sm mb-2">Feature Description</label>
                        <textarea
                          value={feature.description}
                          onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                          placeholder="Create a ticket directly from the home page or dashboard."
                          className="form-input min-h-[80px]"
                          disabled={processing}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="size-9 bg-danger text-white rounded-lg flex items-center justify-center hover:bg-danger/80 mt-7"
                      disabled={processing}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-6 max-w-5xl">
      {/* Stats Section Card */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div>
            <h6 className="card-title">Stats Section</h6>
            <p className="text-sm text-default-500 mt-1">Showcase key metrics of your Amanah Support</p>
          </div>
          <button
            type="button"
            onClick={() => setData('stats', { ...data.stats, enabled: !data.stats.enabled })}
            disabled={processing}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              data.stats.enabled ? 'bg-primary' : 'bg-default-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                data.stats.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <div className="card-body space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">Section Tagline</label>
              <input
                type="text"
                value={data.stats.tagline}
                onChange={(e) => setData('stats', { ...data.stats, tagline: e.target.value })}
                placeholder="Statistics"
                className="form-input"
                disabled={processing}
              />
            </div>
            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">Section Title</label>
              <input
                type="text"
                value={data.stats.title}
                onChange={(e) => setData('stats', { ...data.stats, title: e.target.value })}
                placeholder="Our Impact"
                className="form-input"
                disabled={processing}
              />
            </div>
            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">Section Description</label>
              <textarea
                value={data.stats.description}
                onChange={(e) => setData('stats', { ...data.stats, description: e.target.value })}
                placeholder="Key metrics that showcase our success and reliability."
                className="form-input min-h-[80px]"
                disabled={processing}
              />
            </div>
          </div>

          {/* Stats List */}
          <div className="border border-default-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h6 className="font-semibold text-default-900">Stats List</h6>
              <button
                type="button"
                onClick={handleAddStat}
                className="btn btn-sm bg-primary text-white"
                disabled={processing}
              >
                <Plus className="size-4 mr-1" /> Add Stat
              </button>
            </div>
            <div className="space-y-4">
              {data.stats.items.map((stat, index) => (
                <div key={index} className="p-4 bg-default-50 rounded-lg border border-default-200">
                  <div className="flex items-start gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                      <div>
                        <label className="block font-medium text-default-900 text-sm mb-2">Label</label>
                        <input
                          type="text"
                          value={stat.label}
                          onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                          placeholder="Tickets Resolved"
                          className="form-input"
                          disabled={processing}
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-default-900 text-sm mb-2">Value</label>
                        <input
                          type="text"
                          value={stat.value}
                          onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                          placeholder="10,000+"
                          className="form-input"
                          disabled={processing}
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-default-900 text-sm mb-2">Icon</label>
                        <Combobox
                          options={iconOptions}
                          value={iconOptions.find(opt => opt.value === stat.icon) || null}
                          onChange={(option) => handleStatChange(index, 'icon', option?.value?.toString() || '')}
                          placeholder="Select icon"
                          disabled={processing}
                          isSearchable
                          isClearable
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStat(index)}
                      className="size-9 bg-danger text-white rounded-lg flex items-center justify-center hover:bg-danger/80 mt-7"
                      disabled={processing}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTestimonialsTab = () => (
    <div className="space-y-6 max-w-5xl">
      {/* Testimonials Section Card */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div>
            <h6 className="card-title">Testimonials Section</h6>
            <p className="text-sm text-default-500 mt-1">Showcase customer feedback and ratings</p>
          </div>
          <button
            type="button"
            onClick={() => setData('testimonials', { ...data.testimonials, enabled: !data.testimonials.enabled })}
            disabled={processing}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              data.testimonials.enabled ? 'bg-primary' : 'bg-default-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                data.testimonials.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <div className="card-body space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">Section Tagline</label>
              <input
                type="text"
                value={data.testimonials.tagline}
                onChange={(e) => setData('testimonials', { ...data.testimonials, tagline: e.target.value })}
                placeholder="Testimonials"
                className="form-input"
                disabled={processing}
              />
            </div>
            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">Section Title</label>
              <input
                type="text"
                value={data.testimonials.title}
                onChange={(e) => setData('testimonials', { ...data.testimonials, title: e.target.value })}
                placeholder="What Our Customers Say"
                className="form-input"
                disabled={processing}
              />
            </div>
            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">Section Description</label>
              <textarea
                value={data.testimonials.description}
                onChange={(e) => setData('testimonials', { ...data.testimonials, description: e.target.value })}
                placeholder="Read what our satisfied customers say about our Amanah Support solution."
                className="form-input min-h-[80px]"
                disabled={processing}
              />
            </div>
          </div>

          {/* Testimonials List */}
          <div className="border border-default-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h6 className="font-semibold text-default-900">Testimonials</h6>
              <button
                type="button"
                onClick={handleAddTestimonial}
                className="btn btn-sm bg-primary text-white"
                disabled={processing}
              >
                <Plus className="size-4 mr-1" /> Add Testimonial
              </button>
            </div>
            <div className="space-y-4">
              {data.testimonials.items.map((testimonial, index) => (
                <div key={index} className="p-4 bg-default-50 rounded-lg border border-default-200">
                  <div className="flex items-start gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
                      <div className="md:col-span-2">
                        <label className="block font-medium text-default-900 text-sm mb-2">Name</label>
                        <input
                          type="text"
                          value={testimonial.name}
                          onChange={(e) => handleTestimonialChange(index, 'name', e.target.value)}
                          placeholder="John Doe"
                          className="form-input"
                          disabled={processing}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block font-medium text-default-900 text-sm mb-2">Company</label>
                        <input
                          type="text"
                          value={testimonial.company}
                          onChange={(e) => handleTestimonialChange(index, 'company', e.target.value)}
                          placeholder="Acme Inc."
                          className="form-input"
                          disabled={processing}
                        />
                      </div>
                      <div className="md:col-span-6">
                        <label className="block font-medium text-default-900 text-sm mb-2">Content</label>
                        <textarea
                          value={testimonial.content}
                          onChange={(e) => handleTestimonialChange(index, 'content', e.target.value)}
                          placeholder="Amanah Support streamlined our support operations and improved our customer satisfaction."
                          className="form-input min-h-[80px]"
                          disabled={processing}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block font-medium text-default-900 text-sm mb-2">Rating (1-5)</label>
                        <input
                          type="number"
                          value={testimonial.rating}
                          onChange={(e) => handleTestimonialChange(index, 'rating', parseInt(e.target.value) || 5)}
                          min={1}
                          max={5}
                          className="form-input"
                          disabled={processing}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTestimonial(index)}
                      className="size-9 bg-danger text-white rounded-lg flex items-center justify-center hover:bg-danger/80 mt-7"
                      disabled={processing}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return renderSettingsTab();
      case 'hero':
        return renderHeroTab();
      case 'features':
        return renderFeaturesTab();
      case 'stats':
        return renderStatsTab();
      case 'testimonials':
        return renderTestimonialsTab();
      default:
        return renderSettingsTab();
    }
  };

  return (
    <AppLayout>
      <PageMeta title="Home Page Settings" />
      <main className="pb-8">
        <form onSubmit={handleSubmit}>
          {/* Tabs Navigation */}
          <div className="px-4 max-w-5xl">
            <nav className="flex gap-6 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-default-500 hover:text-default-700 hover:border-default-300'
                    }`}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          {renderTabContent()}

          {/* Footer Actions */}
          <div className="px-6 py-4 max-w-5xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-default-500">
                Changes are saved automatically when you submit the form
              </p>
              <div className="flex items-center gap-3">
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
          </div>
        </form>
      </main>
    </AppLayout>
  );
}

