import { create } from 'zustand';
import { notificationsApi, NotificationData } from '../api/notifications';

interface NotificationState {
    notifications: NotificationData[];
    unreadCount: number;
    isLoading: boolean;

    // Fetch all notifications and unread count
    fetchNotifications: (token: string) => Promise<void>;

    // Fetch only the unread count (lightweight)
    fetchUnreadCount: (token: string) => Promise<void>;

    // Mark a single notification as read (optimistic update)
    markAsRead: (token: string, id: string) => Promise<void>;

    // Mark all notifications as read (optimistic update)
    markAllAsRead: (token: string) => Promise<void>;

    // Clear the store (on logout)
    clear: () => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    fetchNotifications: async (token: string) => {
        set({ isLoading: true });
        try {
            const [notifRes, countRes] = await Promise.all([
                notificationsApi.getAll(token),
                notificationsApi.getUnreadCount(token),
            ]);
            set({
                notifications: notifRes.notifications,
                unreadCount: countRes.unreadCount,
            });
        } catch {
            // fail silently — notifications are non-critical
        } finally {
            set({ isLoading: false });
        }
    },

    fetchUnreadCount: async (token: string) => {
        try {
            const res = await notificationsApi.getUnreadCount(token);
            set({ unreadCount: res.unreadCount });
        } catch {
            // fail silently
        }
    },

    markAsRead: async (token: string, id: string) => {
        // Optimistic update
        const prev = get().notifications;
        set({
            notifications: prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
            unreadCount: Math.max(0, get().unreadCount - 1),
        });

        try {
            await notificationsApi.markAsRead(token, id);
        } catch {
            // Revert on failure
            set({ notifications: prev, unreadCount: get().unreadCount + 1 });
        }
    },

    markAllAsRead: async (token: string) => {
        const prev = get().notifications;
        const prevCount = get().unreadCount;

        // Optimistic update
        set({
            notifications: prev.map((n) => ({ ...n, is_read: true })),
            unreadCount: 0,
        });

        try {
            await notificationsApi.markAllAsRead(token);
        } catch {
            // Revert on failure
            set({ notifications: prev, unreadCount: prevCount });
        }
    },

    clear: () => set({ notifications: [], unreadCount: 0, isLoading: false }),
}));
