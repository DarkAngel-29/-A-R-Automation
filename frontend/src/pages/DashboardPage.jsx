import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import ClaimForm from '../components/ClaimForm.jsx'
import ClaimsTable from '../components/ClaimsTable.jsx'
import { generateClaim, getClaims, sendEmail } from '../services/api.js'

const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
    },
    main: {
        flex: 1,
        maxWidth: 1200,
        width: '100%',
        margin: '0 auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    statsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        animation: 'fadeInUp 0.4s ease both',
    },
    statCard: {
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        transition: 'all var(--transition-fast)',
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.3rem',
        flexShrink: 0,
    },
    statValue: {
        fontSize: '1.5rem',
        fontWeight: 800,
        lineHeight: 1.1,
        color: 'var(--text-primary)',
    },
    statLabel: {
        fontSize: '0.72rem',
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
}

export default function DashboardPage({ onLogout }) {
    const [claims, setClaims] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Load existing claims on mount
    useEffect(() => {
        getClaims()
            .then(data => setClaims(data))
            .finally(() => setIsLoading(false))
    }, [])

    const handleGenerateClaim = async (formData) => {
        setIsSubmitting(true)
        try {
            const newClaim = await generateClaim(formData)
            setClaims(prev => [newClaim, ...prev])
            toast.success(
                `Claim ${newClaim.id} created — Priority: ${newClaim.priority}`,
                { duration: 3500, icon: '✅' }
            )
        } catch (err) {
            toast.error('Failed to generate claim', { icon: '❌' })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSendEmail = async (claimId) => {
        try {
            const result = await sendEmail(claimId)
            setClaims(prev =>
                prev.map(c => (c.id === claimId ? { ...c, emailSent: true } : c))
            )
            toast.success(result.message, { duration: 3000, icon: '📧' })
        } catch (err) {
            toast.error('Failed to send email', { icon: '❌' })
        }
    }

    // Compute stats
    const totalAmount = claims.reduce((s, c) => s + c.claimAmount, 0)
    const highCount = claims.filter(c => c.priority === 'High').length
    const emailsSent = claims.filter(c => c.emailSent).length

    const statCards = [
        {
            icon: '📋',
            bg: 'rgba(99, 102, 241, 0.12)',
            value: claims.length,
            label: 'Total Claims',
        },
        {
            icon: '💰',
            bg: 'rgba(34, 211, 238, 0.12)',
            value: `$${totalAmount.toLocaleString()}`,
            label: 'Total Amount',
        },
        {
            icon: '🔴',
            bg: 'var(--priority-high-bg)',
            value: highCount,
            label: 'High Priority',
        },
        {
            icon: '📧',
            bg: 'var(--success-bg)',
            value: emailsSent,
            label: 'Emails Sent',
        },
    ]

    return (
        <div style={styles.page}>
            <Navbar onLogout={onLogout} />

            <main style={styles.main}>
                {/* Stats row */}
                <div style={styles.statsRow}>
                    {statCards.map((s, i) => (
                        <div
                            key={i}
                            className="glass-card"
                            style={{
                                ...styles.statCard,
                                animationDelay: `${i * 0.06}s`,
                            }}
                        >
                            <div
                                style={{
                                    ...styles.statIcon,
                                    background: s.bg,
                                }}
                            >
                                {s.icon}
                            </div>
                            <div>
                                <div style={styles.statValue}>{s.value}</div>
                                <div style={styles.statLabel}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Claim Form */}
                <ClaimForm onSubmit={handleGenerateClaim} isSubmitting={isSubmitting} />

                {/* Claims Table */}
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        Loading claims…
                    </div>
                ) : (
                    <ClaimsTable claims={claims} onSendEmail={handleSendEmail} />
                )}
            </main>
        </div>
    )
}
