import { Link } from '@inertiajs/react';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

type FooterLink = {
  label: string;
  href: string;
};

type FooterData = {
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  company_name?: string;
  copyright_text?: string;
  social?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
};

type LandingFooterProps = {
  footerData?: {
    html?: FooterData;
  };
};

const mainLinks: FooterLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Knowledge Base', href: '/kb' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
];

const legalLinks: FooterLink[] = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

export default function LandingFooter({ 
  footerData
}: LandingFooterProps) {
  const customFooter = footerData?.html || {};
  const companyName = customFooter.company_name || 'Amanah Support';
  const copyrightText = customFooter.copyright_text || 'All rights reserved.';
  const social = customFooter.social || {};

  const hasSocialLinks = social.facebook || social.twitter || social.instagram || social.linkedin;

  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-default-900">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="/assets/images/logo-dark.png" alt={`${companyName} Logo`} className="w-32" />
            </Link>
            <p className="text-default-400 text-sm">
              {customFooter.description || 'Professional support desk solution for your business needs.'}
            </p>
            
            {/* Social Media Links */}
            {hasSocialLinks && (
              <div className="flex items-center gap-3 mt-4">
                {social.facebook && (
                  <a 
                    href={social.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="size-8 rounded-full bg-default-800 flex items-center justify-center text-default-400 hover:bg-primary hover:text-white transition-colors"
                  >
                    <Facebook className="size-4" />
                  </a>
                )}
                {social.twitter && (
                  <a 
                    href={social.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="size-8 rounded-full bg-default-800 flex items-center justify-center text-default-400 hover:bg-primary hover:text-white transition-colors"
                  >
                    <Twitter className="size-4" />
                  </a>
                )}
                {social.instagram && (
                  <a 
                    href={social.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="size-8 rounded-full bg-default-800 flex items-center justify-center text-default-400 hover:bg-primary hover:text-white transition-colors"
                  >
                    <Instagram className="size-4" />
                  </a>
                )}
                {social.linkedin && (
                  <a 
                    href={social.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="size-8 rounded-full bg-default-800 flex items-center justify-center text-default-400 hover:bg-primary hover:text-white transition-colors"
                  >
                    <Linkedin className="size-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {mainLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-default-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-default-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-default-400 text-sm">
              {customFooter.email && (
                <li>
                  <a href={`mailto:${customFooter.email}`} className="hover:text-white transition-colors">
                    {customFooter.email}
                  </a>
                </li>
              )}
              {customFooter.phone && (
                <li>
                  <a href={`tel:${customFooter.phone}`} className="hover:text-white transition-colors">
                    {customFooter.phone}
                  </a>
                </li>
              )}
              {customFooter.address && (
                <li className="whitespace-pre-line">{customFooter.address}</li>
              )}
              {!customFooter.email && !customFooter.phone && !customFooter.address && (
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Get in touch
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-default-700 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-default-500 text-sm">
              © {new Date().getFullYear()} {companyName}. {copyrightText}
            </p>
            <div className="flex flex-wrap items-center gap-6">
              {legalLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="text-default-500 hover:text-white transition-colors text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
