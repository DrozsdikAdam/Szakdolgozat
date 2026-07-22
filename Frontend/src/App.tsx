import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import "./index.css"
import { LoginView } from "./views/LoginView"
import { AuthProvider } from "./context/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { ProductView } from "./views/ProductView"
import { BOMView } from "./views/BOMView"
import { InventoryView } from "./views/InventoryView"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/product" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/product"
            element={
              <ProtectedRoute>
                <ProductView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bom"
            element={
              <ProtectedRoute>
                <BOMView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <InventoryView />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
