export type NotificationType = "INFO" | "WARNING" | "ERROR" | "SUCCESS";

export interface NotificationResponse {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    read: boolean;
    link?: string;
    createdAt: string;
}