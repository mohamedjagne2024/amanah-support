import { Link, router } from '@inertiajs/react';
import { TbSearch } from 'react-icons/tb';
import SimpleBar from 'simplebar-react';
import SidenavToggle from './SidenavToggle';
import ThemeModeToggle from './ThemeModeToggle';
import {
  LuBellRing,
  LuClock,
  LuLogOut,
  LuUser,
  LuBell,
  LuLoader,
  LuCheck,
} from 'react-icons/lu';
import { logout } from '@/routes';
import type { ReactNode } from 'react';
import { useLanguageContext, type LanguageType } from '@/context/useLanguageContext';
import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';
import { useFcmContext } from '@/components/FcmProvider';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

type Language = {
  src: string;
  label: string;
  code: LanguageType;
};

type Tab = {
  id: string;
  title: string;
  active?: boolean;
};

type ApiNotification = {
  id: number;
  feature: string;
  title: string;
  body: string;
  data?: {
    type?: string;
    work_order_id?: string;
    url?: string;
    [key: string]: unknown;
  };
  created_at: string;
  created_at_human: string;
  read_at: string | null;
};

type Notification = {
  type: 'follow' | 'comment' | 'purchase' | 'like';
  avatar?: string;
  icon?: ReactNode;
  text: ReactNode;
  time: string;
  ago: string;
  comment?: string;
};

type ProfileMenuItem = {
  icon?: ReactNode;
  label?: string;
  to?: string;
  badge?: string;
  divider?: boolean;
  isSignOut?: boolean;
};

const languages: Language[] = [
  { src: '/assets/images/flags/us.jpg', label: 'English', code: 'en' as LanguageType },
  { src: '/assets/images/flags/somali.png', label: 'Somali', code: 'so' as LanguageType },
  { src: '/assets/images/flags/arebian.svg', label: 'Arabic', code: 'ar' as LanguageType },
];

// Helper function to get icon based on feature type
const getNotificationIcon = (feature: string): ReactNode => {
  switch (feature) {
    case 'work_order_request':
    case 'work_order_assigned':
    case 'work_order_status_change':
      return <LuBellRing className="size-5 text-primary" />;
    default:
      return <LuBell className="size-5 text-default-500" />;
  }
};

// Profile menu will be created dynamically based on translations

const Topbar = () => {
  const { language, setLanguage, t } = useLanguageContext();
  const { auth } = usePage<SharedData>().props;
  const { permission, isSupported, requestPermission, isLoading, isRegistered } = useFcmContext();
  const [localLoading, setLocalLoading] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  // Get current language info
  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];
  
  // Check if notifications are enabled
  // If notifications aren't supported, show the list normally (fallback behavior)
  const isNotificationsEnabled = !isSupported || (permission === 'granted' && isRegistered);
  const isNotificationsDenied = permission === 'denied';
  const loading = isLoading || localLoading;
  const shouldShowEnableButton = isSupported && !isNotificationsEnabled && !isNotificationsDenied;

  // Fetch notifications
  useEffect(() => {
    if (!isNotificationsEnabled || !auth?.user) {
      return;
    }

    const fetchNotifications = async () => {
      setLoadingNotifications(true);
      try {
        const response = await fetch('/api/notifications?per_page=20', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unread_count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isNotificationsEnabled, auth?.user]);

  // Create tabs based on translations
  const tabs: Tab[] = [
    { id: 'tabsViewall', title: t('tabs.viewAll'), active: true },
  ];

  // Create profile menu based on translations
  const profileMenu: ProfileMenuItem[] = [
    { icon: <LuUser className="size-4" />, label: t('Profile'), to: '/profile' },
    { divider: true },
    {
      icon: <LuLogOut className="size-4" />,
      label: t('profile.signOut'),
      isSignOut: true,
    },
  ];

  const handleLanguageChange = (langCode: LanguageType) => {
    setLanguage(langCode);
  };

  const handleEnableNotifications = async () => {
    if (loading || isNotificationsDenied) return;

    setLocalLoading(true);
    try {
      const token = await requestPermission();
      if (token) {
        toast.success('Push notifications enabled successfully!');
      } else if (Notification.permission === 'denied') {
        toast.error('Notifications blocked. Please enable in browser settings.');
      }
    } catch {
      toast.error('Failed to enable notifications');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <div className="app-header min-h-topbar-height flex items-center sticky top-0 z-30 bg-(--topbar-background) border-b border-default-200">
      <div className="w-full flex items-center justify-between px-6">
        <div className="flex items-center gap-5">
          <SidenavToggle />

          <div className="lg:flex hidden items-center relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <TbSearch className="text-base" />
            </div>
            <input
              type="search"
              id="topbar-search"
              className="form-input px-12 text-sm rounded border-transparent focus:border-transparent w-60"
              placeholder={t('common.search')}
            />
            <button type="button" className="absolute inset-y-0 end-0 flex items-center pe-4">
              <span className="ms-auto font-medium">⌘ K</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="topbar-item hs-dropdown [--placement:bottom-right] relative inline-flex">
            <button
              className="hs-dropdown-toggle btn btn-icon size-8 hover:bg-default-150 rounded-full relative"
              type="button"
            >
              <img src={currentLanguage.src} alt={currentLanguage.label} className="size-4.5 rounded" />
            </button>
            <div className="hs-dropdown-menu" role="menu">
              {languages.map((lang, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex items-center gap-x-3.5 py-1.5 px-3 text-default-600 hover:bg-default-150 rounded font-medium w-full text-left ${
                    language === lang.code ? 'bg-default-150' : ''
                  }`}
                >
                  <img src={lang.src} alt={lang.label} className="size-4 rounded-full" />
                  {t(`languages.${lang.code === 'en' ? 'english' : lang.code === 'so' ? 'somali' : 'arabic'}`)}
                </button>
              ))}
            </div>
          </div>

          <ThemeModeToggle />

          <div className="topbar-item hs-dropdown [--auto-close:inside] relative inline-flex">
            <button
              type="button"
              className="hs-dropdown-toggle btn btn-icon size-8 hover:bg-default-150 rounded-full relative"
            >
              <LuBellRing className="size-4.5" />
              {unreadCount > 0 && (
                <span className="absolute end-0 top-0 size-1.5 bg-primary/90 rounded-full"></span>
              )}
            </button>
            <div className="hs-dropdown-menu max-w-100 p-0">
              <div className="p-4 border-b border-default-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base text-default-800">{t('common.notifications')}</h3>
                  {unreadCount > 0 && (
                    <span className="size-5 font-semibold bg-orange-500 rounded text-white flex items-center justify-center text-xs">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                    title="Mark all as read"
                  >
                    <LuCheck className="size-4" />
                  </button>
                )}
              </div>

              {isNotificationsEnabled && (
                <nav
                  className="flex gap-x-1 bg-default-150 p-2 border-b border-default-200"
                  role="tablist"
                >
                  {tabs.map((tab, i) => (
                    <button
                      key={i}
                      data-hs-tab={`#${tab.id}`}
                      type="button"
                      className={`hs-tab-active:bg-card hs-tab-active:text-primary py-0.5 px-4 rounded font-semibold inline-flex items-center gap-x-2 border-b-2 border-transparent text-xs whitespace-nowrap text-default-500 hover:text-blue-600 ${
                        tab.active ? 'active' : ''
                      }`}
                    >
                      {tab.title}
                    </button>
                  ))}
                </nav>
              )}

              <SimpleBar className="h-80 w-72">
                {shouldShowEnableButton ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="mb-4">
                      {loading ? (
                        <LuLoader className="size-12 text-primary animate-spin mx-auto" />
                      ) : (
                        <LuBell className="size-12 text-default-400 mx-auto" />
                      )}
                    </div>
                    <h4 className="text-lg font-semibold text-default-800 mb-2">
                      Enable Push Notifications
                    </h4>
                    <p className="text-sm text-default-500 mb-6 max-w-xs">
                      Get instant notifications about important updates and activities.
                    </p>
                    <button
                      type="button"
                      onClick={handleEnableNotifications}
                      disabled={loading}
                      className="btn btn-sm text-white bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <LuLoader className="size-4 animate-spin mr-2" />
                          Enabling...
                        </>
                      ) : (
                        <>
                          <LuBell className="size-4 mr-2" />
                          Enable Notifications
                        </>
                      )}
                    </button>
                  </div>
                ) : isNotificationsDenied ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="mb-4">
                      <LuBell className="size-12 text-red-400 mx-auto" />
                    </div>
                    <h4 className="text-lg font-semibold text-default-800 mb-2">
                      Notifications Blocked
                    </h4>
                    <p className="text-sm text-default-500 mb-6 max-w-xs">
                      Please enable notifications in your browser settings to receive updates.
                    </p>
                  </div>
                ) : loadingNotifications ? (
                  <div className="flex items-center justify-center h-full">
                    <LuLoader className="size-8 text-primary animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <LuBell className="size-12 text-default-300 mb-4" />
                    <p className="text-sm text-default-500">No notifications yet</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notification) => {
                      const url = notification.data?.url || '#';
                      return (
                        <Link
                          key={notification.id}
                          href={url}
                          onClick={() => !notification.read_at && handleMarkAsRead(notification.id)}
                          className={`flex gap-3 p-4 items-start hover:bg-default-150 transition-colors ${
                            !notification.read_at ? 'bg-blue-50/50' : ''
                          }`}
                        >
                        <div className="size-10 rounded-md bg-default-100 flex justify-center items-center flex-shrink-0">
                          {getNotificationIcon(notification.feature)}
                        </div>
                        <div className="flex justify-between w-full text-sm min-w-0">
                          <div className="flex-1 min-w-0">
                            <h6 className="mb-1 font-medium text-default-800 line-clamp-2">
                              {notification.title}
                            </h6>
                            <p className="text-default-600 text-xs mb-2 line-clamp-2">
                              {notification.body}
                            </p>
                            <p className="flex items-center gap-1 text-default-500 text-xs">
                              <LuClock className="size-3.5" />{' '}
                              <span>{notification.created_at_human}</span>
                            </p>
                          </div>
                          {!notification.read_at && (
                            <div className="flex items-start pt-1 ml-2">
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                            </div>
                          )}
                        </div>
                      </Link>
                      );
                    })}
                  </div>
                )}
              </SimpleBar>
            </div>
          </div>

          <div className="topbar-item hs-dropdown relative inline-flex">
            <button className="hs-dropdown-toggle cursor-pointer bg-pink-100 rounded-full">
              <img 
                src={auth.user.profile_picture_url || '/assets/images/user/avatar.jpg'} 
                alt="user" 
                className="rounded-full size-9.5 object-cover" 
              />
            </button>
            <div className="hs-dropdown-menu min-w-48">
              <div className="p-2">
                <h6 className="mb-2 text-default-500">{t('common.welcome')}</h6>
                <Link href="#!" className="flex gap-3">
                  <div className="relative inline-block">
                    <img 
                      src={auth.user.profile_picture_url || '/assets/images/user/avatar.jpg'} 
                      alt="user" 
                      className="size-12 rounded object-cover" 
                    />
                    <span className="-top-1 -end-1 absolute w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <h6 className="mb-1 text-sm font-semibold text-default-800">{auth.user.name}</h6>
                    <p className="text-default-500">{auth.user.email}</p>
                  </div>
                </Link>
              </div>

              <div className="border-t border-default-200 -mx-2 my-2"></div>

              <div className="flex flex-col gap-y-1">
                {profileMenu.map((item, i) =>
                  item.divider ? (
                    <div key={i} className="border-t border-default-200 -mx-2 my-1"></div>
                  ) : item.isSignOut ? (
                    <button
                      key={i}
                      type="button"
                      onClick={() => router.post(logout.url())}
                      className="flex items-center gap-x-3.5 py-1.5 px-3 text-default-600 hover:bg-default-150 rounded font-medium w-full text-left"
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      key={i}
                      href={item.to || '#!'}
                      className="flex items-center gap-x-3.5 py-1.5 px-3 text-default-600 hover:bg-default-150 rounded font-medium"
                    >
                      {item.icon}
                      {item.label}
                      {item.badge && (
                        <span className="size-4.5 font-semibold bg-danger rounded text-white flex items-center justify-center text-xs">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
