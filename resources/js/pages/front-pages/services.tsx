import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
  Plus,
  X,
  Briefcase,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageMeta from '@/components/PageMeta';
import TextEditor from '@/components/TextEditor';

type ServiceItem = {
  name: string;
  icon: string;
  details: string;
};

type PageData = {
  content: {
    tagline: string;
    title: string;
    description: string;
  };
  services: ServiceItem[];
};

type ServicesPageProps = {
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
  content: {
    tagline: 'Our Services',
    title: 'What We Offer',
    description: 'Discover our comprehensive range of services designed to meet your needs.',
  },
  services: [
    {
      name: 'Technical Support',
      icon: 'ticket',
      details: 'Get expert assistance with technical issues and troubleshooting.',
    },
    {
      name: 'Customer Service',
      icon: 'users',
      details: 'Dedicated support team to help with inquiries and account management.',
    },
  ],
};

export default function Services({ title, page }: ServicesPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialData = page?.html || defaultPageData;
  
  const { data, setData, processing } = useForm<PageData>({
    content: initialData.content || defaultPageData.content,
    services: initialData.services || defaultPageData.services,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    router.put('/front_pages/services', {
      title: 'Services Page',
      slug: 'services',
      html: data,
    }, {
      onFinish: () => setIsSubmitting(false),
    });
  };

  const handleReset = () => {
    setData(defaultPageData);
  };

  const handleAddService = () => {
    setData('services', [
      ...data.services,
      { name: '', icon: 'ticket', details: '' },
    ]);
  };

  const handleRemoveService = (index: number) => {
    setData('services', data.services.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, field: keyof ServiceItem, value: string) => {
    const updated = [...data.services];
    updated[index] = { ...updated[index], [field]: value };
    setData('services', updated);
  };

  return (
    <AppLayout>
      <PageMeta title="Services Page Settings" />
      <main className="pb-24">
        <form onSubmit={handleSubmit}>
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-default-900">Services Page Settings</h1>
            <p className="text-default-500 mt-1">Configure your services page content</p>
          </div>

          <div className="space-y-6 max-w-5xl">
            {/* Content Section */}
            <div className="card">
              <div className="card-header flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Briefcase className="size-5 text-primary" />
                </div>
                <div>
                  <h6 className="card-title">Page Content</h6>
                  <p className="text-sm text-default-500">Main header section configuration</p>
                </div>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">Tagline</label>
                    <input
                      type="text"
                      value={data.content.tagline}
                      onChange={(e) => setData('content', { ...data.content, tagline: e.target.value })}
                      placeholder="Our Services"
                      className="form-input"
                      disabled={processing || isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">Title</label>
                    <input
                      type="text"
                      value={data.content.title}
                      onChange={(e) => setData('content', { ...data.content, title: e.target.value })}
                      placeholder="What We Offer"
                      className="form-input"
                      disabled={processing || isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">Description</label>
                  <textarea
                    value={data.content.description}
                    onChange={(e) => setData('content', { ...data.content, description: e.target.value })}
                    placeholder="Enter description..."
                    className="form-input min-h-[100px]"
                    disabled={processing || isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Services List */}
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Briefcase className="size-5 text-success" />
                  </div>
                  <div>
                    <h6 className="card-title">Services</h6>
                    <p className="text-sm text-default-500">Add and manage your services</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="btn btn-sm bg-primary text-white"
                  disabled={processing || isSubmitting}
                >
                  <Plus className="size-4 mr-1" /> Add Service
                </button>
              </div>
              <div className="card-body space-y-4">
                {data.services.length === 0 ? (
                  <div className="text-center py-8 text-default-500">
                    <Briefcase className="size-12 mx-auto mb-3 text-default-300" />
                    <p>No services added yet.</p>
                    <p className="text-sm">Click "Add Service" to get started.</p>
                  </div>
                ) : (
                  data.services.map((service, index) => (
                    <div key={index} className="p-4 bg-default-50 rounded-lg border border-default-200">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-5">
                              <label className="block font-medium text-default-900 text-sm mb-2">Service Name</label>
                              <input
                                type="text"
                                value={service.name}
                                onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                                placeholder="Technical Support"
                                className="form-input"
                                disabled={processing || isSubmitting}
                              />
                            </div>
                            <div className="md:col-span-3">
                              <label className="block font-medium text-default-900 text-sm mb-2">Icon</label>
                              <input
                                type="text"
                                value={service.icon}
                                onChange={(e) => handleServiceChange(index, 'icon', e.target.value)}
                                placeholder="e.g. ticket, users, shield"
                                className="form-input"
                                disabled={processing || isSubmitting}
                              />
                              <p className="text-xs text-default-500 mt-1">Enter icon name (e.g. ticket, chat, users, shield, star)</p>
                            </div>
                          </div>
                          <div>
                            <label className="block font-medium text-default-900 text-sm mb-2">Details</label>
                            <textarea
                              placeholder="Enter service description..."
                              onChange={(e) => handleServiceChange(index, 'details', e.target.value)}
                              className="form-input"
                              value={service.details}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(index)}
                          className="size-9 bg-danger text-white rounded-lg flex items-center justify-center hover:bg-danger/80 mt-7"
                          disabled={processing || isSubmitting}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 max-w-5xl">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
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

