import { useState } from "react"
import { Check, Copy, Loader2, Terminal } from "lucide-react"
import type { JMeterLogsModalProps } from "../../../types/component/resilience"
import { Modal } from "../../common/Modal"
import { Button } from "../../common/Button"

const renderLoadingLogs = () => (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        <span className="text-sm">Naplók letöltése a Kubernetes podból...</span>
    </div>
)

const renderLogContent = (content: string) => (
    <div className="relative">
        <pre className="bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-slate-800/80 overflow-auto max-h-[55vh] whitespace-pre-wrap select-text leading-relaxed">
            {content}
        </pre>
    </div>
)

export const JMeterLogsModal = ({ isOpen, job, isLoadingLogs, onClose }: JMeterLogsModalProps) => {
    const [copied, setCopied] = useState<boolean>(false)

    if (!job) {
        return null
    }

    const logContent = job.rawLogs || job.logs || "A konténer naplója még nem áll rendelkezésre (a pod inicializálódik)..."

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(logContent)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error("A napló vágólapra másolása sikertelen:", error)
        }
    }

    const renderModalBody = () => {
        if (isLoadingLogs) {
            return renderLoadingLogs()
        }
        return renderLogContent(logContent)
    }

    const getCopyButtonLabel = () => {
        if (copied) {
            return "Másolva!"
        }
        return "Napló Másolása"
    }

    const renderCopyButtonIcon = () => {
        if (copied) {
            return <Check className="w-4 h-4 text-emerald-400" />
        }
        return <Copy className="w-4 h-4" />
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`JMeter Naplók: ${job.jobName}`}
            subtitle={`Forgatókönyv: ${job.scenario} | ${job.threads} szál | ${job.duration} mp | Státusz: ${job.status}`}
            icon={<Terminal className="w-5 h-5 text-sky-400" />}
            maxWidth="4xl"
            footer={
                <div className="flex items-center justify-between w-full">
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={renderCopyButtonIcon()}
                        onClick={handleCopy}
                        disabled={isLoadingLogs}
                    >
                        {getCopyButtonLabel()}
                    </Button>

                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Bezárás
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-3">
                {renderModalBody()}
            </div>
        </Modal>
    )
}

