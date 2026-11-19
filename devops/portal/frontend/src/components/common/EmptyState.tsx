import type { EmptyStateProps } from "../../types/component/EmptyStateProps"

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center">
            <div className="p-3 rounded-full bg-slate-800/80 text-slate-400 mb-3">{icon}</div>
            <h3 className="text-slate-200 text-lg font-medium mb-2">{title}</h3>
            {description && <p className="text-slate-400 text-sm mb-4">{description}</p>}
            {action}
        </div>
    )
}