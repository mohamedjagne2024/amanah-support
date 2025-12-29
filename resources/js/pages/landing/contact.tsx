import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Send,
  CheckCircle,
} from 'lucide-react';
import PageMeta from '@/components/PageMeta';
import PublicLayout from '@/layouts/public-layout';

type PageData = {
  content?: {
    text?: string;
    details?: string;
  };
  location?: {
    address?: string;
    map_url?: string;
  };
  phone?: {
    number?: string;
    details?: string;
  };
  email?: {
    address?: string;
    details?: string;
  };
  contact_form?: {
    recipient_email?: string;
  };
};

type ContactPageProps = {
  title: string;
  data: {
    id: number;
    title: string;
    slug: string;
    is_active: boolean;
    html: PageData | null;
  } | null;
  site_key?: string;
  footer?: any;
};

export default function Contact({ title, data: pageInfo, footer }: ContactPageProps & { footer?: any }) {
  const [submitted, setSubmitted] = useState(false);

  const pageData = pageInfo?.html || {};
  const content = pageData.content || {};
  const location = pageData.location || {};
  const phone = pageData.phone || {};
  const email = pageData.email || {};

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/contact', {
      onSuccess: () => {
        reset();
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
      },
    });
  };

  return (
    <>
      <PageMeta title={title || 'Contact Us'} />
      
      <PublicLayout currentPage="/contact" footer={footer}>
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold uppercase tracking-wider mb-4">
              Contact
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-default-900 mb-4">
              {content.text || 'Get In Touch With Us'}
            </h1>
            {content.details && (
              <p className="text-lg text-default-600 max-w-2xl mx-auto">
                {content.details}
              </p>
            )}
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Location Card */}
              {location.address && (
                <div className="card text-center">
                  <div className="card-body">
                    <div className="size-14 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                      <MapPin className="size-7 text-success" />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900 mb-2">Our Location</h3>
                    <p className="text-default-600 text-sm">{location.address}</p>
                  </div>
                </div>
              )}

              {/* Phone Card */}
              {phone.number && (
                <div className="card text-center">
                  <div className="card-body">
                    <div className="size-14 rounded-xl bg-info/10 flex items-center justify-center mx-auto mb-4">
                      <Phone className="size-7 text-info" />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900 mb-2">Phone Number</h3>
                    <a 
                      href={`tel:${phone.number}`} 
                      className="text-primary font-medium hover:underline"
                    >
                      {phone.number}
                    </a>
                    {phone.details && (
                      <p className="text-default-500 mt-2 text-sm">{phone.details}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Email Card */}
              {email.address && (
                <div className="card text-center">
                  <div className="card-body">
                    <div className="size-14 rounded-xl bg-warning/10 flex items-center justify-center mx-auto mb-4">
                      <Mail className="size-7 text-warning" />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900 mb-2">Email Address</h3>
                    <a 
                      href={`mailto:${email.address}`} 
                      className="text-primary font-medium hover:underline"
                    >
                      {email.address}
                    </a>
                    {email.details && (
                      <p className="text-default-500 mt-2 text-sm">{email.details}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Map & Contact Form Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Map */}
              {location.map_url && (
                <div className="card overflow-hidden">
                  <iframe
                    src={location.map_url}
                    width="100%"
                    height="450"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}

              {/* Contact Form */}
              <div className={`card ${!location.map_url ? 'lg:col-span-2 max-w-2xl mx-auto w-full' : ''}`}>
                <div className="card-header">
                  <h6 className="card-title">Send Us a Message</h6>
                  <p className="text-sm text-default-500">Fill out the form below and we'll get back to you as soon as possible.</p>
                </div>
                <div className="card-body">
                  {submitted && (
                    <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg flex items-center gap-3 text-success">
                      <CheckCircle className="size-5" />
                      <span>Thank you! Your message has been sent successfully.</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block font-medium text-default-900 text-sm mb-2">
                          Your Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          value={data.name}
                          onChange={(e) => setData('name', e.target.value)}
                          className="form-input"
                          placeholder="John Doe"
                          disabled={processing}
                          required
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
                          required
                        />
                        {errors.email && <p className="text-danger text-sm mt-1">{errors.email}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium text-default-900 text-sm mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        className="form-input"
                        placeholder="+1 234 567 8900"
                        disabled={processing}
                      />
                      {errors.phone && <p className="text-danger text-sm mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="block font-medium text-default-900 text-sm mb-2">
                        Message <span className="text-danger">*</span>
                      </label>
                      <textarea
                        value={data.message}
                        onChange={(e) => setData('message', e.target.value)}
                        className="form-input min-h-[150px]"
                        placeholder="Write your message here..."
                        disabled={processing}
                        required
                      />
                      {errors.message && <p className="text-danger text-sm mt-1">{errors.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={processing}
                      className="btn bg-primary text-white w-full"
                    >
                      {processing ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="inline-block border-2 border-white rounded-full size-4 animate-spin border-s-transparent" />
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Send className="size-4" />
                          Send Message
                        </span>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </PublicLayout>
    </>
  );
}
