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
  Briefcase,
  Globe,
  Heart,
  Zap,
  Award,
  Target,
  Layers,
  Database,
  Server,
  Code,
} from 'lucide-react';
import { useMemo } from 'react';
import PageMeta from '@/components/PageMeta';
import PublicLayout from '@/layouts/public-layout';

type ServiceItem = {
  name: string;
  icon: string;
  details: string;
};

type PageData = {
  content?: {
    tagline?: string;
    title?: string;
    description?: string;
  };
  services?: ServiceItem[];
};

type ServicesPageProps = {
  title: string;
  data: {
    id: number;
    title: string;
    slug: string;
    is_active: boolean;
    html: PageData | string | null;
  } | null;
  footer?: any;
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
  briefcase: Briefcase,
  globe: Globe,
  heart: Heart,
  zap: Zap,
  award: Award,
  target: Target,
  layers: Layers,
  database: Database,
  server: Server,
  code: Code,
};

const getIcon = (iconName: string) => {
  return iconMap[iconName] || Briefcase;
};

export default function Services({ title, data: pageInfo, footer }: ServicesPageProps) {
  const pageData = useMemo(() => {
    if (!pageInfo?.html) return {};
    try {
      return typeof pageInfo.html === 'string' ? JSON.parse(pageInfo.html) : pageInfo.html;
    } catch (e) {
      console.error('Error parsing page data:', e);
      return {};
    }
  }, [pageInfo?.html]);
  const content = pageData.content || {};
  const services = pageData.services || [];

  return (
    <>
      <PageMeta title={title || 'Services'} />

      <PublicLayout currentPage="/services" footer={footer}>
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            {content.tagline && (
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold uppercase tracking-wider mb-4">
                {content.tagline}
              </span>
            )}
            <h1 className="text-4xl sm:text-5xl font-bold text-default-900 mb-4">
              {content.title || 'Our Services'}
            </h1>
            {content.description && (
              <p className="text-lg text-default-600 max-w-2xl mx-auto">
                {content.description}
              </p>
            )}
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {services.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase className="size-16 mx-auto mb-4 text-default-300" />
                <p className="text-default-500 text-lg">No services available at the moment.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service, index) => {
                  const Icon = getIcon(service.icon);
                  return (
                    <div
                      key={index}
                      className="card group hover:shadow-lg transition-all duration-300"
                    >
                      <div className="card-body">
                        <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                          <Icon className="size-7 text-primary group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-xl font-semibold text-default-900 mb-3">
                          {service.name}
                        </h3>
                        <div
                          className="text-default-600 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: service.details }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Contact us today to learn more about how we can help you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/contact"
                className="btn bg-white text-primary hover:bg-white/90"
              >
                Contact Us
              </a>
              <a
                href="/ticket/open"
                className="btn border-2 border-white text-white hover:bg-white/10"
              >
                Submit a Ticket
              </a>
            </div>
          </div>
        </section>
      </PublicLayout>
    </>
  );
}
