import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import type { NotificationResponse } from "../../types/notification/Notification"
import { getRecentNotifications, getUnreadCount, markAllAsRead, markNotificationAsRead } from "../../services/notificationService"
import { Bell, X } from "lucide-react"
import { NotificationRows } from "./NotificationRows"

export const NotificationBell = () => {

    const [notifications, setNotifications] = useState<NotificationResponse[]>([])
    const [unreadCount, setUnreadCount] = useState<number>(0)
    const [isOpen, setIsOpen] = useState<boolean>(false)

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
        const interval = setInterval(loadNotifications, 5000);
        return () => clearInterval(interval);
    }, []);


    return (
        <div className="relative">

            <button
                onClick={() => setIsOpen(!isOpen)}
                title="Értesítések"
                className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all border border-slate-700/60"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center animate-pulse border-2 border-slate-900 px-1">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs sm:bg-transparent"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-800/40">
                            <span className="text-sm font-bold text-white flex items-center gap-2">
                                Értesítések {unreadCount > 0 && <span className="text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/20">{unreadCount} új</span>}
                            </span>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleNotificationReadAll}
                                        className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-medium"
                                    >
                                        Mind olvasott
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
                                    title="Bezárás"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
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
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );

}