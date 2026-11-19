export interface ReplicaStepperProps {
    title: string
    description: string
    value: number
    min: number
    max: number
    unit?: string
    color?: 'teal' | 'orange' | 'skyblue'
    onChange: (value: number) => void
    disabled?: boolean
}
