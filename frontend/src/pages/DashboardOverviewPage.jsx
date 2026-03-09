import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import AgingChart from '../components/AgingChart.jsx'
import PriorityChart from '../components/PriorityChart.jsx'
import AIInsightsCard from '../components/AIInsightsCard.jsx'
import ActivityFeed from '../components/ActivityFeed.jsx'
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

    // Follow-up candidates: claims with >0 follow-ups or high priority without email
    const followUpItems = claims
        .filter(c => (c.followUps || 0) > 0 || (c.priority === 'High' && !c.emailSent))
        .slice(0, 4)

    const statCards = [
        {
            id: 'stat-total',
            icon: '📋',
            bg: 'rgba(99, 102, 241, 0.12)',
            color: 'var(--accent-indigo-light)',
            value: claims.length,
            label: 'Total Claims',
            nav: '/claims',
            tip: 'View all claims',
        },
        {
            id: 'stat-high',
            icon: '🔴',
            bg: 'var(--priority-high-bg)',
            color: 'var(--priority-high)',
            value: highCount,
            label: 'High Priority',
            nav: '/claims?priority=High',
            tip: 'View high-priority claims',
        },
        {
            id: 'stat-pending',
            icon: '⏳',
            bg: 'var(--priority-medium-bg)',
            color: 'var(--priority-medium)',
            value: pendingCount,
            label: 'Pending Follow-up',
            nav: '/claims?followup=Required',
            tip: 'View pending follow-up claims',
        },
        {
            id: 'stat-emails',
            icon: '📧',
            bg: 'var(--success-bg)',
            color: 'var(--success)',
            value: emailsSent,
            label: 'Emails Sent',
            nav: '/claims',
            tip: 'View all claims',
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

                {/* Stat cards — clickable */}
                <div style={styles.statsGrid}>
                    {statCards.map((s, i) => (
                        <button
                            key={i}
                            id={s.id}
                            className="glass-card"
                            title={s.tip}
                            onClick={() => navigate(s.nav)}
                            style={{
                                ...styles.statCard,
                                animationDelay: `${i * 0.08}s`,
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.borderColor = 'var(--border-glow)'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.borderColor = 'var(--border-glass)'
                            }}
                        >
                            <div style={{ ...styles.statIcon, background: s.bg }}>
                                {s.icon}
                            </div>
                            <div style={styles.statBody}>
                                <div style={{ ...styles.statValue, color: s.color }}>
                                    {isLoading ? '—' : s.value}
                                </div>
                                <div style={styles.statLabel}>{s.label}</div>
                            </div>
                            <span style={styles.statArrow}>›</span>
                        </button>
                    ))}
                </div>

                {/* Total amount banner */}
                <div style={styles.amountBanner}>
                    <div style={styles.amountInner}>
                        <span style={styles.amountLabel}>Total Claims Value</span>
                        <span style={styles.amountValue}>
                            {isLoading ? '—' : `₹${totalAmount.toLocaleString()}`}
                        </span>
                    </div>
                </div>

                {/* ── Operational Insights ── */}
                <div style={styles.sectionHeader}>
                    <div style={styles.sectionTitle}>Operational Insights</div>
                    <div style={styles.sectionSubtitle}>Real-time analytics for your claims pipeline</div>
                </div>

                <div style={styles.insightsGrid}>
                    <AgingChart claims={claims} />
                    <PriorityChart claims={claims} />
                    <AIInsightsCard claims={claims} />
                    <ActivityFeed claims={claims} />
                </div>

                {/* ── Upcoming Follow-Ups ── */}
                {followUpItems.length > 0 && (
                    <div>
                        <div style={styles.sectionHeader}>
                            <div style={styles.sectionTitle}>Upcoming Follow-Ups</div>
                            <div style={styles.sectionSubtitle}>Click any item to jump to the claim</div>
                        </div>
                        <div style={styles.followUpList}>
                            {followUpItems.map((c, i) => (
                                <button
                                    key={c.id}
                                    id={`followup-${c.id}`}
                                    className="glass-card"
                                    style={{ ...styles.followUpItem, animationDelay: `${i * 0.07}s` }}
                                    onClick={() => navigate(`/claims?highlight=${c.id}`)}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-glow)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-glass)'}
                                >
                                    <div style={styles.followUpIcon}>⏰</div>
                                    <div style={styles.followUpText}>
                                        <span style={styles.followUpId}>{c.id}</span>
                                        <span style={styles.followUpDesc}>
                                            {c.priority === 'High' && !c.emailSent
                                                ? 'High priority — no email sent'
                                                : `${c.followUps} follow-up${c.followUps !== 1 ? 's' : ''} logged`}
                                        </span>
                                    </div>
                                    <div style={{
                                        ...styles.followUpBadge,
                                        background: c.priority === 'High' ? 'var(--priority-high-bg)' : 'var(--priority-medium-bg)',
                                        color: c.priority === 'High' ? 'var(--priority-high)' : 'var(--priority-medium)',
                                    }}>
                                        {c.priority}
                                    </div>
                                    <span style={styles.followUpArrow}>→</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

const styles = {
    page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    main: {
        flex: 1,
        maxWidth: 1200,
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
        cursor: 'pointer',
        textAlign: 'left',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-lg)',
        transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
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
    statBody: { flex: 1 },
    statValue: { fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.1 },
    statLabel: {
        fontSize: '0.7rem',
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginTop: '0.2rem',
    },
    statArrow: { color: 'var(--text-muted)', fontSize: '1.3rem', flexShrink: 0 },

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

    sectionHeader: { display: 'flex', flexDirection: 'column', gap: '0.1rem' },
    sectionTitle: {
        fontSize: '0.85rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
    },
    sectionSubtitle: { fontSize: '0.75rem', color: 'var(--text-muted)' },

    insightsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
    },

    followUpList: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
    followUpItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        padding: '0.85rem 1.25rem',
        cursor: 'pointer',
        textAlign: 'left',
        animation: 'fadeInUp 0.4s ease both',
        transition: 'border-color var(--transition-fast)',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-md)',
    },
    followUpIcon: { fontSize: '1.1rem', flexShrink: 0 },
    followUpText: { display: 'flex', flexDirection: 'column', gap: '0.1rem', flex: 1 },
    followUpId: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' },
    followUpDesc: { fontSize: '0.75rem', color: 'var(--text-muted)' },
    followUpBadge: {
        fontSize: '0.7rem',
        fontWeight: 700,
        padding: '0.2rem 0.6rem',
        borderRadius: 'var(--radius-full)',
        flexShrink: 0,
    },
    followUpArrow: { color: 'var(--text-muted)', fontSize: '0.9rem', flexShrink: 0 },
}
