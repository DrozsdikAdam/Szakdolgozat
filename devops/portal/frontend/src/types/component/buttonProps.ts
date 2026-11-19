import type { ButtonHTMLAttributes, ReactNode } from "react"

export type Buttonvariant = 'primary' | 'secondary' | 'danger' | 'ghost'

export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Buttonvariant
    size?: ButtonSize
    loading?: boolean
    icon?: ReactNode
}