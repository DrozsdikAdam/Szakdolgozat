import type { BadgeProps } from "../../types/component/badgeProps"

export const Badge = ({ variant, text, pulse, size = 'sm' }: BadgeProps) => {

    const variantStyles: Record<
        BadgeProps['variant'],
        string
    > = {
        'teal': 'bg-cud-teal-bg text-cud-teal border-cud-teal-border',
        'vermillon': 'bg-cud-vermillon-bg text-cud-vermillon border-cud-vermillon-border',
        'orange': 'bg-cud-orange-bg text-cud-orange border-cud-orange-border',
        'skyblue': 'bg-cud-skyblue-bg text-cud-skyblue border-cud-skyblue-border',
        'purple': 'bg-cud-purple-bg text-cud-purple border-cud-purple-border',
        'neutral': 'bg-slate-800/60 text-slate-300 border-slate-700'
    }
    const sizeStyles: Record<'sm' | 'md', string> = {
        'sm': 'text-xs px-2 py-0.5',
        'md': 'text-sm px-2.5 py-1'
    }

    return (
        <span className={`border rounded-full inline-flex items-center gap-1.5 font-medium ${variantStyles[variant]} ${sizeStyles[size]}`}>
            {pulse && (
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-subtle" />
            )}
            <span>{text}</span>
        </span>
    )
}