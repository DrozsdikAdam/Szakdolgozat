import { useEffect, useState, useCallback, useMemo } from 'react'
import { Routes, Route, useNavigate, useLocation, Outlet } from 'react-router-dom'
import type { ServiceId, ServiceItem } from './types/component/hub'
import { DEFAULT_SERVICES } from './constants/services'
import { Navbar } from './components/layout/navbar'
import { ServiceGrid } from './components/service/grid'
import { Button } from './components/common/Button'
import { ArrowLeft } from 'lucide-react'
import { PlatformApi } from './client/api/platform'
import { K8sApi } from './client/api/k8s'
import { ClusterOverviewTab } from './view/ClusterOverviewTab'
import { FlagsTab } from './view/FlagsTab'
import { AuditTab } from './view/AuditTab'
import { BackupTab } from './view/BackupTab'
import { TrafficTab } from './view/TrafficTab'
import { AutoscalingTab } from './view/AutoscalingTab'
import { SetupTab } from './view/SetupTab'
import { ConfigTab } from './view/ConfigTab'
import { HealthcheckTab } from './view/HealthcheckTab'
import { DeploymentsTab } from './view/DeploymentsTab'
import { TelemetryTab } from './view/TelemetryTab'
import { SecurityTab } from './view/SecurityTab'
import { LoginTab } from './view/LoginTab'
import { ProtectedRoute } from './components/auth'
import { useAuth } from './hooks/useAuth'
import { ErrorState } from './components/common/ErrorState'
import { computeDynamicServices } from './constants/serviceStatus'

function ServiceLayout() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/')}
          className="hover:bg-slate-800/80 text-slate-300 hover:text-slate-100"
        >
          Vissza a szolgáltatásokhoz
        </Button>
      </div>
      <Outlet />
    </div>
  )
}

function NotFoundPage() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="py-6">
      <ErrorState
        type="not-found"
        title="Az oldal vagy nézet nem található"
        message="A megadott URL cím nem feleltethető meg egyetlen ismert portál szolgáltatásnak vagy nézetnek sem. Lehetséges, hogy elgépelted a címet, vagy a kért komponens még nem érhető el."
        errorCode="404 NOT_FOUND"
        targetUrl={location.pathname}
        onBack={() => navigate('/')}
        troubleshootingSteps={[
          "Ellenőrizd a böngésző címsorába beírt útvonal helyességét",
          "Kattints a fenti 'Vissza a szolgáltatásokhoz' gombra a kezdőlap eléréséhez",
          "Közvetlenül elérhető érvényes útvonalak: /telemetry, /cluster, /deployments, /audit, /traffic, /backup, /security"
        ]}
      />
    </div>
  )
}

function App() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [services, setService] = useState<ServiceItem[]>(DEFAULT_SERVICES)
  const [isClusterHealthy, setIsClusterHealthy] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  const platformApi = useMemo(() => new PlatformApi(), [])
  const k8sApi = useMemo(() => new K8sApi(), [])

  const loadPortalData = useCallback(async () => {
    if (!auth.isAuthenticated) {
      return
    }
    setIsRefreshing(true)
    try {
      const [statusRes, clusterRes] = await Promise.allSettled([
        platformApi.getStatus(),
        k8sApi.getOverview()
      ])

      const status = statusRes.status === 'fulfilled' ? statusRes.value : null
      const cluster = clusterRes.status === 'fulfilled' ? clusterRes.value : null
      const isHealthy = statusRes.status === 'fulfilled'

      setIsClusterHealthy(isHealthy)
      if (status) {
        setService(computeDynamicServices(status, cluster, isHealthy))
      } else {
        setService(DEFAULT_SERVICES)
      }
    } catch {
      setIsClusterHealthy(false)
      setService(DEFAULT_SERVICES)
    } finally {
      setIsRefreshing(false)
    }
  }, [auth.isAuthenticated, platformApi, k8sApi])

  const handleSelectService = (id: ServiceId) => {
    navigate(`/${id}`)
  }

  const handleRefresh = () => {
    loadPortalData()
  }

  useEffect(() => {
    if (auth.isAuthenticated) {
      loadPortalData()
    }
  }, [auth.isAuthenticated, loadPortalData])

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Navbar isClusterHealthy={isClusterHealthy} onRefresh={handleRefresh} isRefreshing={isRefreshing} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/login" element={<LoginTab />} />

          <Route element={<ProtectedRoute />}>
            <Route
              path="/"
              element={
                <div>
                  <h1 className="text-4xl font-bold mb-2">DevOps & PaaS Szolgáltatáskatalógus</h1>
                  <h2 className="text-lg text-slate-400 mb-8">
                    Válaszd ki a monitorozni vagy konfigurálni kívánt platform komponenst az alábbi csempék közül.
                  </h2>
                  <ServiceGrid services={services} onSelectService={handleSelectService} />
                </div>
              }
            />

            <Route element={<ServiceLayout />}>
              <Route path="/cluster" element={<ClusterOverviewTab />} />
              <Route path="/events" element={<ClusterOverviewTab initialView="events" />} />
              <Route path="/features" element={<FlagsTab onNavigate={handleSelectService} />} />
              <Route path="/audit" element={<AuditTab />} />
              <Route path="/backup" element={<BackupTab />} />
              <Route path="/traffic" element={<TrafficTab />} />
              <Route path="/autoscaling" element={<AutoscalingTab />} />
              <Route
                path="/setup"
                element={
                  <SetupTab
                    onComplete={() => {
                      handleRefresh()
                      navigate('/')
                    }}
                  />
                }
              />
              <Route path="/configs" element={<ConfigTab />} />
              <Route path="/health" element={<HealthcheckTab />} />
              <Route path="/deployments" element={<DeploymentsTab />} />
              <Route path="/telemetry" element={<TelemetryTab />} />
              <Route path="/security" element={<SecurityTab />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </main>
    </div>
  )
}

export default App
