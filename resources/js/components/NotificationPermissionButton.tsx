import { useState } from 'react';
import { useFcmContext } from '@/components/FcmProvider';
import { cn } from '@/lib/utils';

interface NotificationPermissionButtonProps {
    className?: string;
    /**
     * Text to show when permission is not yet granted
     */
    enableText?: string;
    /**
     * Text to show when permission is granted
     */
    enabledText?: string;
    /**
     * Text to show when permission is denied
     */
    deniedText?: string;
    /**
     * Text to show when loading
     */
    loadingText?: string;
    /**
     * Whether to show the button when notifications are already enabled
     * @default false
     */
    showWhenEnabled?: boolean;
    /**
     * Variant style of the button
     */
    variant?: 'default' | 'subtle' | 'icon';
}

/**
 * A button component for requesting notification permission
 *
 * @example
 * ```tsx
 * <NotificationPermissionButton
 *   enableText="Enable Push Notifications"
 *   className="mt-4"
 * />
 * ```
 */
export function NotificationPermissionButton({
    className,
    enableText = 'Enable Notifications',
    enabledText = 'Notifications Enabled',
    deniedText = 'Notifications Blocked',
    loadingText = 'Enabling...',
    showWhenEnabled = false,
    variant = 'default',
}: NotificationPermissionButtonProps) {
    const { permission, isSupported, requestPermission, isLoading } = useFcmContext();
    const [localLoading, setLocalLoading] = useState(false);

    // Don't render if notifications aren't supported
    if (!isSupported) {
        return null;
    }

    const isGranted = permission === 'granted';
    const isDenied = permission === 'denied';
    const loading = isLoading || localLoading;

    // Don't render if granted and showWhenEnabled is false
    if (isGranted && !showWhenEnabled) {
        return null;
    }

    const handleClick = async () => {
        if (loading || isGranted || isDenied) return;

        setLocalLoading(true);
        try {
            await requestPermission();
        } finally {
            setLocalLoading(false);
        }
    };

    const getButtonText = () => {
        if (loading) return loadingText;
        if (isGranted) return enabledText;
        if (isDenied) return deniedText;
        return enableText;
    };

    const getIcon = () => {
        if (loading) {
            return (
                <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            );
        }

        if (isGranted) {
            return (
                <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                    />
                </svg>
            );
        }

        if (isDenied) {
            return (
                <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            );
        }

        return (
            <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
            </svg>
        );
    };

    const baseClasses =
        'inline-flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variantClasses = {
        default: cn(
            'rounded-md px-4 py-2 text-sm font-medium',
            isGranted
                ? 'bg-green-100 text-green-700 cursor-default'
                : isDenied
                  ? 'bg-red-100 text-red-700 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary/90 focus:ring-primary'
        ),
        subtle: cn(
            'rounded-md px-3 py-1.5 text-sm',
            isGranted
                ? 'text-green-600 cursor-default'
                : isDenied
                  ? 'text-red-600 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        ),
        icon: cn(
            'rounded-full p-2',
            isGranted
                ? 'text-green-600 bg-green-50 cursor-default'
                : isDenied
                  ? 'text-red-600 bg-red-50 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        ),
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={loading || isDenied}
            className={cn(baseClasses, variantClasses[variant], className)}
            title={isDenied ? 'Please enable notifications in your browser settings' : undefined}
        >
            {getIcon()}
            {variant !== 'icon' && <span>{getButtonText()}</span>}
        </button>
    );
}

export default NotificationPermissionButton;

