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
import { DatabaseApi } from './client/api/database'
import { SecurityApi } from './client/api/security'
import { ClusterOverviewTab } from './view/ClusterOverviewTab'
import { TrafficTab } from './view/TrafficTab'
import { ConfigsTab } from './view/ConfigsTab'
import { HealthcheckTab } from './view/HealthcheckTab'
import { DeploymentsTab } from './view/DeploymentsTab'
import { TelemetryTab } from './view/TelemetryTab'
import { ResilienceTab } from './view/ResilienceTab'
import { SecurityTab } from './view/SecurityTab'
import { DatabaseTab } from './view/DatabaseTab'
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
          "Közvetlenül elérhető érvényes útvonalak: /telemetry, /cluster, /deployments, /audit, /traffic, /backup, /resilience, /security"
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
  const dbApi = useMemo(() => new DatabaseApi(), [])
  const securityApi = useMemo(() => new SecurityApi(), [])

  const loadPortalData = useCallback(async () => {
    if (!auth.isAuthenticated) {
      return
    }
    setIsRefreshing(true)
    try {
      const [statusRes, clusterRes, dbRes, rateLimitRes, secRes] = await Promise.allSettled([
        platformApi.getStatus(),
        k8sApi.getOverview(),
        dbApi.getOverview(),
        k8sApi.getRateLimit(),
        securityApi.getOverview()
      ])

      const status = statusRes.status === 'fulfilled' ? statusRes.value : null
      const cluster = clusterRes.status === 'fulfilled' ? clusterRes.value : null
      const dbOverview = dbRes.status === 'fulfilled' ? dbRes.value : null
      const rateLimit = rateLimitRes.status === 'fulfilled' ? rateLimitRes.value : null
      const securityOverview = secRes.status === 'fulfilled' ? secRes.value : null
      const isHealthy = statusRes.status === 'fulfilled' || clusterRes.status === 'fulfilled'

      setIsClusterHealthy(isHealthy)
      setService(computeDynamicServices({
        status,
        clusterOverview: cluster,
        dbOverview,
        rateLimit,
        securityOverview,
        isClusterHealthy: isHealthy
      }))
    } catch {
      setIsClusterHealthy(false)
      setService(DEFAULT_SERVICES)
    } finally {
      setIsRefreshing(false)
    }
  }, [auth.isAuthenticated, platformApi, k8sApi, dbApi, securityApi])

  const handleSelectService = (id: ServiceId) => {
    if (id === 'configs' || id === 'features') {
      navigate('/configs?tab=features')
    } else {
      navigate(`/${id}`)
    }
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
              <Route path="/features" element={<ConfigsTab initialTab="features" onNavigate={handleSelectService} />} />
              <Route path="/audit" element={<SecurityTab initialTab="audit" />} />
              <Route path="/backup" element={<DatabaseTab initialTab="backups" />} />
              <Route path="/traffic" element={<TrafficTab />} />
              <Route path="/autoscaling" element={<TrafficTab initialTab="hpa" />} />
              <Route path="/setup" element={<ConfigsTab initialTab="wizard" onNavigate={handleSelectService} />} />
              <Route path="/configs" element={<ConfigsTab initialTab="features" onNavigate={handleSelectService} />} />
              <Route path="/config" element={<ConfigsTab initialTab="features" onNavigate={handleSelectService} />} />
              <Route path="/health" element={<HealthcheckTab />} />
              <Route path="/deployments" element={<DeploymentsTab />} />
              <Route path="/telemetry" element={<TelemetryTab />} />
              <Route path="/resilience" element={<ResilienceTab />} />
              <Route path="/security" element={<SecurityTab />} />
              <Route path="/database" element={<DatabaseTab />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </main>
    </div>
  )
}


export default App
