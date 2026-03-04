import { API_BASE_URL } from '../config';

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

const authHeaders = (token: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
});

const handleResponse = async <T>(response: Response): Promise<T> => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }
    return data;
};

export const notificationsApi = {
    getAll: async (token: string, limit?: number): Promise<NotificationsResponse> => {
        const params = limit ? `?limit=${limit}` : '';
        const response = await fetch(`${API_BASE_URL}/notifications${params}`, {
            headers: authHeaders(token),
        });
        return handleResponse<NotificationsResponse>(response);
    },

    getUnreadCount: async (token: string): Promise<UnreadCountResponse> => {
        const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
            headers: authHeaders(token),
        });
        return handleResponse<UnreadCountResponse>(response);
    },

    markAsRead: async (token: string, id: string): Promise<MessageResponse> => {
        const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
            method: 'PATCH',
            headers: authHeaders(token),
        });
        return handleResponse<MessageResponse>(response);
    },

    markAllAsRead: async (token: string): Promise<MessageResponse> => {
        const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
            method: 'PATCH',
            headers: authHeaders(token),
        });
        return handleResponse<MessageResponse>(response);
    },
};
