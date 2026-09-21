import { RefreshCw, Server } from "lucide-react";
import { Link } from "react-router-dom";
import type { NavbarProps } from "../../types/layout/navbarProps";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";

export const Navbar = ({ isClusterHealthy, onRefresh, isRefreshing }: NavbarProps) => {
    return (
        <div className="w-full h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
            <Link to="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity group">
                <Server className="w-5 h-5 text-cud-skyblue group-hover:scale-105 transition-transform" />
                <span className="text-lg font-medium text-slate-100">PaaS DevOps Portal</span>
            </Link>

            <div className="flex items-center gap-2">
                <div>
                    {isClusterHealthy ?
                        <Badge variant="teal" text="Klaszter Online" pulse={true} />
                        :
                        <Badge variant="vermillon" text="Klaszter Hiba" pulse={true} />
                    }
                </div>

                <Button variant="secondary" size="sm" icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />} onClick={onRefresh} />
            </div>
        </div>
    )
}