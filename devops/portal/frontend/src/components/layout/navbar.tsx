import { RefreshCw, Server, LogIn, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { NavbarProps } from "../../types/layout/navbarProps";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import { useAuth } from "../../hooks/useAuth";

export const Navbar = ({ isClusterHealthy, onRefresh, isRefreshing }: NavbarProps) => {
    const auth = useAuth();
    const location = useLocation();
    const isLoginPage = location.pathname === "/login";

    return (
        <div className="w-full h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
            <Link to={auth.isAuthenticated ? "/" : "/login"} className="flex items-center gap-2 hover:opacity-85 transition-opacity group">
                <Server className="w-5 h-5 text-cud-skyblue group-hover:scale-105 transition-transform" />
                <span className="text-lg font-medium text-slate-100">PaaS DevOps Portal</span>
            </Link>

            <div className="flex items-center gap-2.5">
                {auth.isAuthenticated && (
                    <>
                        <div>
                            {isClusterHealthy ?
                                <Badge variant="teal" text="Klaszter Online" pulse={true} />
                                :
                                <Badge variant="vermillon" text="Klaszter Hiba" pulse={true} />
                            }
                        </div>

                        <Button variant="secondary" size="sm" icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />} onClick={onRefresh} />
                    </>
                )}

                {auth.isAuthenticated && (
                    <div className="h-5 w-px bg-slate-800 mx-1" />
                )}

                {auth.isAuthenticated ? (
                    <div className="flex items-center gap-2">
                        <Link to="/login" title="Hitelesítési profil megtekintése">
                            <Badge variant="teal" text={auth.username || "admin"} />
                        </Link>
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-cud-vermillon" />}
                            onClick={() => auth.logout()}
                            title="Kijelentkezés"
                        />
                    </div>
                ) : !isLoginPage ? (
                    <Link to="/login">
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<LogIn className="w-3.5 h-3.5 text-cud-skyblue" />}
                            className="border-slate-700/80 hover:border-cud-skyblue/40"
                        >
                            Belépés
                        </Button>
                    </Link>
                ) : null}
            </div>
        </div>
    );
};

