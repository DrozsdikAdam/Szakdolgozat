import { useNavigate } from "react-router-dom"
import { Background } from "../components/common/Background"
import { FileQuestion, Home, ArrowLeft, LogIn } from "lucide-react"
import { useAuth } from "../hooks/UseAuth"

export const NotFoundView = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-100 overflow-hidden">
            <Background />

            <div className="relative z-10 max-w-lg w-full p-8 sm:p-10 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl text-center space-y-6">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/5">
                    <FileQuestion size={44} />
                </div>

                <div className="space-y-2">
                    <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                        404 - Nem található
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        Az oldal nem létezik
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                        A keresett oldal el lett távolítva, megváltozott a neve, vagy átmenetileg nem érhető el.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <ArrowLeft size={16} />
                        <span>Vissza</span>
                    </button>
                    <button
                        onClick={() => navigate(user ? "/" : "/login")}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {user ? (
                            <>
                                <Home size={16} />
                                <span>Kezdőlap</span>
                            </>
                        ) : (
                            <>
                                <LogIn size={16} />
                                <span>Bejelentkezés</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
