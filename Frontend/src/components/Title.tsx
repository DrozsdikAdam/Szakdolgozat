import type { TitleProps } from "../types/inventory/inventoryProps"

export const Title = ({ page }: TitleProps) => {
    let title = ""
    let subTitle = ""

    if (page === "inventory") {
        title = "Raktárkészlet"
        subTitle = "Itt lehet a raktárkészletet megnézni és módosítani"
    } else if (page === "product") {
        title = "Terméknyilvántartás és Cikktörzs"
        subTitle = "Katalógus cikkek, alkatrészek és törzsadatok kezelése"
    } else if (page === "bom") {
        title = "Gyártási tervek"
        subTitle = "Itt lehet a gyártási terveket megnézni és módosítani"
    }

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{title}</h2>
                <p className="text-slate-400 text-xs sm:text-sm">{subTitle}</p>
            </div>
        </div>
    )
}