import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import ClaimsTable from '../components/ClaimsTable.jsx'
import ClaimsFilterBar, { defaultFilters, applyFilters } from '../components/ClaimsFilterBar.jsx'
import { getClaims, sendEmail } from '../services/api.js'

export default function ClaimsListPage({ onLogout }) {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [claims, setClaims] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [filters, setFilters] = useState(() => {
        // Bootstrap filters from URL query params
        const f = defaultFilters()
        const p = searchParams.get('priority')
        const fu = searchParams.get('followup')
        if (p) f.priority = p
        if (fu === 'true' || fu === 'Required') f.followup = 'Required'
        return f
    })
    const highlightId = searchParams.get('highlight')
    const highlightShownRef = useRef(false)

    useEffect(() => {
        getClaims()
            .then(data => setClaims(data))
            .catch(() => toast.error('Failed to load claims'))
            .finally(() => setIsLoading(false))
    }, [])

    // Show highlight toast once, after data loads
    useEffect(() => {
        if (!isLoading && highlightId && !highlightShownRef.current) {
            highlightShownRef.current = true
            toast(`📌 Viewing ${highlightId} from Follow-Up Reminder`, {
                duration: 4000,
                style: {
                    background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    color: 'var(--text-primary)',
                },
            })
        }
    }, [isLoading, highlightId])

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

    const filtered = applyFilters(claims, filters)

    const claimCounts = {
        High: claims.filter(c => c.priority === 'High').length,
        Medium: claims.filter(c => c.priority === 'Medium').length,
        Low: claims.filter(c => c.priority === 'Low').length,
    }

    const activeFilterDescription = () => {
        const parts = []
        if (filters.priority !== 'All') parts.push(filters.priority + ' priority')
        if (filters.status !== 'All') parts.push(filters.status)
        if (filters.followup !== 'All') parts.push(filters.followup === 'Required' ? 'follow-up required' : 'no follow-up')
        if (filters.search.trim()) parts.push(`"${filters.search.trim()}"`)
        return parts.length ? parts.join(' · ') : 'all'
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
                            {isLoading ? '…' : `${filtered.length} ${activeFilterDescription()} claim${filtered.length !== 1 ? 's' : ''}`}
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

                {/* Filter Bar */}
                <ClaimsFilterBar
                    filters={filters}
                    onChange={setFilters}
                    claimCounts={claimCounts}
                />

                {/* Table */}
                {isLoading ? (
                    <div style={styles.loading}>Loading claims…</div>
                ) : filtered.length === 0 ? (
                    <div className="glass-card" style={styles.empty}>
                        <div style={styles.emptyIcon}>📭</div>
                        <div style={styles.emptyTitle}>No matching claims</div>
                        <div style={styles.emptyDesc}>
                            Try adjusting your filters, or{' '}
                            <button style={styles.emptyLink} onClick={() => navigate('/generate')}>
                                generate a new claim →
                            </button>
                        </div>
                    </div>
                ) : (
                    <ClaimsTable
                        claims={filtered}
                        onSendEmail={handleSendEmail}
                        onViewClaim={handleViewClaim}
                        highlightId={highlightId}
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
