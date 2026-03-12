import { create } from 'zustand';
import { notificationsApi, NotificationData } from '../api/notifications';

interface NotificationState {
    notifications: NotificationData[];
    unreadCount: number;
    isLoading: boolean;

    fetchNotifications: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clear: () => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    fetchNotifications: async () => {
        set({ isLoading: true });
        try {
            const [notifRes, countRes] = await Promise.all([
                notificationsApi.getAll(),
                notificationsApi.getUnreadCount(),
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

    fetchUnreadCount: async () => {
        try {
            const res = await notificationsApi.getUnreadCount();
            set({ unreadCount: res.unreadCount });
        } catch {
            // fail silently
        }
    },

    markAsRead: async (id: string) => {
        const prev = get().notifications;
        set({
            notifications: prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
            unreadCount: Math.max(0, get().unreadCount - 1),
        });

        try {
            await notificationsApi.markAsRead(id);
        } catch {
            set({ notifications: prev, unreadCount: get().unreadCount + 1 });
        }
    },

    markAllAsRead: async () => {
        const prev = get().notifications;
        const prevCount = get().unreadCount;

        set({
            notifications: prev.map((n) => ({ ...n, is_read: true })),
            unreadCount: 0,
        });

        try {
            await notificationsApi.markAllAsRead();
        } catch {
            set({ notifications: prev, unreadCount: prevCount });
        }
    },

    clear: () => set({ notifications: [], unreadCount: 0, isLoading: false }),
}));
