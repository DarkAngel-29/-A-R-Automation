import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import ClaimsTable from '../components/ClaimsTable.jsx'
import { getClaims, sendEmail } from '../services/api.js'

export default function ClaimsListPage({ onLogout }) {
    const navigate = useNavigate()
    const [claims, setClaims] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState('All')

    useEffect(() => {
        getClaims()
            .then(data => setClaims(data))
            .catch(() => toast.error('Failed to load claims'))
            .finally(() => setIsLoading(false))
    }, [])

    const handleSendEmail = async (claimId) => {
        try {
            const result = await sendEmail(claimId)
            setClaims(prev =>
                prev.map(c => (c.id === claimId ? { ...c, emailSent: true } : c))
            )
            toast.success(result.message, { duration: 3000, icon: '📧' })
        } catch {
            toast.error('Failed to send email', { icon: '❌' })
        }
    }

    const handleViewClaim = (claimId) => {
        navigate(`/claims/${claimId}`)
    }

    const priorities = ['All', 'High', 'Medium', 'Low']
    const filtered = filter === 'All' ? claims : claims.filter(c => c.priority === filter)

    const filterBadgeColor = {
        All: { bg: 'rgba(99,102,241,0.1)', color: 'var(--accent-indigo-light)', border: 'rgba(99,102,241,0.2)' },
        High: { bg: 'var(--priority-high-bg)', color: 'var(--priority-high)', border: 'rgba(239,68,68,0.25)' },
        Medium: { bg: 'var(--priority-medium-bg)', color: 'var(--priority-medium)', border: 'rgba(245,158,11,0.25)' },
        Low: { bg: 'var(--priority-low-bg)', color: 'var(--priority-low)', border: 'rgba(34,197,94,0.25)' },
    }

    return (
        <div style={styles.page}>
            <Navbar onLogout={onLogout} />

            <main style={styles.main}>
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.heading}>Claims List</h1>
                        <p style={styles.subheading}>
                            {filtered.length} {filter === 'All' ? 'total' : filter.toLowerCase()} claim{filtered.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        id="btn-new-claim"
                        className="btn btn-primary"
                        onClick={() => navigate('/generate')}
                    >
                        ➕ New Claim
                    </button>
                </div>

                {/* Priority filter tabs */}
                <div style={styles.filterRow}>
                    {priorities.map(p => {
                        const isActive = filter === p
                        const colors = filterBadgeColor[p]
                        return (
                            <button
                                key={p}
                                id={`filter-${p.toLowerCase()}`}
                                onClick={() => setFilter(p)}
                                style={{
                                    ...styles.filterBtn,
                                    background: isActive ? colors.bg : 'transparent',
                                    color: isActive ? colors.color : 'var(--text-muted)',
                                    border: `1px solid ${isActive ? colors.border : 'var(--border-glass)'}`,
                                }}
                            >
                                {p} {p !== 'All' && <span style={styles.filterCount}>{claims.filter(c => c.priority === p).length}</span>}
                            </button>
                        )
                    })}
                </div>

                {/* Table */}
                {isLoading ? (
                    <div style={styles.loading}>Loading claims…</div>
                ) : filtered.length === 0 ? (
                    <div className="glass-card" style={styles.empty}>
                        <div style={styles.emptyIcon}>📭</div>
                        <div style={styles.emptyTitle}>No {filter !== 'All' ? filter.toLowerCase() + ' ' : ''}claims yet</div>
                        <div style={styles.emptyDesc}>
                            {filter !== 'All' ? 'Try a different filter, or ' : ''}
                            <button style={styles.emptyLink} onClick={() => navigate('/generate')}>
                                generate your first claim →
                            </button>
                        </div>
                    </div>
                ) : (
                    <ClaimsTable
                        claims={filtered}
                        onSendEmail={handleSendEmail}
                        onViewClaim={handleViewClaim}
                    />
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
        gap: '1.25rem',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        animation: 'fadeInUp 0.4s ease both',
    },
    heading: { fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 },
    subheading: { fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' },
    filterRow: {
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        animation: 'fadeInUp 0.4s ease both',
        animationDelay: '0.05s',
    },
    filterBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 1rem',
        fontSize: '0.82rem',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all var(--transition-fast)',
    },
    filterCount: {
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 'var(--radius-full)',
        padding: '0.05rem 0.4rem',
        fontSize: '0.72rem',
    },
    loading: { textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' },
    empty: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '4rem 2rem',
        gap: '0.5rem',
        animation: 'fadeInUp 0.4s ease both',
    },
    emptyIcon: { fontSize: '2.5rem', marginBottom: '0.5rem' },
    emptyTitle: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' },
    emptyDesc: { fontSize: '0.85rem', color: 'var(--text-muted)' },
    emptyLink: {
        background: 'none',
        border: 'none',
        color: 'var(--accent-indigo-light)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        padding: 0,
        textDecoration: 'underline',
    },
}
