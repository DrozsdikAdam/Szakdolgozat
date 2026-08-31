export interface FilterOption {
    key: string,
    label: string
}

export interface FilterSelectProps {
    label?: string,
    value: string,
    onChange: (value: string) => void,
    options: FilterOption[],
    allOptionsLabel?: string,
    placeholder?: string,
    disabled?: boolean,
    className?: string
}

export interface FilterSearchProps {
    value: string,
    onChange: (value: string) => void,
    placeholder?: string,
    className?: string
}