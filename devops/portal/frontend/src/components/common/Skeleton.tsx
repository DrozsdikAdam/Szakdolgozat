import type { SkeletonProps, SkeletonVariant } from "../../types/component/skeletonProps";

export const Skeleton = ({ className = "", variant = "rounded" }: SkeletonProps) => {
    const variantStyles: Record<SkeletonVariant, string> = {
        text: "h-3.5 rounded",
        rounded: "rounded-xl",
        circular: "rounded-full"
    };

    return (
        <div
            className={`animate-pulse bg-slate-800/70 ${variantStyles[variant]} ${className}`}
            aria-hidden="true"
        />
    );
};
