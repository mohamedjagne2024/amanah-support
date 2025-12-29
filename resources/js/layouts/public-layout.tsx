import type { ReactNode } from 'react';
import { LandingNav, LandingFooter } from '@/components/landing';
import ChatWidget from '@/components/ChatWidget';
import Toastify from '@/components/Toastify';

type FooterData = {
  html?: {
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
};

type PublicLayoutProps = {
  children: ReactNode;
  currentPage?: string;
  footer?: FooterData;
  showChatWidget?: boolean;
  showToast?: boolean;
  className?: string;
};

/**
 * Public Landing Page Layout
 * 
 * This layout is used for all public-facing landing pages that don't require authentication.
 * It includes the LandingNav, LandingFooter, and optional ChatWidget.
 * 
 * Usage:
 * ```tsx
 * <PublicLayout currentPage="/" footer={footer}>
 *   <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
 *     // Your page content here
 *   </section>
 * </PublicLayout>
 * ```
 */
export default function PublicLayout({
  children,
  currentPage,
  footer,
  showToast = false,
  className = '',
}: PublicLayoutProps) {
  return (
    <>
      <div className={`min-h-screen bg-default-50 ${className}`}>
        {/* Navigation */}
        <LandingNav currentPage={currentPage} />

        {/* Page Content */}
        {children}

        {/* Footer */}
        <LandingFooter footerData={footer} />
      </div>

      {/* Optional Chat Widget */}
      <ChatWidget />

      {/* Optional Toast Notifications */}
      {showToast && <Toastify />}
    </>
  );
}
