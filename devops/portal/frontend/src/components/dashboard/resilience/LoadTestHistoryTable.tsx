import { Terminal } from "lucide-react"
import type { LoadTestTableProps } from "../../../types/component/resilience"
import type { LoadTestItem } from "../../../types/resilience"
import { Card } from "../../common/Card"
import { Badge } from "../../common/Badge"
import { Button } from "../../common/Button"
import { EmptyState } from "../../common/EmptyState"
import { Skeleton } from "../../common/Skeleton"
import { formatResilienceDate, LOAD_TEST_STATUS_CONFIG } from "../../../constants/resilience"

const renderSkeleton = () => (
    <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-6 w-20" />
            </div>
        ))}
    </div>
)

const renderEmptyState = () => (
    <EmptyState
        title="Nincsenek terhelésteszt előzmények"
        description="Indíts el egy új Apache JMeter tesztet a fenti vezérlőpult segítségével."
    />
)

export const LoadTestHistoryTable = ({ tests, isLoading = false, onViewLogs }: LoadTestTableProps) => {
    const renderTableRow = (item: LoadTestItem) => {

        const statusConfig = LOAD_TEST_STATUS_CONFIG[item.status] || LOAD_TEST_STATUS_CONFIG.UNKNOWN

        return (
            <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-100">{item.jobName}</td>
                <td className="px-4 py-3 font-sans">
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {item.scenario}
                    </span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                    {item.threads} szál / {item.duration}s
                </td>
                <td className="px-4 py-3 font-sans">
                    <Badge
                        variant={statusConfig.variant}
                        text={statusConfig.text}
                        pulse={statusConfig.pulse}
                        size="sm"
                    />
                </td>
                <td className="px-4 py-3 text-slate-400">{formatResilienceDate(item.startTime)}</td>
                <td className="px-4 py-3 text-right font-sans">
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={<Terminal className="w-3.5 h-3.5" />}
                        onClick={() => onViewLogs(item.jobName)}
                        className="text-xs"
                    >
                        Napló
                    </Button>
                </td>
            </tr>
        )
    }

    const renderTableContent = () => {
        if (isLoading) {
            return renderSkeleton()
        }

        if (tests.length === 0) {
            return renderEmptyState()
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                        <tr>
                            <th className="px-4 py-3">Job Név</th>
                            <th className="px-4 py-3">Forgatókönyv</th>
                            <th className="px-4 py-3">Szálak / Idő</th>
                            <th className="px-4 py-3">Státusz</th>
                            <th className="px-4 py-3">Indítva</th>
                            <th className="px-4 py-3 text-right">Naplók</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                        {tests.map(renderTableRow)}
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <Card hoverEffect={false} className="border-slate-800 bg-slate-900/60 p-6 flex flex-col gap-4">
            <div>
                <h3 className="text-lg font-bold text-slate-100">JMeter Terhelésteszt Előzmények</h3>
                <p className="text-xs text-slate-400">Kubernetes batch jobok futási eredményei és naplói</p>
            </div>

            {renderTableContent()}
        </Card>
    )
}

