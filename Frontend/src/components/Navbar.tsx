import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/UseAuth"
import { Boxes, Factory, Layers, LogOut, Package, Square, User } from "lucide-react"

export const Navbar = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate("/login")
    }

    const navItems = [
        { path: "/product", label: "Termékek", icon: Package },
        { path: "/inventory", label: "Raktárkészlet", icon: Boxes },
        { path: "/bom", label: "Gyártási tervek", icon: Layers },
        { path: "/workorder", label: "Gyártási rendelések", icon: Square },
        { path: "/user", label: "Felhasználók", icon: User },
    ]

    return (
        <header className="w-full bg-slate-900/80 border-b border-slate-800 backdrop-blur-xl sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
                {/* Brand / Logo */}
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

                {/* Navigation Links */}
                <nav className="flex items-center gap-1 sm:gap-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${isActive
                                        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                                    }`
                                }
                            >
                                <Icon size={16} />
                                <span>{item.label}</span>
                            </NavLink>
                        )
                    })}
                </nav>

                <div className="flex items-center gap-3">
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
                </div>
            </div>
        </header>
    )
}
