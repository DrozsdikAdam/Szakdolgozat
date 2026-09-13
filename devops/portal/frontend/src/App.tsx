import { useEffect, useState } from 'react'
import type { ServiceId, ServiceItem } from './types/component/hub'
import { DEFAULT_SERVICES } from './constants/services'
import { Navbar } from './components/layout/navbar'
import { ServiceGrid } from './components/service/grid'
import { Card } from './components/common/Card'
import { Button } from './components/common/Button'
import { ArrowLeft } from 'lucide-react'
import { PlatformApi } from './client/api/platform'
import { ClusterOverviewTab } from './view/ClusterOverviewTab'

function App() {
  const [activeView, setActiveView] = useState<ServiceId | 'hub'>('hub')
  const [services, setService] = useState<ServiceItem[]>(DEFAULT_SERVICES)
  const [isClusterHealthy, setIsClusterHealthy] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const currentService = services.find(s => s.id === activeView)

  const handleSelectService = (id: ServiceId) => {
    setActiveView(id)
  }

  const handleBackToHub = () => {
    setActiveView('hub')
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    new PlatformApi()
      .getStatus()
      .then((res) => {
        setIsClusterHealthy(res.isInitialized)
      })
      .catch(() => {
        setIsClusterHealthy(false)
      })
      .finally(() => {
        setIsRefreshing(false)
      })
  }

  useEffect(() => {
    new PlatformApi()
      .getStatus()
      .then((res) => {
        setIsClusterHealthy(res.isInitialized)
      })
      .catch((_error) => {
        setService(DEFAULT_SERVICES)
        setIsClusterHealthy(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Navbar isClusterHealthy={isClusterHealthy} onRefresh={handleRefresh} isRefreshing={isRefreshing} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {
          activeView === 'hub' ? <div>
            <h1 className='text-4xl font-bold mb-2'>DevOps & PaaS Szolgáltatáskatalógus</h1>
            <h2 className='text-lg text-slate-400 mb-8'>Válaszd ki a monitorozni vagy konfigurálni kívánt platform komponenst az alábbi csempék közül.</h2>
            <ServiceGrid services={services} onSelectService={handleSelectService} />
          </div>
            :
            <div className="flex flex-col gap-4">
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ArrowLeft className="w-4 h-4" />}
                  onClick={handleBackToHub}
                  className="hover:bg-slate-800/80 text-slate-300 hover:text-slate-100"
                >
                  Vissza a szolgáltatásokhoz
                </Button>
              </div>

              {activeView === 'cluster' ? (
                <ClusterOverviewTab />
              ) : (
                <Card
                  title={currentService?.label}
                  subtitle={currentService?.description}
                  hoverEffect={false}
                >
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-cud-skyblue mb-4">
                      {currentService?.iconName}
                    </div>
                    <h3 className="text-xl font-bold text-slate-100">
                      {currentService?.label} vezérlőpult
                    </h3>
                    <p className="text-sm text-slate-400 mt-2 max-w-md">
                      A szolgáltatás részletes konfigurációs és monitorozási felülete a következő lépésben épül fel.
                    </p>
                  </div>
                </Card>
              )}
            </div>
        }

      </main>
    </div>
  )
}

export default App
