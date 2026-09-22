export interface InputProps {
    label?: string
    icon?: React.ReactNode
    helperText?: string
    error?: string
    value: string | number
    onChange: (value: string) => void
    type?: 'text' | 'password' | 'number'
    placeholder?: string
    disabled?: boolean
    accentColor?: 'teal' | 'skyblue' | 'orange' | 'purple'
    className?: string
    min?: number
    max?: number
}