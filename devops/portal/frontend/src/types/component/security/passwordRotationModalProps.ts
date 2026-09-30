export interface PasswordRotationModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: () => Promise<boolean>
    password: string
    onPasswordChange: (value: string) => void
    isRotating: boolean
    error: string | null
}