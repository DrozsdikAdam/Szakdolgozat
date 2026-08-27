import type { NotificationResponse } from "./Notification";

export interface NotificationRowProps {
    notification: NotificationResponse;
    onNotificationClick: (id: string) => void;
}