import type { TitleProps } from "../../types/Props"

export const Title = ({ page }: TitleProps) => {
    let title = ""
    let subTitle = ""

    switch (page) {
        case "inventory":
            title = "Raktárkészlet"
            subTitle = "Itt lehet a raktárkészletet megnézni és módosítani"
            break;
        case "product":
            title = "Terméknyilvántartás és Cikktörzs"
            subTitle = "Katalógus cikkek, alkatrészek és törzsadatok kezelése"
            break;
        case "bom":
            title = "Gyártási tervek"
            subTitle = "Itt lehet a gyártási terveket megnézni és módosítani"
            break;
        case "workorder":
            title = "Rendelések"
            subTitle = "Itt lehet a rendeléseket megnézni és módosítani"
            break;
        case "user":
            title = "Felhasználók"
            subTitle = "Itt lehet a felhasználókat megnézni és módosítani"
            break;
        case "machine":
            title = "Gépek"
            subTitle = "Itt lehet a gépeket megnézni és módosítani"
            break;
        case "maintenance":
            title = "Karbantartások"
            subTitle = "Itt lehet a karbantartásokat megnézni és módosítani"
            break;
        case "machineCreate":
            title = "Új gép létrehozása"
            subTitle = "Itt lehet új gépet létrehozni"
            break;
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