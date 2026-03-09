import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import { getClaims } from '../services/api.js'

export default function DashboardOverviewPage({ onLogout }) {
    const navigate = useNavigate()
    const [claims, setClaims] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        getClaims()
            .then(data => setClaims(data))
            .catch(() => toast.error('Failed to load claims'))
            .finally(() => setIsLoading(false))
    }, [])

    const totalAmount = claims.reduce((s, c) => s + c.claimAmount, 0)
    const highCount = claims.filter(c => c.priority === 'High').length
    const pendingCount = claims.filter(c => !c.emailSent).length
    const emailsSent = claims.filter(c => c.emailSent).length

    const statCards = [
        {
            icon: '📋',
            bg: 'rgba(99, 102, 241, 0.12)',
            color: 'var(--accent-indigo-light)',
            value: claims.length,
            label: 'Total Claims',
        },
        {
            icon: '🔴',
            bg: 'var(--priority-high-bg)',
            color: 'var(--priority-high)',
            value: highCount,
            label: 'High Priority',
        },
        {
            icon: '⏳',
            bg: 'var(--priority-medium-bg)',
            color: 'var(--priority-medium)',
            value: pendingCount,
            label: 'Pending Follow-up',
        },
        {
            icon: '📧',
            bg: 'var(--success-bg)',
            color: 'var(--success)',
            value: emailsSent,
            label: 'Emails Sent',
        },
    ]

    return (
        <div style={styles.page}>
            <Navbar onLogout={onLogout} />

            <main style={styles.main}>
                {/* Page header */}
                <div style={styles.header}>
                    <h1 style={styles.heading}>Dashboard Overview</h1>
                    <p style={styles.subheading}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Stat cards */}
                <div style={styles.statsGrid}>
                    {statCards.map((s, i) => (
                        <div
                            key={i}
                            className="glass-card"
                            style={{
                                ...styles.statCard,
                                animationDelay: `${i * 0.08}s`,
                            }}
                        >
                            <div style={{ ...styles.statIcon, background: s.bg }}>
                                {s.icon}
                            </div>
                            <div>
                                <div style={{ ...styles.statValue, color: s.color }}>
                                    {isLoading ? '—' : s.value}
                                </div>
                                <div style={styles.statLabel}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Total amount banner */}
                <div style={styles.amountBanner}>
                    <div style={styles.amountInner}>
                        <span style={styles.amountLabel}>Total Claims Value</span>
                        <span style={styles.amountValue}>
                            {isLoading ? '—' : `$${totalAmount.toLocaleString()}`}
                        </span>
                    </div>
                </div>

                {/* Quick actions */}
                <div style={styles.sectionTitle}>Quick Actions</div>
                <div style={styles.actionGrid}>
                    <button
                        id="btn-generate-claim"
                        className="glass-card"
                        style={{ ...styles.actionCard, ...styles.actionPrimary }}
                        onClick={() => navigate('/generate')}
                    >
                        <div style={styles.actionIcon}>➕</div>
                        <div>
                            <div style={styles.actionTitle}>Generate Claim</div>
                            <div style={styles.actionDesc}>Create a new insurance claim with AI priority scoring</div>
                        </div>
                        <span style={styles.actionArrow}>→</span>
                    </button>

                    <button
                        id="btn-view-claims"
                        className="glass-card"
                        style={styles.actionCard}
                        onClick={() => navigate('/claims')}
                    >
                        <div style={styles.actionIcon}>📋</div>
                        <div>
                            <div style={styles.actionTitle}>View All Claims</div>
                            <div style={styles.actionDesc}>Browse, filter, and manage all submitted claims</div>
                        </div>
                        <span style={styles.actionArrow}>→</span>
                    </button>
                </div>
            </main>
        </div>
    )
}

const styles = {
    page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    main: {
        flex: 1,
        maxWidth: 1100,
        width: '100%',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    header: { animation: 'fadeInUp 0.4s ease both' },
    heading: { fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 },
    subheading: { fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
    },
    statCard: {
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        animation: 'fadeInUp 0.4s ease both',
        cursor: 'default',
    },
    statIcon: {
        width: 46,
        height: 46,
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.3rem',
        flexShrink: 0,
    },
    statValue: { fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.1 },
    statLabel: {
        fontSize: '0.7rem',
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginTop: '0.2rem',
    },
    amountBanner: {
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(34,211,238,0.1) 100%)',
        border: '1px solid rgba(99,102,241,0.2)',
        padding: '1.25rem 1.75rem',
        animation: 'fadeInUp 0.5s ease both',
        animationDelay: '0.2s',
    },
    amountInner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    amountLabel: { fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 },
    amountValue: { fontSize: '2rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
    sectionTitle: {
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
    },
    actionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' },
    actionCard: {
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        cursor: 'pointer',
        animation: 'fadeInUp 0.5s ease both',
        animationDelay: '0.3s',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'left',
        transition: 'all var(--transition-base)',
    },
    actionPrimary: {
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.2)',
    },
    actionIcon: {
        fontSize: '1.75rem',
        flexShrink: 0,
    },
    actionTitle: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' },
    actionDesc: { fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 },
    actionArrow: {
        marginLeft: 'auto',
        fontSize: '1.1rem',
        color: 'var(--text-muted)',
        flexShrink: 0,
    },
}
