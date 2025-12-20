import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Menu, X as XIcon, User as UserIcon, LogOut } from 'lucide-react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { logout } from '@/routes';
import type { SharedData, Auth } from '@/types';

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
  const { auth } = usePage<SharedData>().props;
  
  const isLoggedIn = !!auth?.user;
  const userRoles = (auth as Auth & { roles?: string[] })?.roles || [];
  const isContact = userRoles.includes('Contact');

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

            {/* My Tickets Button - Show when logged in as Contact */}
            {isLoggedIn && isContact && (
              <Link 
                href="/contact/tickets" 
                className="btn border-default-200 text-default-900 font-semibold"
              >
                My Tickets
              </Link>
            )}

            {/* Profile Dropdown - Show when logged in */}
            {isLoggedIn && (
              <Popover>
                <PopoverButton className="size-10 rounded-full bg-default-100 flex items-center justify-center hover:bg-default-200 transition-colors focus:outline-none data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-primary">
                  <UserIcon className="size-5 text-default-600" />
                </PopoverButton>
                <PopoverPanel
                  transition
                  anchor="bottom end"
                  className="w-48 bg-white rounded-lg shadow-lg border border-default-200 py-2 z-50 transition duration-200 ease-in-out data-[closed]:-translate-y-1 data-[closed]:opacity-0"
                >
                  <Link
                    href={isContact ? "/profile" : "/dashboard"}
                    className="flex items-center gap-3 px-4 py-2 text-primary hover:bg-default-50 transition-colors"
                  >
                    {isContact ? 'Edit profile' : 'Dashboard'}
                  </Link>
                  <button
                    type="button"
                    onClick={() => router.post(logout.url())}
                    className="flex items-center gap-3 px-4 py-2 text-primary hover:bg-default-50 transition-colors w-full text-left"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </button>
                </PopoverPanel>
              </Popover>
            )}

            {/* Login Button - Only show when NOT logged in */}
            {!isLoggedIn && showLogin && (
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

              {/* My Tickets Button - Show when logged in as Contact */}
              {isLoggedIn && isContact && (
                <Link 
                  href="/contacts/tickets" 
                  className="btn border-default-200 text-default-900 font-semibold w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Tickets
                </Link>
              )}

              {/* Profile Links - Show when logged in */}
              {isLoggedIn && (
                <>
                  <Link
                    href={isContact ? "/profile" : "/dashboard"}
                    className="py-2 text-default-600 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {isContact ? 'Edit profile' : 'Dashboard'}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      router.post(logout.url());
                      setMobileMenuOpen(false);
                    }}
                    className="py-2 text-left text-default-600 hover:text-primary"
                  >
                    Logout
                  </button>
                </>
              )}

              {/* Login Button - Only show when NOT logged in */}
              {!isLoggedIn && showLogin && (
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

