import { Link, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { LuChevronRight } from 'react-icons/lu';
import { menuItemsData, type MenuItemType } from './menu';
import { getAllMenuHrefs, isItemActive, isMenuActive } from './navigation-utils';
import type { SharedData } from '@/types';

const MenuItemWithChildren = ({ item, allHrefs }: { item: MenuItemType; allHrefs: string[] }) => {
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
        <span className="menu-text">{item.label}</span>
        <span className="menu-arrow">
          <LuChevronRight />
        </span>
      </button>

      <ul
        className={`sub-menu hs-accordion-content hs-accordion-group ${
          isActive ? 'block' : 'hidden'
        }`}
      >
        {item.children?.map((child: MenuItemType) =>
          child.children ? (
            <MenuItemWithChildren key={child.key} item={child} allHrefs={allHrefs} />
          ) : (
            <MenuItem key={child.key} item={child} allHrefs={allHrefs} />
          )
        )}
      </ul>
    </li>
  );
};

const MenuItem = ({ item, allHrefs }: { item: MenuItemType; allHrefs: string[] }) => {
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
        <div className="menu-text">{item.label}</div>
        {item.badge !== undefined && item.badge !== 0 && item.badge !== '' && (
          <span 
            className={`ms-auto px-2 py-0.5 rounded-full text-xs font-medium ${
              item.badgeColor || 'bg-primary text-white'
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
  const { props } = usePage<SharedData>();
  const unreadChatCount = props.unreadChatCount || 0;

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
            <span>{item.label}</span>
          </li>
        ) : item.children ? (
          <MenuItemWithChildren key={item.key} item={item} allHrefs={allHrefs} />
        ) : (
          <MenuItem key={item.key} item={item} allHrefs={allHrefs} />
        )
      )}
    </ul>
  );
};

export default AppMenu;
