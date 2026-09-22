export interface SliderMark {
    value: number
    label: string
}

export interface SliderProps {
    value: number
    min: number
    max: number
    step?: number
    onChange: (value: number) => void
    marks?: SliderMark[]
    accentColor?: 'teal' | 'skyblue' | 'purple' | 'orange'
    disabled?: boolean
    ariaLabel?: string
    className?: string
}
