import type { ScoreGrade } from "../../security"

export interface SecurityScoreCardProps {
    overallScore: number
    scoreGrade: ScoreGrade
    criticalCount: number
    highCount: number
    fixableCount: number
    isLoading?: boolean
}