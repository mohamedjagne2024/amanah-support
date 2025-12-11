import React, { useEffect } from 'react';

import LayoutProvider from '@/context/useLayoutContext';
import LanguageProvider from '@/context/useLanguageContext';
import { FcmProvider } from '@/components/FcmProvider';
import { usePage } from '@inertiajs/react';

const ProvidersWrapper = ({ children }: { children: React.ReactNode }) => {
  const path = usePage().props.url;

  useEffect(() => {
    import('preline/preline').then(() => {
      if ((window as any).HSStaticMethods) {
        (window as any).HSStaticMethods.autoInit();
      }
    });
  }, []);

  useEffect(() => {
    if ((window as any).HSStaticMethods) {
      (window as any).HSStaticMethods.autoInit();
    }
  }, [path]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      if ((window as any).HSStaticMethods) {
        (window as any).HSStaticMethods.autoInit();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <LanguageProvider>
        <LayoutProvider>
          <FcmProvider autoRequest={false} showForegroundToasts={true}>
            {children}
          </FcmProvider>
        </LayoutProvider>
      </LanguageProvider>
    </>
  );
};

export default ProvidersWrapper;
