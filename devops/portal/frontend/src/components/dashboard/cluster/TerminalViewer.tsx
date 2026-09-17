import { useEffect, useMemo, useRef } from "react"
import { RefreshCw, Terminal } from "lucide-react"
import type { TerminalViewerProps } from "../../../types/component/cluster/terminalViewerProps"

export const TerminalViewer = ({
    lines,
    loading = false,
    searchQuery = "",
    autoScroll = true,
    loadingText = "Naplók olvasása a Kubernetes API-ból...",
    emptyText = "A podhoz jelenleg nem található naplóbejegyzés.",
    noMatchText = "Nincs a keresésnek megfelelő naplósor.",
    className = ""
}: TerminalViewerProps) => {
    const endRef = useRef<HTMLDivElement | null>(null)

    const filteredLines = useMemo(() => {
        if (!searchQuery.trim()) return lines
        const q = searchQuery.toLowerCase()
        return lines.filter((line) => line.toLowerCase().includes(q))
    }, [lines, searchQuery])

    useEffect(() => {
        if (autoScroll && endRef.current) {
            endRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [filteredLines, autoScroll])

    const formatLine = (line: string) => {
        const lower = line.toLowerCase()
        if (
            lower.includes("error") ||
            lower.includes("fail") ||
            lower.includes("fatal") ||
            lower.includes("exception")
        ) {
            return <span className="text-cud-vermillon font-semibold">{line}</span>
        }
        if (lower.includes("warn")) {
            return <span className="text-cud-orange">{line}</span>
        }
        if (
            lower.includes("success") ||
            lower.includes("uploaded") ||
            lower.includes("ready")
        ) {
            return <span className="text-cud-teal">{line}</span>
        }
        return <span className="text-slate-300">{line}</span>
    }

    return (
        <div className={`flex-1 overflow-y-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed select-text ${className}`}>
            {loading && lines.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                    <RefreshCw className="w-8 h-8 animate-spin text-cud-skyblue mb-3" />
                    <p className="text-xs font-mono">{loadingText}</p>
                </div>
            )}

            {!loading && filteredLines.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
                    <Terminal className="w-10 h-10 mb-3 opacity-40 text-slate-400" />
                    <p className="font-mono text-sm">
                        {searchQuery ? noMatchText : emptyText}
                    </p>
                </div>
            )}

            {filteredLines.map((line, index) => (
                <div
                    key={index}
                    className="flex items-start hover:bg-slate-900/60 py-0.5 px-1 rounded transition-colors group"
                >
                    <span className="w-10 shrink-0 text-slate-600 select-none text-right pr-3 font-mono text-[11px]">
                        {index + 1}
                    </span>
                    <div className="flex-1 break-all whitespace-pre-wrap">
                        {formatLine(line)}
                    </div>
                </div>
            ))}

            <div ref={endRef} />
        </div>
    )
}
