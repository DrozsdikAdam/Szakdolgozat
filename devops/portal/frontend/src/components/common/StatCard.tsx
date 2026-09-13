import type { StatCardProps } from "../../types/component/statCardProps"
import { Card } from "./Card"

export const StatCard = ({
    title,
    value,
    icon,
    valueClassName = "text-slate-100",
    iconBoxClassName = "bg-slate-800/80 text-cud-skyblue border border-slate-700/60",
    className = ""
}: StatCardProps) => {
    return (
        <Card hoverEffect={false} className={`p-4 ${className}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        {title}
                    </p>
                    <h4 className={`text-2xl font-bold mt-1 ${valueClassName}`}>
                        {value}
                    </h4>
                </div>
                <div className={`p-2.5 rounded-xl ${iconBoxClassName}`}>
                    {icon}
                </div>
            </div>
        </Card>
    )
}
