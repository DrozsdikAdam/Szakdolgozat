import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string,
    error?: string | null
}

export interface PasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string,
    error?: string | null
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    options?: { key: string; label: string }[],
    placeholderOption?: string,
    error?: string | null
}

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string,
    error?: string | null
}