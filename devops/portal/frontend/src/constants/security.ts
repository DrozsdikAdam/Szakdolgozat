import type { DynamicStatus, RotationStatus, ScoreGrade, SeverityType } from "../types/security"
import type { BadgeProps } from "../types/component/badgeProps"

export interface GradeStyleConfig {
    badgeVariant: 'teal' | 'orange' | 'vermillon'
    textClass: string
    bgClass: string
    borderClass: string
    description: string
}

export const GRADE_STYLES: Record<ScoreGrade, GradeStyleConfig> = {
    A: {
        badgeVariant: 'teal',
        textClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/10',
        borderClass: 'border-emerald-500/30',
        description: 'Kiváló védelem, nincs ismert magas rizikójú rés.'
    },
    B: {
        badgeVariant: 'teal',
        textClass: 'text-cud-teal',
        bgClass: 'bg-cud-teal-bg',
        borderClass: 'border-cud-teal-border',
        description: 'Jó biztonsági állapot, alacsony kitettség.'
    },
    C: {
        badgeVariant: 'orange',
        textClass: 'text-amber-400',
        bgClass: 'bg-amber-500/10',
        borderClass: 'border-amber-500/30',
        description: 'Mérsékelt kockázat, figyelmet igénylő sebezhetőségek.'
    },
    D: {
        badgeVariant: 'orange',
        textClass: 'text-cud-orange',
        bgClass: 'bg-cud-orange-bg',
        borderClass: 'border-cud-orange-border',
        description: 'Jelentős kitettség, javítási intézkedések szükségesek.'
    },
    F: {
        badgeVariant: 'vermillon',
        textClass: 'text-cud-vermillon',
        bgClass: 'bg-cud-vermillon-bg',
        borderClass: 'border-cud-vermillon-border',
        description: 'Kritikus kockázat, azonnali beavatkozást igényel!'
    }
}

export const SEVERITY_BADGES: Record<SeverityType, BadgeProps> = {
    CRITICAL: { text: "CRITICAL", variant: "vermillon", pulse: true },
    HIGH: { text: "HIGH", variant: "orange", pulse: false },
    MEDIUM: { text: "MEDIUM", variant: "orange", pulse: false },
    LOW: { text: "LOW", variant: "skyblue", pulse: false }
}

export const SEVERITY_OPTIONS = [
    { value: "ALL", label: "Minden súlyosság" },
    { value: "CRITICAL", label: "Kritikus (Critical)" },
    { value: "HIGH", label: "Magas (High)" },
    { value: "MEDIUM", label: "Közepes (Medium)" },
    { value: "LOW", label: "Alacsony (Low)" }
]

export const COMPONENT_OPTIONS = [
    { value: "ALL", label: "Minden forrás" },
    { value: "docker", label: "Docker konténer (Trivy)" },
    { value: "backend", label: "Backend (npm-audit)" },
    { value: "frontend", label: "Frontend (npm-audit)" }
]

export const TLS_STATUS_BADGES: Record<DynamicStatus, BadgeProps> = {
    VALID: { text: "Érvényes", variant: "teal", pulse: false },
    EXPIRING_SOON: { text: "Hamarosan lejár", variant: "orange", pulse: true },
    EXPIRED: { text: "Lejárt / Kritikus", variant: "vermillon", pulse: true }
}

export const SECRET_STATUS_BADGES: Record<RotationStatus, BadgeProps> = {
    COMPLIANT: { text: "Megfelelő", variant: "teal", pulse: false },
    ROTATION_DUE: { text: "Rotálás esedékes", variant: "orange", pulse: true },
    CRITICAL_OVERDUE: { text: "Kritikusan elavult", variant: "vermillon", pulse: true }
}

export interface PasswordRuleDefinition {
    id: string
    label: string
    validator: (pwd: string) => boolean
}

export const PASSWORD_ROTATION_RULES: PasswordRuleDefinition[] = [
    { id: "length", label: "Legalább 8 karakter hosszú", validator: (pwd) => pwd.length >= 8 },
    { id: "uppercase", label: "Legalább egy nagybetű (A-Z)", validator: (pwd) => /[A-Z]/.test(pwd) },
    { id: "lowercase", label: "Legalább egy kisbetű (a-z)", validator: (pwd) => /[a-z]/.test(pwd) },
    { id: "number", label: "Legalább egy számjegy (0-9)", validator: (pwd) => /[0-9]/.test(pwd) },
    { id: "special", label: "Legalább egy speciális karakter (!@#$%...)", validator: (pwd) => /[^A-Za-z0-9]/.test(pwd) }
]

