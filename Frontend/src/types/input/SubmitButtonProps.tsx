import type { ButtonHTMLAttributes, ReactNode } from "react"

export interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean,
    icon?: ReactNode,
    text?: string,
    children?: ReactNode,
    variant?: "primary" | "secondary" | "danger"
}
