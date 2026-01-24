import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './components/Dashboard'
import AdminPanel from './components/AdminPanel'

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen font-sans bg-background text-slate-900">
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        <Route element={<ProtectedRoute />}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/admin" element={<AdminPanel />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    )
}

export default App
