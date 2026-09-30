export interface LoginFormProps {
    username: string;
    onUsernameChange: (username: string) => void;
    password: string;
    onPasswordChange: (password: string) => void;
    onSubmit: () => void;
    error?: string;
    isPasswordValid: boolean;
    validationMessage: string;
    disabled: boolean;
}