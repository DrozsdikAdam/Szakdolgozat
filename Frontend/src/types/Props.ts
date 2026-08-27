import type { FormEvent, ReactNode } from "react";

export interface Props {
    children: ReactNode;
    allowedRoles?: string[];
}

export interface TitleProps {
    page: "inventory"
    | "product"
    | "bom"
    | "workorder"
    | "user"
    | "maintenance"
    | "machine"
    | "machineCreate"
    | "maintenanceEdit"
    | "analytics";
}

export interface BadgeProps {
    content: string;
    style: string;
}

export interface ModalProps {
    isOpen: boolean,
    onClose: () => void,
    title: string,
    onSubmit?: (e: FormEvent) => void,
    isLoading?: boolean,
    error?: string | null,
    submitText?: string,
    submitIcon?: ReactNode,
    cancelText?: string,
    maxWidth?: string,
    children: ReactNode
    submitVariant?: "primary" | "secondary" | "danger"
}

export interface DeleteConfirmModalProps {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: () => void,
    title?: string,
    itemName?: string,
    message?: string
    isLoading?: boolean,
}