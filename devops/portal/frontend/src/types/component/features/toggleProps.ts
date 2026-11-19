export interface toggleProps {
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    loading?: boolean
    size?: 'sm' | 'md'
    ariaLabel?: string
}