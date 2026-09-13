import type { CardProps } from "../../types/component/cardProps"

export const Card = ({ title, subtitle, action, children, className = '', hoverEffect = true, onClick }: CardProps) => {
    return (
        <div onClick={onClick} className={`bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5 transition-all duration-200 ${className} ${hoverEffect ? 'hover:border-slate-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/40 cursor-pointer' : ''}`}>
            {
                (title || subtitle || action) && (<div className="w-full flex items-center justify-between">
                    <div className="flex flex-col items-start gap-2">
                        {title && <h3 className="text-lg font-semibold text-slate-200">{title}</h3>}
                        {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
                    </div>
                    {action && <div className="flex items-center gap-2">{action}</div>}
                </div>)
            }
            <div className="mt-4">{children}</div>
        </div>
    )
}