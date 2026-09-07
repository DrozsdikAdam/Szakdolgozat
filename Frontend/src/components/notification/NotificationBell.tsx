import { useEffect, useState } from "react"
import type { NotificationResponse } from "../../types/notification/Notification"
import { getRecentNotifications, getUnreadCount, markAllAsRead, markNotificationAsRead } from "../../services/notificationService"
import { Bell } from "lucide-react"
import { NotificationRows } from "./NotificationRows"
import { NavbarModal } from "../common/modal/Navbar"

export interface NotificationBellProps {
    isOpen?: boolean;
    onToggle?: () => void;
    onClose?: () => void;
}

export const NotificationBell = ({ isOpen: controlledIsOpen, onToggle, onClose }: NotificationBellProps = {}) => {
    const [notifications, setNotifications] = useState<NotificationResponse[]>([])
    const [unreadCount, setUnreadCount] = useState<number>(0)
    const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false)

    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

    const handleToggle = () => {
        if (onToggle) {
            onToggle();
        } else {
            setInternalIsOpen(!internalIsOpen);
        }
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            setInternalIsOpen(false);
        }
    };

    const loadNotifications = async () => {
        if (!navigator.onLine) return;
        try {
            const [nots, count] = await Promise.all([
                getRecentNotifications(),
                getUnreadCount()
            ])
            setNotifications(nots)
            setUnreadCount(count)
        } catch {

        }
    }

    const handleNotificationClick = async (id: string) => {
        await markNotificationAsRead(id)
        loadNotifications()
    }

    const handleNotificationReadAll = async () => {
        await markAllAsRead()
        loadNotifications()
    }

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative">
            <button
                onClick={handleToggle}
                title="Értesítések"
                className={`relative p-2 rounded-xl transition-all border ${isOpen
                    ? "bg-slate-800 text-white border-(--cud-skyblue-border) shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80 border-slate-700/60"
                    }`}
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-(--cud-vermillon) text-white text-[10px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center animate-pulse border-2 border-slate-900 px-1">
                        {unreadCount}
                    </span>
                )}
            </button>

            <NavbarModal
                isOpen={isOpen}
                onClose={handleClose}
                title={
                    <span className="flex items-center gap-2">
                        <span>Értesítések</span>
                        {unreadCount > 0 && (
                            <span className="badge-danger text-xs py-0.5 px-2">
                                {unreadCount} új
                            </span>
                        )}
                    </span>
                }
                headerRight={
                    unreadCount > 0 ? (
                        <button
                            onClick={handleNotificationReadAll}
                            className="text-xs text-cud-skyblue hover:opacity-80 hover:underline font-medium cursor-pointer"
                        >
                            Mind olvasott
                        </button>
                    ) : undefined
                }
                bodyClassName="divide-y divide-slate-800/60 p-2 space-y-1"
            >
                {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">Nincsenek új értesítések</div>
                ) : (
                    notifications.map((notification) => (
                        <NotificationRows
                            key={notification.id}
                            notification={notification}
                            onNotificationClick={handleNotificationClick}
                        />
                    ))
                )}
            </NavbarModal>
        </div>
    );
};