import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { Ticket, Menu, X as XIcon } from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  isActive?: boolean;
};

type LandingNavProps = {
  currentPage?: string;
  showLogin?: boolean;
};

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Knowledge Base', href: '/kb' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
];

export default function LandingNav({ 
  currentPage, 
  showLogin = true 
}: LandingNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    // Exact match
    if (currentPage === href) return true;
    
    // Home page special case
    if (href === '/') {
      return currentPage === 'home' || currentPage === '/' || !currentPage;
    }
    
    // For other pages, match the path segment
    if (currentPage && currentPage !== '/' && currentPage !== 'home') {
      const hrefPath = href.replace(/^\//, '');
      const currentPath = currentPage.replace(/^\//, '');
      return currentPath === hrefPath || currentPath.startsWith(hrefPath + '/');
    }
    
    return false;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-b border-default-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
              <img src="/assets/images/logo-dark.png" alt="Amanah Support Logo" className="w-32" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors font-medium ${
                  isActive(item.href)
                    ? 'text-primary'
                    : 'text-default-600 hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {showLogin && (
              <Link 
                href="/login" 
                className="btn bg-primary text-white"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-default-100"
          >
            {mobileMenuOpen ? <XIcon className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-default-200">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`py-2 ${
                    isActive(item.href)
                      ? 'text-primary'
                      : 'text-default-600 hover:text-primary'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {showLogin && (
                <Link 
                  href="/login" 
                  className="btn bg-primary text-white w-full mt-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

