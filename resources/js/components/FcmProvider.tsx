import { useEffect, useCallback, createContext, useContext, useState, useRef, type ReactNode } from 'react';
import type { MessagePayload } from 'firebase/messaging';
import { toast } from 'react-toastify';
import { useFcm } from '@/hooks/use-fcm';
import { usePage } from '@inertiajs/react';
import { getCachedFcmToken } from '@/lib/firebase';

interface FcmContextValue {
    token: string | null;
    isLoading: boolean;
    permission: NotificationPermission | null;
    isSupported: boolean;
    requestPermission: () => Promise<string | null>;
    isRegistered: boolean;
}

const FcmContext = createContext<FcmContextValue | null>(null);

interface FcmProviderProps {
    children: ReactNode;
    autoRequest?: boolean;
    showForegroundToasts?: boolean;
}

/**
 * FCM Provider Component
 */
const REGISTRATION_STORAGE_KEY = 'fcm_registered';

export function FcmProvider({
    children,
    autoRequest = false,
    showForegroundToasts = true,
}: FcmProviderProps) {
    const [isRegistered, setIsRegistered] = useState(() => {
        // Check localStorage on initial mount
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(REGISTRATION_STORAGE_KEY);
            return stored === 'true';
        }
        return false;
    });
    const page = usePage<{ auth?: { user?: { id: number } } }>();
    const isAuthenticated = !!page.props.auth?.user;
    const hasCheckedCache = useRef(false);

    const handleMessage = useCallback(
        (payload: MessagePayload) => {
            if (!showForegroundToasts) return;

            const title = payload.notification?.title || 'New Notification';
            const body = payload.notification?.body;

            toast.info(
                <div>
                    <strong className="block text-sm font-semibold">{title}</strong>
                    {body && <span className="block text-xs text-gray-600">{body}</span>}
                </div>,
                {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    icon: '🔔',
                }
            );
        },
        [showForegroundToasts]
    );

    const handleTokenReceived = useCallback(
        async (token: string) => {
            if (!isAuthenticated) {
                return;
            }

            try {
                const getCsrfToken = () => {
                    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                    if (metaToken) return metaToken;

                    const cookies = document.cookie.split('; ');
                    const xsrf = cookies.find(c => c.startsWith('XSRF-TOKEN='));
                    if (xsrf) {
                        return decodeURIComponent(xsrf.split('=')[1]);
                    }

                    return null;
                };

                const csrfToken = getCsrfToken();
                
                if (!csrfToken) {
                    return;
                }

                const response = await fetch('/api/fcm-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        token,
                        device: navigator.userAgent,
                    }),
                });

                if (response.ok) {
                    setIsRegistered(true);
                    // Persist registration state in localStorage
                    if (typeof window !== 'undefined') {
                        localStorage.setItem(REGISTRATION_STORAGE_KEY, 'true');
                    }
                }
            } catch {
                // Silent fail
            }
        },
        [isAuthenticated]
    );

    const {
        token,
        isLoading,
        permission,
        isSupported,
        requestPermission,
    } = useFcm({
        autoRequest: autoRequest && isAuthenticated,
        onMessage: handleMessage,
        onTokenReceived: handleTokenReceived,
    });

    useEffect(() => {
        if (isAuthenticated && token && !isRegistered) {
            handleTokenReceived(token);
        }
    }, [isAuthenticated, token, isRegistered, handleTokenReceived]);

    // Clear registration if permission is denied
    useEffect(() => {
        if (permission === 'denied' && isRegistered) {
            setIsRegistered(false);
            if (typeof window !== 'undefined') {
                localStorage.removeItem(REGISTRATION_STORAGE_KEY);
            }
        }
    }, [permission, isRegistered]);

    useEffect(() => {
        if (!isAuthenticated) {
            setIsRegistered(false);
            if (typeof window !== 'undefined') {
                localStorage.removeItem(REGISTRATION_STORAGE_KEY);
            }
        }
    }, [isAuthenticated]);

    // Check on mount if we have permission and a cached token
    useEffect(() => {
        const checkExistingRegistration = async () => {
            if (!isAuthenticated || isRegistered || hasCheckedCache.current) {
                return;
            }

            hasCheckedCache.current = true;

            // Check if permission is granted
            if (Notification.permission !== 'granted') {
                return;
            }

            // Try to get cached token
            try {
                const cachedToken = await getCachedFcmToken();
                if (cachedToken) {
                    // Token exists, verify/register it
                    await handleTokenReceived(cachedToken);
                }
            } catch {
                // Silent fail
            }
        };

        checkExistingRegistration();
    }, [isAuthenticated, isRegistered, handleTokenReceived]);

    const contextValue: FcmContextValue = {
        token,
        isLoading,
        permission,
        isSupported,
        requestPermission,
        isRegistered,
    };

    return (
        <FcmContext.Provider value={contextValue}>
            {children}
        </FcmContext.Provider>
    );
}

export function useFcmContext(): FcmContextValue {
    const context = useContext(FcmContext);
    if (!context) {
        throw new Error('useFcmContext must be used within an FcmProvider');
    }
    return context;
}

export default FcmProvider;
