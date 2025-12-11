import type { IconType } from 'react-icons/lib';
import {
  LuChartArea,
  LuMonitorDot,
  LuPictureInPicture2,
  LuSettings,
  LuShield,
  LuUser,
  LuWrench,
} from 'react-icons/lu';

export type MenuItemType = {
  key: string;
  label: string;
  isTitle?: boolean;
  href?: string;
  children?: MenuItemType[];

  icon?: IconType;
  parentKey?: string;
  target?: string;
  isDisabled?: boolean;
};

export const menuItemsData: MenuItemType[] = [
  {
    key: 'Overview',
    label: 'Overview',
    isTitle: true,
  },
  {
    key: 'Dashboard',
    label: 'Dashboard',
    icon: LuMonitorDot,
    href: '/',
  },
  {
    key: 'Management',
    label: 'Management',
    isTitle: true,
  },
  {
    key: 'Asset Management',
    label: 'Asset Management',
    icon: LuPictureInPicture2,
    children: [
      { key: 'Purchase Orders', label: 'Purchase Orders', href: '/purchase-orders'},
      { key: 'All Assets', label: 'All Assets', href: '/asset-management'},
      { key: 'Categories', label: 'Categories', href: '/categories'},
      { key: 'Subcategories', label: 'Subcategories', href: '/subcategories'},
      { key: 'Departments', label: 'Departments', href: '/departments'},
      { key: 'Locations', label: 'Locations', href: '/locations'},
      { key: 'Staff', label: 'Staff', href: '/staffs'},
    ],
  },
  {
    key: 'Maintenance',
    label: 'Maintenance',
    icon: LuWrench,
    children: [
      { key: 'Work Orders', label: 'Work Orders', href: '/work-orders'},
      { key: 'Request', label: 'Request', href: '/work-orders/request'},
    ],
  },
  {
    key: 'Reports',
    label: 'Reports',
    icon: LuChartArea,
    children: [
      { key: 'Asset Summary', label: 'Asset Summary', href: '/reports/asset-summary'},
      { key: 'Maintenance Insights', label: 'Maintenance Insights', href: '/reports/maintenance-insights'},
      { key: 'Maintenance Activity Report', label: 'Maintenance Activity Report', href: '/reports/maintenance-activity-report'},
      { key: 'Maintenance by Staff', label: 'Maintenance by Staff', href: '/reports/maintenance-by-staff'},
      { key: 'Purchase Order', label: 'Purchase Order', href: '/reports/purchase-order-report'},
    ],
  },
  {
    key: 'Settings',
    label: 'Settings',
    isTitle: true,
  },
  {
    key: 'General Settings',
    label: 'General Settings',
    icon: LuSettings,
    href: '/settings/general',
  },
  {
    key: 'User Management',
    label: 'User Management',
    icon: LuUser,
    href: '/settings/user-management',
  },
  {
    key: 'Roles & Permissions',
    label: 'Roles & Permissions',
    icon: LuShield,
    href: '/roles',
  },
];
