import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
  FileText, 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageMeta from '@/components/PageMeta';

type PageData = {
  content: {
    text: string;
    details: string;
  };
  location: {
    address: string;
    map_url: string;
  };
  phone: {
    number: string;
    details: string;
  };
  email: {
    address: string;
    details: string;
  };
  contact_form: {
    recipient_email: string;
  };
};

type ContactPageProps = {
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
    text: 'GET IN TOUCH WITH US',
    details: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eius tempor incididunt ut labore et dolore magna aliqua. Ut enim adiqua minim veniam quis nostrud exercitation ullamco',
  },
  location: {
    address: '8013 Alderwood St. South San Francisco, CA 94080',
    map_url: '',
  },
  phone: {
    number: '+902930290232',
    details: 'The phrasal sequence of the is now so that many campaign and benefit.',
  },
  email: {
    address: 'contact@mail.com',
    details: 'The phrasal sequence of the is now so that many campaign and benefit.',
  },
  contact_form: {
    recipient_email: '',
  },
};

export default function Contact({ title, page }: ContactPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialData = page?.html || defaultPageData;
  
  const { data, setData, processing } = useForm<PageData>({
    content: initialData.content || defaultPageData.content,
    location: initialData.location || defaultPageData.location,
    phone: initialData.phone || defaultPageData.phone,
    email: initialData.email || defaultPageData.email,
    contact_form: initialData.contact_form || defaultPageData.contact_form,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    router.put('/front_pages/contact', {
      title: 'Contact Page',
      slug: 'contact',
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
      <PageMeta title="Contact Page Settings" />
      <main className="pb-24">
        <form onSubmit={handleSubmit}>
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-default-900">Contact Page Settings</h1>
            <p className="text-default-500 mt-1">Configure your contact page content and information</p>
          </div>

          <div className="space-y-6 max-w-5xl">
            {/* Content Section */}
            <div className="card">
              <div className="card-header flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="size-5 text-primary" />
                </div>
                <div>
                  <h6 className="card-title">Content</h6>
                  <p className="text-sm text-default-500">Main header text and description</p>
                </div>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">Text</label>
                  <input
                    type="text"
                    value={data.content.text}
                    onChange={(e) => setData('content', { ...data.content, text: e.target.value })}
                    placeholder="GET IN TOUCH WITH US"
                    className="form-input"
                    disabled={processing}
                  />
                </div>
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">Details</label>
                  <textarea
                    value={data.content.details}
                    onChange={(e) => setData('content', { ...data.content, details: e.target.value })}
                    placeholder="Enter description..."
                    className="form-input min-h-[100px]"
                    disabled={processing}
                  />
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="card">
              <div className="card-header flex items-center gap-3">
                <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <MapPin className="size-5 text-emerald-500" />
                </div>
                <div>
                  <h6 className="card-title">Location</h6>
                  <p className="text-sm text-default-500">Office address and map embed</p>
                </div>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">Location address</label>
                  <input
                    type="text"
                    value={data.location.address}
                    onChange={(e) => setData('location', { ...data.location, address: e.target.value })}
                    placeholder="8013 Alderwood St. South San Francisco, CA 94080"
                    className="form-input"
                    disabled={processing}
                  />
                </div>
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">Location map</label>
                  <input
                    type="text"
                    value={data.location.map_url}
                    onChange={(e) => setData('location', { ...data.location, map_url: e.target.value })}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    className="form-input"
                    disabled={processing}
                  />
                  <p className="text-xs text-default-500 mt-1">Paste Google Maps embed URL here</p>
                </div>
              </div>
            </div>

            {/* Phone Section */}
            <div className="card">
              <div className="card-header flex items-center gap-3">
                <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Phone className="size-5 text-blue-500" />
                </div>
                <div>
                  <h6 className="card-title">Phone</h6>
                  <p className="text-sm text-default-500">Contact phone number</p>
                </div>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">Phone number</label>
                  <input
                    type="text"
                    value={data.phone.number}
                    onChange={(e) => setData('phone', { ...data.phone, number: e.target.value })}
                    placeholder="+902930290232"
                    className="form-input"
                    disabled={processing}
                  />
                </div>
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">Details</label>
                  <textarea
                    value={data.phone.details}
                    onChange={(e) => setData('phone', { ...data.phone, details: e.target.value })}
                    placeholder="The phrasal sequence of the is now so that many campaign and benefit."
                    className="form-input min-h-[100px]"
                    disabled={processing}
                  />
                </div>
              </div>
            </div>

            {/* Email Section */}
            <div className="card">
              <div className="card-header flex items-center gap-3">
                <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Mail className="size-5 text-amber-500" />
                </div>
                <div>
                  <h6 className="card-title">Email</h6>
                  <p className="text-sm text-default-500">Contact email address</p>
                </div>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">Email address</label>
                  <input
                    type="email"
                    value={data.email.address}
                    onChange={(e) => setData('email', { ...data.email, address: e.target.value })}
                    placeholder="contact@mail.com"
                    className="form-input"
                    disabled={processing}
                  />
                </div>
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">Email details</label>
                  <textarea
                    value={data.email.details}
                    onChange={(e) => setData('email', { ...data.email, details: e.target.value })}
                    placeholder="The phrasal sequence of the is now so that many campaign and benefit."
                    className="form-input min-h-[100px]"
                    disabled={processing}
                  />
                </div>
              </div>
            </div>

            {/* Contact Form Section */}
            <div className="card">
              <div className="card-header flex items-center gap-3">
                <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <MessageSquare className="size-5 text-purple-500" />
                </div>
                <div>
                  <h6 className="card-title">Contact Form</h6>
                  <p className="text-sm text-default-500">Settings for the contact form</p>
                </div>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">Recipient Email (for the contact form)</label>
                  <input
                    type="email"
                    value={data.contact_form.recipient_email}
                    onChange={(e) => setData('contact_form', { ...data.contact_form, recipient_email: e.target.value })}
                    placeholder="support@company.com"
                    className="form-input"
                    disabled={processing}
                  />
                  <p className="text-xs text-default-500 mt-1">Contact form submissions will be sent to this email</p>
                </div>
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

