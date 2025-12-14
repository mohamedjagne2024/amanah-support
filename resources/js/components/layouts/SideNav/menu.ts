import { LucideBook, LucideBuilding, LucideFileText, LucideHelpCircle, LucideMessageCircle, LucideNotebook, LucideTicket, LucideUser } from 'lucide-react';
import type { IconType } from 'react-icons/lib';
import {
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
};

export const menuItemsData: MenuItemType[] = [
  {
    key: 'Main',
    label: 'Main',
    isTitle: true,
  },
  {
    key: 'Dashboard',
    label: 'Dashboard',
    icon: LuMonitorDot,
    href: '/dashboard',
  },
  {
    key: 'Tickets',
    label: 'Tickets',
    icon: LucideTicket,
    href: '/tickets',
  },
  {
    key: 'Content',
    label: 'Content',
    isTitle: true,
  },
  {
    key: 'Chat',
    label: 'Chat',
    icon: LucideMessageCircle,
    href: '/chat',
  },
  {
    key: 'Knowledge Base',
    label: 'Knowledge Base',
    icon: LucideBook,
    href: '/knowledge-base',
  },
  {
    key: 'FAQs',
    label: 'FAQs',
    icon: LucideHelpCircle,
    href: '/faqs',
  },
  {
    key: 'Front Pages',
    label: 'Front Pages',
    icon: LucideFileText,
    children: [
      { key: 'Home', label: 'Home', href: '/front-pages/home'},
      { key: 'Contact', label: 'Contact', href: '/front-pages/contact'},
      { key: 'Services', label: 'Services', href: '/front-pages/services'},
      { key: 'Privacy Policy', label: 'Privacy Policy', href: '/front-pages/privacy-policy'},
      { key: 'Terms of Services', label: 'Terms of Services', href: '/front-pages/terms-of-services'},
      { key: 'Footer', label: 'Footer', href: '/front-pages/footer'},
    ],
  },
  {
    key: 'Management',
    label: 'Management',
    isTitle: true,
  },
  {
    key: 'Customers',
    label: 'Customers',
    icon: LucideUser,
    href: '/customers',
  },
  {
    key: 'Notes',
    label: 'Notes',
    icon: LucideNotebook,
    href: '/notes',
  },
  {
    key: 'Contacts',
    label: 'Contacts',
    icon: LucideUser,
    href: '/contacts',
  },
  {
    key: 'Organizations',
    label: 'Organizations',
    icon: LucideBuilding,
    href: '/categories',
  },
  {
    key: 'Configuration',
    label: 'Configuration',
    isTitle: true,
  },
  {
    key: 'Settings',
    label: 'Settings',
    icon: LuSettings,
    children: [
      { key: 'General', label: 'General', href: '/settings/general'},
      { key: 'Departments', label: 'Departments', href: '/settings/departments'},
      { key: 'Categories', label: 'Categories', href: '/settings/categories'},
      { key: 'Priorities', label: 'Priorities', href: '/settings/priorities'},
      { key: 'Status', label: 'Status', href: '/settings/statuses'},
      { key: 'Types', label: 'Types', href: '/settings/types'},
      { key: 'Email Templates', label: 'Email Templates', href: '/settings/email-templates'},
      { key: 'SMTP Mail', label: 'SMTP', href: '/settings/smtp'},
      { key: 'Pusher Chat', label: 'Pusher Chat', href: '/settings/pusher-chat'},
    ],
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
