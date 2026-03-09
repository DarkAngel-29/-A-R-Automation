import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import LoginPage from './pages/LoginPage.jsx'
import DashboardOverviewPage from './pages/DashboardOverviewPage.jsx'
import GenerateClaimPage from './pages/GenerateClaimPage.jsx'
import ClaimsListPage from './pages/ClaimsListPage.jsx'
import ClaimDetailsPage from './pages/ClaimDetailsPage.jsx'

function ProtectedRoute({ isAuthenticated, children }) {
    return isAuthenticated ? children : <Navigate to="/" replace />
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = React.useState(
        () => sessionStorage.getItem('rcm_auth') === 'true'
    )

    const handleLogin = () => {
        sessionStorage.setItem('rcm_auth', 'true')
        setIsAuthenticated(true)
    }

    const handleLogout = () => {
        sessionStorage.removeItem('rcm_auth')
        setIsAuthenticated(false)
    }

    return (
        <BrowserRouter>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1e293b',
                        color: '#f1f5f9',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        fontFamily: "'Inter', sans-serif",
                    },
                }}
            />
            <Routes>
                {/* Public */}
                <Route
                    path="/"
                    element={
                        isAuthenticated
                            ? <Navigate to="/dashboard" replace />
                            : <LoginPage onLogin={handleLogin} />
                    }
                />

                {/* Protected */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <DashboardOverviewPage onLogout={handleLogout} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/generate"
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <GenerateClaimPage onLogout={handleLogout} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/claims"
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <ClaimsListPage onLogout={handleLogout} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/claims/:id"
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <ClaimDetailsPage onLogout={handleLogout} />
                        </ProtectedRoute>
                    }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
