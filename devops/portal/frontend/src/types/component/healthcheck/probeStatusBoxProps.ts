import type { ReactNode } from "react"
import type { ProbeDefinition } from "../../healthcheck"

export interface ProbeStatusBoxProps {
    title: string
    icon: ReactNode
    probe?: ProbeDefinition
}