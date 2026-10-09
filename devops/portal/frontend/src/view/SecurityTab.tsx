import { useSecurityOverview } from "../hooks/useSecurityOverview"
import type { SecurityTabProps, SecuritySubTab } from "../types/securityTab"
import { SECURITY_TAB_OPTIONS, AUDIT_STATUS_OPTIONS } from "../constants/securityTab"
import { SecurityHeader } from "../components/dashboard/security/SecurityHeader"
import { SecurityScoreCard } from "../components/dashboard/security/SecurityScoreCard"
import { InfrastructureSecurityCards } from "../components/dashboard/security/InfrastructureSecurityCards"
import { VulnerabilityTable } from "../components/dashboard/security/VulnerabilityTable"
import { PasswordRotationModal } from "../components/dashboard/security/PasswordRotationModal"
import { AuditStats } from "../components/dashboard/audit/AuditStats"
import { AuditTable } from "../components/dashboard/audit/AuditTable"
import { SearchInput } from "../components/common/SearchInput"
import { SegmentedControl } from "../components/common/SegmentedControl"
import { AlertTriangle, Check } from "lucide-react"

export const SecurityTab = ({ initialTab = "vulnerabilities" }: SecurityTabProps) => {
    const {
        activeTab,
        handleTabChange,
        overview,
        filteredVulnerabilities,
        isSecurityLoading,
        isSecurityRefreshing,
        searchTerm,
        setSearchTerm,
        severityFilter,
        setSeverityFilter,
        componentFilter,
        setComponentFilter,
        isRotateModalOpen,
        openRotateModal,
        closeRotateModal,
        newPassword,
        setNewPassword,
        isRotating,
        rotateError,
        handleRotatePassword,
        auditLogs,
        totalAuditCount,
        auditSuccessCount,
        auditFailedCount,
        isAuditLoading,
        auditSearchQuery,
        setAuditSearchQuery,
        auditStatusFilter,
        setAuditStatusFilter,
        refreshCurrentTab,
        toastMessage,
        setToastMessage
    } = useSecurityOverview(initialTab)

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SecurityHeader
                    lastScanDate={overview?.lastScanDate}
                    onRefresh={refreshCurrentTab}
                    onOpenRotateModal={openRotateModal}
                    isRefreshing={activeTab === "vulnerabilities" ? isSecurityRefreshing : isAuditLoading}
                />

                <SegmentedControl<SecuritySubTab>
                    value={activeTab}
                    onChange={handleTabChange}
                    options={SECURITY_TAB_OPTIONS}
                    layout="pill"
                />
            </div>

            {activeTab === "vulnerabilities" && (
                <div className="flex flex-col gap-6">
                    <SecurityScoreCard
                        overallScore={overview?.overallScore ?? 0}
                        scoreGrade={overview?.scoreGrade ?? "A"}
                        criticalCount={overview?.vulnerabilities.summary.critical ?? 0}
                        highCount={overview?.vulnerabilities.summary.high ?? 0}
                        fixableCount={overview?.vulnerabilities.summary.fixable ?? 0}
                        isLoading={isSecurityLoading}
                    />

                    <InfrastructureSecurityCards
                        tlsCertificates={overview?.tlsCertificates ?? []}
                        secretCompliance={overview?.secretCompliance ?? []}
                        isLoading={isSecurityLoading}
                    />

                    <VulnerabilityTable
                        vulnerabilities={filteredVulnerabilities}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        severityFilter={severityFilter}
                        onSeverityFilterChange={setSeverityFilter}
                        componentFilter={componentFilter}
                        onComponentFilterChange={setComponentFilter}
                        isLoading={isSecurityLoading}
                    />
                </div>
            )}

            {activeTab === "audit" && (
                <div className="flex flex-col gap-6">
                    <AuditStats
                        totalLogs={totalAuditCount}
                        successCount={auditSuccessCount}
                        failedCount={auditFailedCount}
                    />

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <SearchInput
                            value={auditSearchQuery}
                            onChange={setAuditSearchQuery}
                            placeholder="Keresés művelet, részlet vagy azonosító alapján..."
                            className="w-full sm:w-80"
                        />

                        <SegmentedControl<"ALL" | "SUCCESS" | "FAILED">
                            value={auditStatusFilter}
                            onChange={setAuditStatusFilter}
                            options={AUDIT_STATUS_OPTIONS}
                            layout="grid"
                        />
                    </div>

                    <AuditTable
                        logs={auditLogs}
                        loading={isAuditLoading}
                        searchQuery={auditSearchQuery}
                    />
                </div>
            )}

            <PasswordRotationModal
                isOpen={isRotateModalOpen}
                onClose={closeRotateModal}
                onSubmit={handleRotatePassword}
                password={newPassword}
                onPasswordChange={setNewPassword}
                isRotating={isRotating}
                error={rotateError}
            />

            {toastMessage && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium animate-in slide-in-from-bottom-3 duration-200 ${
                        toastMessage.type === "success"
                            ? "bg-slate-900/95 border-cud-teal/50 text-cud-teal shadow-cud-teal/10"
                            : "bg-slate-900/95 border-cud-vermillon/50 text-cud-vermillon shadow-cud-vermillon/10"
                    }`}
                >
                    {toastMessage.type === "success" ? (
                        <Check className="w-4 h-4 shrink-0" />
                    ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{toastMessage.text}</span>
                    <button
                        type="button"
                        onClick={() => setToastMessage(null)}
                        className="ml-2 text-xs opacity-60 hover:opacity-100 transition-all cursor-pointer p-0.5"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    )
}
