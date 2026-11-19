export interface SelectOption<T extends string | number> {
    value: T
    label: string
}

export interface SelectProps<T extends string | number> {
    value: T
    onChange: (value: T) => void
    options: SelectOption<T>[]
    title?: string
    className?: string
    size?: 'sm' | 'md'
    disabled?: boolean
}
