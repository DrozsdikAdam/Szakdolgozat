import { BrowserRouter, Routes, Route } from "react-router-dom"
import "./index.css"
import { LoginView } from "./views/LoginView"
import { AuthProvider } from "./context/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { ProductView } from "./views/ProductView"
import { BOMView } from "./views/BOMView"
import { InventoryView } from "./views/InventoryView"
import { Layout } from "./components/Layout"
import { WorkOrderView } from "./views/WorkOrderView"
import { UserView } from "./views/UserView"
import { MachineView } from "./views/machine/MachineView"
import { MaintenanceView } from "./views/maintenance/MaintenanceView"
import { MachineCreateView } from "./views/machine/MachineCreateView"
import { MaintenanceEditView } from "./views/maintenance/MaintenanceEditView"
import { AnalyticsView } from "./views/AnalyticsView"
import { AuditLogView } from "./views/AuditLogView"
import { NotFoundView } from "./views/NotFoundView"
import { UnauthorizedView } from "./views/UnauthorizedView"
import { HomeRedirect } from "./components/HomeRedirect"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<HomeRedirect />}
          />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >

            <Route
              path="/product"
              element={
                <ProtectedRoute allowedRoles={["SYSTEMADMIN", "CEO", "MANAGER", "OPERATOR"]}>
                  <ProductView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute allowedRoles={["SYSTEMADMIN", "CEO", "MANAGER", "OPERATOR", "TECHNICIAN"]}>
                  <InventoryView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bom"
              element={
                <ProtectedRoute allowedRoles={["SYSTEMADMIN", "CEO", "MANAGER"]}>
                  <BOMView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workorder"
              element={
                <ProtectedRoute allowedRoles={["SYSTEMADMIN", "CEO", "MANAGER", "OPERATOR"]}>
                  <WorkOrderView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user"
              element={
                <ProtectedRoute allowedRoles={["SYSTEMADMIN", "CEO"]}>
                  <UserView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/machine"
              element={
                <ProtectedRoute allowedRoles={["SYSTEMADMIN", "CEO", "MANAGER", "OPERATOR", "TECHNICIAN"]}>
                  <MachineView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/machine/create"
              element={
                <ProtectedRoute allowedRoles={["SYSTEMADMIN", "CEO", "MANAGER"]}>
                  <MachineCreateView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/maintenance"
              element={
                <ProtectedRoute allowedRoles={["SYSTEMADMIN", "CEO", "MANAGER", "TECHNICIAN"]}>
                  <MaintenanceView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/maintenance/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["SYSTEMADMIN", "TECHNICIAN"]}>
                  <MaintenanceEditView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={["SYSTEMADMIN", "CEO", "MANAGER"]}>
                  <AnalyticsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logs"
              element={
                <ProtectedRoute allowedRoles={["SYSTEMADMIN", "CEO"]}>
                  <AuditLogView />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/login" element={<LoginView />} />
          <Route path="/unauthorized" element={<UnauthorizedView />} />
          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
