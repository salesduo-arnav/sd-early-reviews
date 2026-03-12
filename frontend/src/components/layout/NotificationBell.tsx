import React, { useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Polling interval for unread count (ms)
const POLL_INTERVAL = 30_000;

// Map notification categories to visual accent colors
const CATEGORY_COLORS: Record<string, string> = {
    ORDER_APPROVED: 'bg-emerald-500',
    ORDER_REJECTED: 'bg-red-500',
    REVIEW_APPROVED: 'bg-emerald-500',
    REVIEW_REJECTED: 'bg-red-500',
    PAYOUT_PROCESSED: 'bg-emerald-500',
    PAYOUT_FAILED: 'bg-red-500',
    REVIEW_DEADLINE: 'bg-amber-500',
    CAMPAIGN_CREATED: 'bg-blue-500',
    CAMPAIGN_PAUSED: 'bg-amber-500',
    CAMPAIGN_COMPLETED: 'bg-emerald-500',
    NEW_ORDER_CLAIM: 'bg-blue-500',
    REVIEW_SUBMITTED: 'bg-blue-500',
    SELLER_PAYMENT_DUE: 'bg-amber-500',
    ADMIN_VERIFICATION_NEEDED: 'bg-amber-500',
    ADMIN_FLAGGED_USER: 'bg-red-500',
    SYSTEM_ANNOUNCEMENT: 'bg-primary',
    WELCOME: 'bg-primary',
};

function timeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export function NotificationBell() {
    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
    } = useNotificationStore();

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchNotifications();
    }, [isAuthenticated, fetchNotifications]);

    useEffect(() => {
        if (!isAuthenticated) return;
        const interval = setInterval(() => fetchUnreadCount(), POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [isAuthenticated, fetchUnreadCount]);

    const handleNotificationClick = useCallback(
        (id: string, actionLink: string | null, isRead: boolean) => {
            if (!isAuthenticated) return;
            if (!isRead) {
                markAsRead(id);
            }
            if (actionLink) {
                navigate(actionLink);
            }
        },
        [isAuthenticated, markAsRead, navigate],
    );

    const handleMarkAllAsRead = useCallback(() => {
        if (!isAuthenticated) return;
        markAllAsRead();
    }, [isAuthenticated, markAllAsRead]);

    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (open && isAuthenticated) {
                fetchNotifications();
            }
        },
        [isAuthenticated, fetchNotifications],
    );

    return (
        <Popover onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-muted-foreground hover:text-foreground"
                    aria-label="Notifications"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground animate-in zoom-in-50">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[380px] p-0 rounded-xl shadow-xl border border-border/60"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                            onClick={handleMarkAllAsRead}
                        >
                            <CheckCheck className="h-3.5 w-3.5 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Notification list */}
                <ScrollArea className="max-h-[400px]">
                    {isLoading && notifications.length === 0 ? (
                        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                            Loading…
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-30" />
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {notifications.map((notif) => (
                                <button
                                    key={notif.id}
                                    onClick={() =>
                                        handleNotificationClick(notif.id, notif.action_link, notif.is_read)
                                    }
                                    className={cn(
                                        'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                                        !notif.is_read && 'bg-primary/[0.03]',
                                    )}
                                >
                                    {/* Category dot */}
                                    <div className="mt-1.5 shrink-0">
                                        <div
                                            className={cn(
                                                'h-2 w-2 rounded-full',
                                                CATEGORY_COLORS[notif.category] || 'bg-primary',
                                            )}
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p
                                                className={cn(
                                                    'text-sm truncate',
                                                    !notif.is_read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground',
                                                )}
                                            >
                                                {notif.title}
                                            </p>
                                            <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                                                {timeAgo(notif.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                            {notif.message}
                                        </p>
                                    </div>

                                    {/* Read indicator */}
                                    {notif.is_read && (
                                        <div className="mt-1.5 shrink-0">
                                            <Check className="h-3.5 w-3.5 text-muted-foreground/40" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
