import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/UseAuth"
import { Activity, Boxes, Factory, FileText, Layers, LogOut, Menu, Package, RefreshCw, Square, User, Wifi, WifiOff, Wrench, X } from "lucide-react"
import { NotificationBell } from "./notification/NotificationBell"
import { useState, type ComponentType } from "react"
import { hasAnyRole } from "../utils/rbac"
import type { UserRole } from "../types/user/User"
import { useNetworkStatus } from "../hooks/UseNetworkStatus"
import { useSyncStatus } from "../hooks/UseSyncStatus"
import { SyncConflictModal } from "./offline/modal/SyncConflict"

export const Navbar = () => {

    const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false)
    const [isConflictOpen, setIsConflictOpen] = useState<boolean>(false);
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const { isOnline, pendingCount, refreshPendingCount } = useNetworkStatus()
    const { isSyncing, conflictCount, current, total } = useSyncStatus();

    const handleLogout = async () => {
        await logout()
        navigate("/login")
    }

    type NavItem = {
        path: string
        label: string
        icon: ComponentType<{ size?: number }>
        roles: UserRole[]
    }

    const navItems: NavItem[] = [
        {
            path: "/product", label: "Termékek", icon: Package,
            roles: ["SYSTEMADMIN", "CEO", "MANAGER", "OPERATOR"]
        },
        {
            path: "/inventory", label: "Raktárkészlet", icon: Boxes,
            roles: ["SYSTEMADMIN", "CEO", "MANAGER", "OPERATOR", "TECHNICIAN"]
        },
        {
            path: "/bom", label: "Gyártási tervek", icon: Layers,
            roles: ["SYSTEMADMIN", "CEO", "MANAGER"]
        },
        {
            path: "/workorder", label: "Gyártási rendelések", icon: Square,
            roles: ["SYSTEMADMIN", "CEO", "MANAGER", "OPERATOR"]
        },
        {
            path: "/user", label: "Felhasználók", icon: User,
            roles: ["SYSTEMADMIN", "CEO"]
        },
        {
            path: "/machine", label: "Gépek", icon: Factory,
            roles: ["SYSTEMADMIN", "CEO", "MANAGER", "OPERATOR", "TECHNICIAN"]
        },
        {
            path: "/maintenance", label: "Karbantartás", icon: Wrench,
            roles: ["SYSTEMADMIN", "CEO", "MANAGER", "TECHNICIAN"]
        },
        {
            path: "/analytics", label: "Analitika", icon: Activity,
            roles: ["SYSTEMADMIN", "CEO", "MANAGER"]
        },
        {
            path: "/logs", label: "Napló", icon: FileText,
            roles: ["SYSTEMADMIN", "CEO"]
        },
    ]

    const filteredNavItems = navItems.filter((item) => hasAnyRole(user, item.roles))

    return (
        <header className="w-full bg-slate-900/80 border-b border-slate-800 backdrop-blur-xl sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                        <Factory size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-base font-extrabold text-white tracking-tight leading-none">
                            MES Rendszer
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                            Gyártásirányítás & Logisztika
                        </span>
                    </div>
                </div>

                <nav className="hidden xl:flex items-center gap-1">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-1.5 px-2.5 2xl:px-3 py-1.5 2xl:py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${isActive
                                        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                                    }`
                                }
                            >
                                <Icon size={15} />
                                <span>{item.label}</span>
                            </NavLink>
                        )
                    })}
                </nav>

                {isMobileOpen && (
                    <div className="absolute top-16 left-0 right-0 w-full bg-slate-900/95 border-b border-slate-800 backdrop-blur-2xl xl:hidden pb-4">
                        <div className="px-4 py-2 space-y-1">
                            {filteredNavItems.map((item) => {
                                const Icon = item.icon
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMobileOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${isActive
                                                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/40"
                                                : "text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent"
                                            }`
                                        }
                                    >
                                        <Icon size={20} />
                                        <span>{item.label}</span>
                                    </NavLink>
                                )
                            })}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
                    {user && (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300">
                            <User size={14} className="text-indigo-400" />
                            <span className="font-semibold">{user.username}</span>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        title="Kijelentkezés"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all duration-200"
                    >
                        <LogOut size={16} />
                        <span className="hidden sm:inline">Kijelentkezés</span>
                    </button>
                    <NotificationBell />

                    {isSyncing && (
                        <div
                            title={`Szinkronizálás folyamatban: ${current}/${total}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 font-semibold text-xs animate-pulse"
                        >
                            <RefreshCw size={16} className="animate-spin text-indigo-400" />
                            <span>{current}/{total}</span>
                        </div>
                    )}

                    <div className="relative">
                        <button
                            onClick={() => {
                                refreshPendingCount();
                                setIsConflictOpen(!isConflictOpen);
                            }}
                            title={
                                conflictCount > 0
                                    ? `${conflictCount} szinkronizációs ütközés!`
                                    : isOnline
                                        ? (pendingCount > 0 ? `${pendingCount} várakozó offline kérés` : "Online kapcsolat")
                                        : `${pendingCount} várakozó offline kérés (Nincs internet)`
                            }
                            className={`relative p-2 rounded-xl border transition-all flex items-center ${conflictCount > 0
                                ? "bg-rose-500/20 border-rose-500/40 hover:bg-rose-500/30 text-rose-400"
                                : "bg-slate-800/80 border-slate-700/60 hover:bg-slate-700/80"
                                }`}
                        >
                            {isOnline ? (
                                <Wifi size={20} className={conflictCount > 0 ? "text-rose-400" : "text-green-400"} />
                            ) : (
                                <WifiOff size={20} className="text-rose-400" />
                            )}
                            {(pendingCount > 0 || conflictCount > 0) && (
                                <span className={`absolute -top-1 -right-1 text-white text-[10px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center animate-pulse border-2 border-slate-900 px-1 ${conflictCount > 0 ? "bg-rose-600" : "bg-amber-500"
                                    }`}>
                                    {conflictCount > 0 ? conflictCount : pendingCount}
                                </span>
                            )}
                        </button>

                        <SyncConflictModal
                            isOpen={isConflictOpen}
                            onClose={() => setIsConflictOpen(false)}
                        />
                    </div>

                    <button
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        className="xl:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all border border-slate-700/60"
                    >
                        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

            </div>
        </header >
    )
}
