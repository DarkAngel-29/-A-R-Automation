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
    if (isLoading) return <LoadingScreen />
    return isAuthenticated ? children : <Navigate to="/" replace />
}

function LoadingScreen() {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100vh', color: 'var(--text-muted)', fontSize: '0.95rem',
            background: 'var(--bg-primary)',
        }}>
            Loading…
        </div>
    )
}

function App() {
    const { isAuthenticated, isLoading, logout, user } = useAuth0()

    // The logged-in user's email (from Google or email/password sign-in)
    const userEmail = user?.email || ''

    const handleLogout = () => {
        logout({ logoutParams: { returnTo: window.location.origin } })
    }

    if (isLoading) return <LoadingScreen />

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

                {/* Protected — pass userEmail to pages that need it */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardOverviewPage onLogout={handleLogout} userEmail={userEmail} />
                    </ProtectedRoute>
                } />
                <Route path="/generate" element={
                    <ProtectedRoute>
                        <GenerateClaimPage onLogout={handleLogout} userEmail={userEmail} />
                    </ProtectedRoute>
                } />
                <Route path="/claims" element={
                    <ProtectedRoute>
                        <ClaimsListPage onLogout={handleLogout} userEmail={userEmail} />
                    </ProtectedRoute>
                } />
                <Route path="/claims/:id" element={
                    <ProtectedRoute>
                        <ClaimDetailsPage onLogout={handleLogout} userEmail={userEmail} />
                    </ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
