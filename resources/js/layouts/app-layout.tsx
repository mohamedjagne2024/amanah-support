import type { ReactNode } from 'react';
import Footer from '@/components/layouts/Footer';
import Sidebar from '@/components/layouts/SideNav';
import Topbar from '@/components/layouts/topbar';
import ProvidersWrapper from '@/components/ProvidersWrapper';
import Toastify from '@/components/Toastify';

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <ProvidersWrapper>
      <div className="wrapper">
        <Sidebar />
        <div className="page-content">
          <Topbar />
          {children}
          <Footer />
        </div>
      </div>
      <Toastify />
    </ProvidersWrapper>
  );
};

export default Layout;
