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
  permissions?: string[];
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
    permissions: ['dashboard.view'],
  },
  {
    key: 'Tickets',
    label: 'menus.tickets',
    icon: LucideTicket,
    href: '/tickets',
    permissions: ['tickets.view'],
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
    permissions: ['chat.view'],
  },
  {
    key: 'Knowledge Base',
    label: 'menus.knowledgeBase',
    icon: LucideBook,
    href: '/knowledge-base',
    permissions: ['knowledge_base.view'],
  },
  {
    key: 'FAQs',
    label: 'menus.faqs',
    icon: LucideHelpCircle,
    href: '/faqs',
    permissions: ['faqs.view'],
  },
  {
    key: 'Front Pages',
    label: 'menus.frontPages',
    icon: LucideFileText,
    permissions: ['front_pages.view'],
    children: [
      { key: 'Home', label: 'menus.home', href: '/front_pages/home', permissions: ['front_pages.home'] },
      { key: 'Contact', label: 'menus.contact', href: '/front_pages/contact', permissions: ['front_pages.contact'] },
      { key: 'Services', label: 'menus.services', href: '/front_pages/services', permissions: ['front_pages.services'] },
      { key: 'Privacy Policy', label: 'menus.privacyPolicy', href: '/front_pages/privacy', permissions: ['front_pages.privacy'] },
      { key: 'Terms of Services', label: 'menus.termsAndConditions', href: '/front_pages/terms', permissions: ['front_pages.terms'] },
      { key: 'Footer', label: 'menus.footer', href: '/front_pages/footer', permissions: ['front_pages.footer'] },
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
    permissions: ['contacts.view'],
  },
  {
    key: 'Notes',
    label: 'menus.notes',
    icon: LucideNotebook,
    href: '/notes',
    permissions: ['notes.view'],
  },
  {
    key: 'Organizations',
    label: 'menus.organizations',
    icon: LucideBuilding,
    href: '/organizations',
    permissions: ['organizations.view'],
  },
  {
    key: 'Reports',
    label: 'menus.reports',
    icon: LuChartBar,
    permissions: ['reports.view'],
    children: [
      { key: 'Staff Performance', label: 'menus.staffPerformance', href: '/reports/staff-performance', permissions: ['reports.staff-performance'] },
      { key: 'Support By Organization', label: 'menus.supportByOrganization', href: '/reports/support-by-organization', permissions: ['reports.support-by-organization'] },
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
    permissions: ['settings.view'],
    children: [
      { key: 'General', label: 'menus.general', href: '/settings/general', permissions: ['settings.general'] },
      { key: 'Regions', label: 'menus.regions', href: '/settings/regions', permissions: ['settings.regions'] },
      { key: 'Categories', label: 'menus.categories', href: '/settings/categories', permissions: ['settings.categories'] },
      { key: 'Types', label: 'menus.types', href: '/settings/types', permissions: ['settings.types'] },
      { key: 'Email Templates', label: 'menus.emailTemplates', href: '/settings/templates', permissions: ['settings.templates'] },
      { key: 'SMTP Mail', label: 'menus.smtp', href: '/settings/smtp', permissions: ['settings.smtp'] },
      { key: 'Pusher Chat', label: 'menus.pusherChat', href: '/settings/pusher', permissions: ['settings.pusher'] },
    ],
  },
  {
    key: 'User Management',
    label: 'menus.userManagement',
    icon: LuUser,
    href: '/settings/user-management',
    permissions: ['settings.user-management'],
  },
  {
    key: 'Roles & Permissions',
    label: 'menus.roleandPermission',
    icon: LuShield,
    href: '/roles',
    permissions: ['roles.view']
  },
];
