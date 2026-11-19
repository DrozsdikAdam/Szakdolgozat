export interface BadgeProps {
    variant: 'teal' | 'vermillon' | 'orange' | 'skyblue' | 'purple' | 'neutral'
    text: string
    pulse?: boolean
    size?: 'sm' | 'md'
}