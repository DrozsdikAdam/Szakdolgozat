export interface PresetItem<T = any> {
    id: string | number
    label: string
    description?: string
    badge?: string
    value: T
}

export interface PresetGroupProps<T = any> {
    title?: string
    subtitle?: string
    options: PresetItem<T>[]
    selectedId?: string | number | null
    onSelect: (option: PresetItem<T>) => void
    columns?: 2 | 3 | 4 | 5
    accentColor?: 'skyblue' | 'teal' | 'purple' | 'orange'
    disabled?: boolean
    className?: string
}
