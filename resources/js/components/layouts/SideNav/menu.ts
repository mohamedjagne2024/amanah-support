import { LucideBook, LucideBuilding, LucideFileText, LucideHelpCircle, LucideMessageCircle, LucideNotebook, LucideTicket, LucideUser } from 'lucide-react';
import type { IconType } from 'react-icons/lib';
import {
  LuChartBar,
  LuMonitorDot,
  LuSettings,
  LuShield,
  LuUser,
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
  badge?: number | string;
  badgeColor?: string;
};

export const menuItemsData: MenuItemType[] = [
  {
    key: 'Main',
    label: 'menus.main',
    isTitle: true,
  },
  {
    key: 'Dashboard',
    label: 'menus.dashboard',
    icon: LuMonitorDot,
    href: '/dashboard',
  },
  {
    key: 'Tickets',
    label: 'menus.tickets',
    icon: LucideTicket,
    href: '/tickets',
  },
  {
    key: 'Content',
    label: 'menus.content',
    isTitle: true,
  },
  {
    key: 'Chat',
    label: 'menus.chat',
    icon: LucideMessageCircle,
    href: '/chat',
  },
  {
    key: 'Knowledge Base',
    label: 'menus.knowledgeBase',
    icon: LucideBook,
    href: '/knowledge-base',
  },
  {
    key: 'FAQs',
    label: 'menus.faqs',
    icon: LucideHelpCircle,
    href: '/faqs',
  },
  {
    key: 'Front Pages',
    label: 'menus.frontPages',
    icon: LucideFileText,
    children: [
      { key: 'Home', label: 'menus.home', href: '/front_pages/home'},
      { key: 'Contact', label: 'menus.contact', href: '/front_pages/contact'},
      { key: 'Services', label: 'menus.services', href: '/front_pages/services'},
      { key: 'Privacy Policy', label: 'menus.privacyPolicy', href: '/front_pages/privacy'},
      { key: 'Terms of Services', label: 'menus.termsAndConditions', href: '/front_pages/terms'},
      { key: 'Footer', label: 'menus.footer', href: '/front_pages/footer'},
    ],
  },
  {
    key: 'Management',
    label: 'menus.management',
    isTitle: true,
  },
  {
    key: 'Contacts',
    label: 'menus.contacts',
    icon: LucideUser,
    href: '/contacts',
  },
  {
    key: 'Notes',
    label: 'menus.notes',
    icon: LucideNotebook,
    href: '/notes',
  },
  {
    key: 'Organizations',
    label: 'menus.organizations',
    icon: LucideBuilding,
    href: '/organizations',
  },
  {
    key: 'Reports',
    label: 'menus.reports',
    icon: LuChartBar,
    children: [
      { key: 'Staff Performance', label: 'menus.staffPerformance', href: '/reports/staff-performance'},
      { key: 'Support By Organization', label: 'menus.supportByOrganization', href: '/reports/support-by-organization'},
    ],
  },
  {
    key: 'Configuration',
    label: 'menus.configurations',
    isTitle: true,
  },
  {
    key: 'Settings',
    label: 'menus.settings',
    icon: LuSettings,
    children: [
      { key: 'General', label: 'menus.general', href: '/settings/general'},
      { key: 'Regions', label: 'menus.regions', href: '/settings/regions'},
      { key: 'Categories', label: 'menus.categories', href: '/settings/categories'},
      { key: 'Types', label: 'menus.types', href: '/settings/types'},
      { key: 'Email Templates', label: 'menus.emailTemplates', href: '/settings/templates'},
      { key: 'SMTP Mail', label: 'menus.smtp', href: '/settings/smtp'},
      { key: 'Pusher Chat', label: 'menus.pusherChat', href: '/settings/pusher'},
    ],
  },
  {
    key: 'User Management',
    label: 'menus.userManagement',
    icon: LuUser,
    href: '/settings/user-management',
  },
  {
    key: 'Roles & Permissions',
    label: 'menus.roleandPermission',
    icon: LuShield,
    href: '/roles',
  },
];
