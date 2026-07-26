export const Title = () => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Terméknyilvántartás és Cikktörzs</h2>
                <br />
                <p className="text-slate-400 text-xs sm:text-sm">Katalógus cikkek, alkatrészek és törzsadatok kezelése</p>
            </div>
        </div>
    )
}