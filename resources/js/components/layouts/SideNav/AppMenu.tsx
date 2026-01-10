import { Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { LuChevronRight } from 'react-icons/lu';
import { menuItemsData, type MenuItemType } from './menu';
import { getAllMenuHrefs, isItemActive, isMenuActive } from './navigation-utils';
import type { SharedData } from '@/types';
import { useUnreadChatListener } from '@/hooks/usePusher';
import { useLanguageContext } from '@/context/useLanguageContext';

const MenuItemWithChildren = ({ item, allHrefs, t }: { item: MenuItemType; allHrefs: string[]; t: (key: string) => string }) => {
  const { url } = usePage();
  const Icon = item.icon;

  const isActive = isItemActive(item, url, allHrefs);

  return (
    <li className={`menu-item hs-accordion ${isActive ? 'active' : ''}`}>
      <button
        className={`hs-accordion-toggle menu-link ${isActive ? 'active' : ''}`}
      >
        {Icon && (
          <span className="menu-icon">
            <Icon />
          </span>
        )}
        <span className="menu-text">{t(item.label)}</span>
        <span className="menu-arrow">
          <LuChevronRight />
        </span>
      </button>

      <ul
        className={`sub-menu hs-accordion-content hs-accordion-group ${isActive ? 'block' : 'hidden'
          }`}
      >
        {item.children?.map((child: MenuItemType) =>
          child.children ? (
            <MenuItemWithChildren key={child.key} item={child} allHrefs={allHrefs} t={t} />
          ) : (
            <MenuItem key={child.key} item={child} allHrefs={allHrefs} t={t} />
          )
        )}
      </ul>
    </li>
  );
};

const MenuItem = ({ item, allHrefs, t }: { item: MenuItemType; allHrefs: string[]; t: (key: string) => string }) => {
  const { url } = usePage();
  const Icon = item.icon;
  const isActive = item.href ? isMenuActive(url, item.href, allHrefs) : false;

  return (
    <li className={`menu-item ${isActive ? 'active' : ''}`}>
      <Link href={item.href ?? '#'} className={`menu-link ${isActive ? 'active' : ''}`}>
        {Icon && (
          <span className="menu-icon">
            <Icon />
          </span>
        )}
        <div className="menu-text">{t(item.label)}</div>
        {item.badge !== undefined && item.badge !== 0 && item.badge !== '' && (
          <span
            className={`ms-auto px-2 py-0.5 rounded-full text-xs font-medium ${item.badgeColor || 'bg-primary text-white'
              }`}
          >
            {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </Link>
    </li>
  );
};

const AppMenu = () => {
  const { props, url } = usePage<SharedData>();
  const { t } = useLanguageContext();
  const initialUnreadCount = props.unreadChatCount || 0;

  // Use local state for real-time updates
  const [unreadChatCount, setUnreadChatCount] = useState(initialUnreadCount);

  // Reset count when navigating to chat page (messages get marked as read)
  useEffect(() => {
    if (url.startsWith('/chat/')) {
      setUnreadChatCount(0);
    }
  }, [url]);

  // Sync with server data on page navigation
  useEffect(() => {
    setUnreadChatCount(initialUnreadCount);
  }, [initialUnreadCount]);

  // Listen for real-time unread message notifications
  useUnreadChatListener(() => {
    // Only increment if we're not currently on the chat page
    if (!url.startsWith('/chat/')) {
      setUnreadChatCount((prev) => prev + 1);
    }
  });

  // Get all hrefs from menu items for proper active state detection
  const allHrefs = useMemo(() => getAllMenuHrefs(menuItemsData), []);

  // Enhance menu items with dynamic data
  const enhancedMenuItems = useMemo(() => {
    return menuItemsData.map(item => {
      // Add badge to Chat menu item
      if (item.key === 'Chat') {
        return {
          ...item,
          badge: unreadChatCount,
          badgeColor: 'bg-primary text-white'
        };
      }
      return item;
    });
  }, [unreadChatCount]);

  return (
    <ul className="side-nav p-3 hs-accordion-group">
      {enhancedMenuItems.map((item: MenuItemType) =>
        item.isTitle ? (
          <li className="menu-title" key={item.key}>
            <span>{t(item.label)}</span>
          </li>
        ) : item.children ? (
          <MenuItemWithChildren key={item.key} item={item} allHrefs={allHrefs} t={t} />
        ) : (
          <MenuItem key={item.key} item={item} allHrefs={allHrefs} t={t} />
        )
      )}
    </ul>
  );
};

export default AppMenu;

