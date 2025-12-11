import { useState } from 'react';
import { LuBell, LuBellOff, LuBellRing, LuLoader } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { useFcmContext } from '@/components/FcmProvider';

/**
 * Notification toggle button for the topbar
 *
 * Shows different states:
 * - Bell icon: Notifications supported but not enabled
 * - Bell with ring: Notifications enabled
 * - Bell off: Notifications denied/blocked
 * - Loading: Requesting permission
 */
export function NotificationToggle() {
    const { permission, isSupported, requestPermission, isLoading, isRegistered } = useFcmContext();
    const [localLoading, setLocalLoading] = useState(false);

    // Don't render if notifications aren't supported
    if (!isSupported) {
        return null;
    }

    const loading = isLoading || localLoading;
    const isGranted = permission === 'granted';
    const isDenied = permission === 'denied';

    const handleClick = async () => {
        if (loading || isDenied) return;

        // If already granted but not registered, try to register again
        if (isGranted && !isRegistered) {
            toast.info('Notifications already enabled. Refreshing registration...');
        }

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

    const getIcon = () => {
        if (loading) {
            return <LuLoader className="size-4.5 animate-spin" />;
        }
        if (isGranted && isRegistered) {
            return <LuBellRing className="size-4.5 text-green-500" />;
        }
        if (isGranted && !isRegistered) {
            return <LuBell className="size-4.5 text-yellow-500" />;
        }
        if (isDenied) {
            return <LuBellOff className="size-4.5 text-red-400" />;
        }
        return <LuBell className="size-4.5" />;
    };

    const getTitle = () => {
        if (loading) return 'Enabling notifications...';
        if (isGranted && isRegistered) return 'Push notifications enabled';
        if (isGranted && !isRegistered) return 'Click to complete notification setup';
        if (isDenied) return 'Push notifications blocked - enable in browser settings';
        return 'Click to enable push notifications';
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={loading || isDenied}
            className={`btn btn-icon size-8 hover:bg-default-150 rounded-full relative transition-colors ${
                isDenied ? 'cursor-not-allowed opacity-60' : ''
            } ${isGranted && isRegistered ? 'text-green-500' : ''} ${isGranted && !isRegistered ? 'text-yellow-500' : ''}`}
            title={getTitle()}
        >
            {getIcon()}
            {/* Show orange dot if not yet enabled */}
            {!isGranted && !isDenied && !loading && (
                <span className="absolute end-0 top-0 size-1.5 bg-orange-500 rounded-full animate-pulse" />
            )}
            {/* Show yellow dot if enabled but not registered */}
            {isGranted && !isRegistered && !loading && (
                <span className="absolute end-0 top-0 size-1.5 bg-yellow-500 rounded-full animate-pulse" />
            )}
        </button>
    );
}

export default NotificationToggle;

