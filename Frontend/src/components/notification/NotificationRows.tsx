import { useState } from "react"
import type { NotificationRowProps } from "../../types/notification/NotificationProps"
import { AlertOctagon, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Clock, Info } from "lucide-react"
import { useNavigate } from "react-router-dom"
export const NotificationRows = ({ notification, onNotificationClick }: NotificationRowProps) => {
    const { title, message, type, read, createdAt, link } = notification
    const [isOpen, setIsOpen] = useState(false)
    const navigate = useNavigate()

    const getTypeConfig = () => {
        switch (type) {
            case "ERROR":
                return {
                    border: "border-rose-500/30 hover:border-rose-500/60 bg-rose-500/5",
                    icon: <AlertOctagon size={16} className="text-rose-400 shrink-0" />,
                    badge: "bg-rose-500/10 text-rose-300 border-rose-500/20"
                }
            case "WARNING":
                return {
                    border: "border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5",
                    icon: <AlertTriangle size={16} className="text-amber-400 shrink-0" />,
                    badge: "bg-amber-500/10 text-amber-300 border-amber-500/20"
                }
            case "SUCCESS":
                return {
                    border: "border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5",
                    icon: <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />,
                    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                }
            default:
                return {
                    border: "border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/5",
                    icon: <Info size={16} className="text-indigo-400 shrink-0" />,
                    badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                }
        }
    }
    const config = getTypeConfig()
    const handleClick = () => {
        if (!read) onNotificationClick(notification.id)
    }
    const handleNavigate = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!read) onNotificationClick(notification.id)
        if (link) navigate(link)
    }
    return (
        <div
            onClick={handleClick}
            className={`rounded-xl border p-3 transition-all duration-200 cursor-pointer ${config.border} ${!read ? 'ring-1 ring-indigo-500/30 shadow-lg' : 'opacity-90'}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    {config.icon}
                    <span className={`text-xs sm:text-sm font-semibold truncate ${!read ? 'text-white' : 'text-slate-300'}`}>
                        {title}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {!read && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                            Új
                        </span>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
                        className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                    >
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            </div>

            <p className={`text-xs text-slate-400 mt-1.5 leading-relaxed ${!isOpen && 'line-clamp-2'}`}>
                {message}
            </p>

            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(createdAt).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {link && (
                    <button
                        onClick={handleNavigate}
                        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-colors"
                    >
                        Megnyitás
                    </button>
                )}
            </div>
        </div>
    )
}