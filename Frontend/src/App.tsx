import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/product" replace />}
          />

          {/* Protected Routes wrapped in Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/product" element={<ProductView />} />
            <Route path="/bom" element={<BOMView />} />
            <Route path="/inventory" element={<InventoryView />} />
            <Route path="/workorder" element={<WorkOrderView />} />
            <Route path="/user" element={<UserView />} />
          </Route>

          <Route path="/login" element={<LoginView />} />
          <Route path="/unauthorized" element={
            <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] text-slate-100 text-lg font-semibold">
              Nincs jogosultsága az oldal megtekintéséhez.
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
