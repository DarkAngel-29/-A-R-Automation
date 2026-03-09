import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth0 } from '@auth0/auth0-react'
import LoginPage from './pages/LoginPage.jsx'
import DashboardOverviewPage from './pages/DashboardOverviewPage.jsx'
import GenerateClaimPage from './pages/GenerateClaimPage.jsx'
import ClaimsListPage from './pages/ClaimsListPage.jsx'
import ClaimDetailsPage from './pages/ClaimDetailsPage.jsx'

function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth0()
    
    // Wait for Auth0 to finish loading before deciding to redirect
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                color: 'var(--text-muted)',
                fontSize: '0.95rem',
                background: 'var(--bg-primary)'
            }}>
                Loading…
            </div>
        )
    }
    
    return isAuthenticated ? children : <Navigate to="/" replace />
}

function App() {
    const { isAuthenticated, logout, isLoading } = useAuth0()

    const handleLogout = () => {
        logout({ 
            logoutParams: { 
                returnTo: window.location.origin 
            }
        })
    }

    // Show loading during auth check
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                color: 'var(--text-muted)',
                fontSize: '0.95rem',
                background: 'var(--bg-primary)'
            }}>
                Loading…
            </div>
        )
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
                        !isLoading && isAuthenticated
                            ? <Navigate to="/dashboard" replace />
                            : <LoginPage />
                    }
                />

                {/* Protected */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardOverviewPage onLogout={handleLogout} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/generate"
                    element={
                        <ProtectedRoute>
                            <GenerateClaimPage onLogout={handleLogout} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/claims"
                    element={
                        <ProtectedRoute>
                            <ClaimsListPage onLogout={handleLogout} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/claims/:id"
                    element={
                        <ProtectedRoute>
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
