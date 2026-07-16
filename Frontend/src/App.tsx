import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import "./index.css"
import { LoginView } from "./views/LoginView"
import { AuthProvider } from "./context/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white">
                  <h1 className="text-3xl font-bold">Placeholder</h1>
                </div>
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
