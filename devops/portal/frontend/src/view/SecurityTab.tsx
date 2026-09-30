import { AlertTriangle, Check } from "lucide-react"
import { useSecurityHook } from "../hooks/useSecurity"
import { SecurityHeader } from "../components/dashboard/security/SecurityHeader"
import { SecurityScoreCard } from "../components/dashboard/security/SecurityScoreCard"
import { InfrastructureSecurityCards } from "../components/dashboard/security/InfrastructureSecurityCards"
import { VulnerabilityTable } from "../components/dashboard/security/VulnerabilityTable"
import { PasswordRotationModal } from "../components/dashboard/security/PasswordRotationModal"

export const SecurityTab = () => {
    const {
        overview,
        filteredVulnerabilities,
        isLoading,
        isRefreshing,
        toastMessage,
        searchTerm,
        setSearchTerm,
        severityFilter,
        setSeverityFilter,
        componentFilter,
        setComponentFilter,
        isRotateModalOpen,
        newPassword,
        setNewPassword,
        isRotating,
        rotateError,
        openModal,
        closeModal,
        handleRotatePassword,
        handleRefresh
    } = useSecurityHook()

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <SecurityHeader
                lastScanDate={overview?.lastScanDate}
                onRefresh={handleRefresh}
                onOpenRotateModal={openModal}
                isRefreshing={isRefreshing}
            />

            <SecurityScoreCard
                overallScore={overview?.overallScore ?? 0}
                scoreGrade={overview?.scoreGrade ?? "A"}
                criticalCount={overview?.vulnerabilities.summary.critical ?? 0}
                highCount={overview?.vulnerabilities.summary.high ?? 0}
                fixableCount={overview?.vulnerabilities.summary.fixable ?? 0}
                isLoading={isLoading}
            />

            <InfrastructureSecurityCards
                tlsCertificates={overview?.tlsCertificates ?? []}
                secretCompliance={overview?.secretCompliance ?? []}
                isLoading={isLoading}
            />

            <VulnerabilityTable
                vulnerabilities={filteredVulnerabilities}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                severityFilter={severityFilter}
                onSeverityFilterChange={setSeverityFilter}
                componentFilter={componentFilter}
                onComponentFilterChange={setComponentFilter}
                isLoading={isLoading}
            />

            <PasswordRotationModal
                isOpen={isRotateModalOpen}
                onClose={closeModal}
                onSubmit={handleRotatePassword}
                password={newPassword}
                onPasswordChange={setNewPassword}
                isRotating={isRotating}
                error={rotateError}
            />

            {toastMessage && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium animate-in slide-in-from-bottom-3 duration-200 ${toastMessage.type === "success"
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
                </div>
            )}
        </div>
    )
}
