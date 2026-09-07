import { ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from "lucide-react"
import { SelectField } from "./form/SelectField"
import type { PaginationProps } from "../../types/common/PaginationProps"


export const Pagination = ({ children, pageNumber, pageSize, totalElements, totalPages, first, last, onPageChange, onPageSizeChange }: PaginationProps) => {
    return (
        <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 px-1 text-sm text-slate-400">
                {totalElements > 0 && onPageSizeChange && (
                    <div className="w-44">
                        <SelectField
                            options={[
                                { key: "10", label: "10 db / oldal" },
                                { key: "20", label: "20 db / oldal" },
                                { key: "50", label: "50 db / oldal" },
                                { key: "100", label: "100 db / oldal" }
                            ]}
                            value={pageSize.toString()}
                            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                            label="Elemek száma"
                        />
                    </div>
                )}
                <div className="sm:ml-auto text-sm font-medium text-slate-300">
                    {totalElements === 0 ? (
                        <span>Nincs megjeleníthető elem</span>
                    ) : (
                        <span>
                            Összesen <strong className="text-slate-100 font-semibold">{totalElements}</strong> elem |{" "}
                            <strong className="text-slate-100 font-semibold">{pageNumber + 1}</strong> / {Math.max(totalPages, 1)} oldal
                        </span>
                    )}
                </div>
            </div>

            <div className="w-full">
                {children}
            </div>

            {totalElements > 0 && (
                <div className="flex items-center justify-end gap-2 pt-2 px-1">
                    <button
                        type="button"
                        onClick={() => onPageChange?.(0)}
                        disabled={first || pageNumber === 0}
                        title="Első oldal"
                        className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800/80 disabled:hover:text-slate-300"
                    >
                        <ChevronsLeft size={20} />
                    </button>

                    <button
                        type="button"
                        onClick={() => onPageChange?.(pageNumber - 1)}
                        disabled={first || pageNumber === 0}
                        title="Előző oldal"
                        className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800/80 disabled:hover:text-slate-300"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-semibold text-slate-200">
                        {pageNumber + 1} / {Math.max(totalPages, 1)}
                    </div>

                    <button
                        type="button"
                        onClick={() => onPageChange?.(pageNumber + 1)}
                        disabled={last || pageNumber >= totalPages - 1 || totalPages === 0}
                        title="Következő oldal"
                        className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800/80 disabled:hover:text-slate-300"
                    >
                        <ChevronRight size={20} />
                    </button>

                    <button
                        type="button"
                        onClick={() => onPageChange?.(totalPages - 1)}
                        disabled={last || pageNumber >= totalPages - 1 || totalPages === 0}
                        title="Utolsó oldal"
                        className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800/80 disabled:hover:text-slate-300"
                    >
                        <ChevronsRight size={20} />
                    </button>
                </div>
            )}
        </div>
    )
}