import { Outlet } from "react-router-dom"
import { Navbar } from "./Navbar"

export const Layout = () => {
    return (
        <div className="min-h-screen w-full flex flex-col bg-[#0f172a] text-slate-100 font-sans">
            <Navbar />
            <main className="flex-1 w-full flex flex-col">
                <Outlet />
            </main>
        </div>
    )
}
