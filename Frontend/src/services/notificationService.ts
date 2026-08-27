
import type { NotificationResponse } from "../types/notification/Notification";
import { apiFetch } from "../utils/apiFetch";

const baseUrl = "/api/notifications"

export const getRecentNotifications = async (): Promise<NotificationResponse[]> => {
    const response: NotificationResponse[] = await apiFetch(`${baseUrl}/recent`);
    return response;
}

export const getUnreadCount = async (): Promise<number> => {
    const response: number = await apiFetch(`${baseUrl}/unread-count`);
    return response;
}

export const markNotificationAsRead = async (id: string): Promise<NotificationResponse> => {
    const response: NotificationResponse = await apiFetch(`${baseUrl}/${id}/read`, {
        method: "PATCH"
    });
    return response;
}

export const markAllAsRead = async (): Promise<void> => {
    await apiFetch(`${baseUrl}/read-all`, {
        method: "PATCH"
    });
}
