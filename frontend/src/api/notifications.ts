import { fetchWithAuth } from './httpClient';

export interface NotificationData {
    id: string;
    user_id: string;
    category: string;
    priority: string;
    title: string;
    message: string;
    action_link: string | null;
    is_read: boolean;
    created_at: string;
}

interface NotificationsResponse {
    notifications: NotificationData[];
}

interface UnreadCountResponse {
    unreadCount: number;
}

interface MessageResponse {
    message: string;
}

export const notificationsApi = {
    getAll: async (limit?: number): Promise<NotificationsResponse> => {
        const params = limit ? `?limit=${limit}` : '';
        return fetchWithAuth(`/notifications${params}`);
    },

    getUnreadCount: async (): Promise<UnreadCountResponse> => {
        return fetchWithAuth('/notifications/unread-count');
    },

    markAsRead: async (id: string): Promise<MessageResponse> => {
        return fetchWithAuth(`/notifications/${id}/read`, { method: 'PATCH' });
    },

    markAllAsRead: async (): Promise<MessageResponse> => {
        return fetchWithAuth('/notifications/read-all', { method: 'PATCH' });
    },
};
