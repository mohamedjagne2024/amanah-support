import { Link } from '@inertiajs/react';
import SimplebarClient from '@/components/client-wrapper/SimplebarClient';
import AppMenu from './AppMenu';
import HoverToggle from './HoverToggle';

const Sidebar = () => {
  return (
    <aside id="app-menu" className="app-menu">
      <Link
        href="/analytics"
        className="logo-box sticky top-0 flex min-h-topbar-height items-center justify-start px-6 backdrop-blur-xs"
      >
        <div className="logo-light">
          <img src="/assets/images/logo-light.png" className="logo-lg w-30" alt="Light logo"/>
          <img src="/assets/images/logo-sm.png" className="logo-sm h-6" alt="Small logo" />
        </div>

        <div className="logo-dark">
          <img src="/assets/images/logo-dark.png" className="logo-lg w-30" alt="Dark logo" />
          <img src="/assets/images/logo-sm.png" className="logo-sm h-6" alt="Small logo" />
        </div>
      </Link>

      <HoverToggle />

      <div className="relative min-h-0 flex-grow">
        <SimplebarClient className="size-full">
          <AppMenu />
        </SimplebarClient>
      </div>
    </aside>
  );
};

export default Sidebar;
