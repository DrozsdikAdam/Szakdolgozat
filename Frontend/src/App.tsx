import { BrowserRouter, Routes, Route } from "react-router-dom"
import "./index.css"
import { LoginView } from "./views/LoginView"
import { AuthProvider } from "./context/AuthContext"

function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginView />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>

  )
}

export default App
