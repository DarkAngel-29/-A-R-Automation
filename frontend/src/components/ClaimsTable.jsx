import React, { useState, useRef, useEffect } from 'react'
import PriorityBadge from './PriorityBadge.jsx'

const styles = {
    wrapper: {
        padding: '2rem',
        animation: 'fadeInUp 0.6s ease both',
        animationDelay: '0.1s',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-sm)',
        background: 'linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        boxShadow: '0 2px 12px rgba(34, 211, 238, 0.3)',
    },
    title: {
        fontSize: '1.1rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
    },
    subtitle: {
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        marginTop: '2px',
    },
    count: {
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        background: 'rgba(255,255,255,0.05)',
        padding: '4px 12px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-glass)',
    },
    tableContainer: {
        overflowX: 'auto',
        borderRadius: 'var(--radius-md)',
    },
    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
        fontSize: '0.875rem',
    },
    th: {
        padding: '0.75rem 1rem',
        textAlign: 'left',
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        borderBottom: '1px solid var(--border-glass)',
        background: 'rgba(255,255,255,0.02)',
        whiteSpace: 'nowrap',
    },
    td: {
        padding: '0.8rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        whiteSpace: 'nowrap',
    },
    row: {
        transition: 'background var(--transition-fast)',
        cursor: 'default',
    },
    claimId: {
        fontFamily: "'Inter', monospace",
        fontWeight: 600,
        color: 'var(--accent-indigo-light)',
        fontSize: '0.85rem',
    },
    amount: {
        fontWeight: 600,
        color: 'var(--text-primary)',
    },
    emailBtn: {
        padding: '0.35rem 0.9rem',
        fontSize: '0.78rem',
    },
    sentBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 12px',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'var(--success)',
        background: 'var(--success-bg)',
    },
    statusBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.72rem',
        fontWeight: 600,
    },
    empty: {
        textAlign: 'center',
        padding: '3rem 1rem',
        color: 'var(--text-muted)',
    },
    emptyIcon: {
        fontSize: '2.5rem',
        marginBottom: '0.75rem',
        opacity: 0.5,
    },
}

const STATUS_COLORS = {
    'Submitted': { bg: 'rgba(99,102,241,0.12)', color: 'var(--accent-indigo-light)' },
    'Under Review': { bg: 'rgba(245,158,11,0.12)', color: 'var(--priority-medium)' },
    'Denied': { bg: 'rgba(239,68,68,0.12)', color: 'var(--priority-high)' },
    'Pending Documents': { bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
    'Paid': { bg: 'rgba(34,197,94,0.12)', color: 'var(--success)' },
}

export default function ClaimsTable({ claims, onSendEmail, onViewClaim, highlightId }) {
    const [sendingId, setSendingId] = useState(null)
    // Map claimId → ref so we can scroll to it
    const rowRefs = useRef({})

    // Scroll highlighted row into view once claims are rendered
    useEffect(() => {
        if (!highlightId) return
        const el = rowRefs.current[highlightId]
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [highlightId, claims])

    const handleSend = async (claimId) => {
        setSendingId(claimId)
        await onSendEmail(claimId)
        setSendingId(null)
    }

    return (
        <div className="glass-card" style={styles.wrapper} id="claims-table-section">
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.icon}>📊</div>
                    <div>
                        <div style={styles.title}>Claims Tracker</div>
                        <div style={styles.subtitle}>Monitor and manage all claims</div>
                    </div>
                </div>
                <span style={styles.count}>{claims.length} claim{claims.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={styles.tableContainer}>
                {claims.length === 0 ? (
                    <div style={styles.empty}>
                        <div style={styles.emptyIcon}>📭</div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>No claims yet</div>
                        <div style={{ fontSize: '0.82rem' }}>Generate your first claim using the form above</div>
                    </div>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Claim ID</th>
                                <th style={styles.th}>Patient ID</th>
                                <th style={styles.th}>Amount</th>
                                <th style={styles.th}>Days Pending</th>
                                <th style={styles.th}>Insurance</th>
                                <th style={styles.th}>Priority</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Email</th>
                                {onViewClaim && <th style={styles.th}>Details</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {claims.map((claim, index) => {
                                const isHighlighted = claim.id === highlightId
                                const status = claim.status || 'Submitted'
                                const statusColor = STATUS_COLORS[status] || STATUS_COLORS['Submitted']
                                return (
                                    <tr
                                        key={claim.id}
                                        ref={el => { rowRefs.current[claim.id] = el }}
                                        className={isHighlighted ? 'row-highlight' : ''}
                                        style={{
                                            ...styles.row,
                                            animation: `fadeInUp 0.35s ease both`,
                                            animationDelay: `${index * 0.04}s`,
                                        }}
                                        onMouseEnter={e => {
                                            if (!isHighlighted) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                                        }}
                                        onMouseLeave={e => {
                                            if (!isHighlighted) e.currentTarget.style.background = 'transparent'
                                        }}
                                    >
                                        <td
                                            style={{ ...styles.td, ...styles.claimId, cursor: onViewClaim ? 'pointer' : 'default' }}
                                            onClick={() => onViewClaim && onViewClaim(claim.id)}
                                            title={onViewClaim ? 'View details' : ''}
                                        >
                                            {claim.id}
                                            {isHighlighted && <span style={highlightPinStyle}>📌</span>}
                                        </td>
                                        <td style={styles.td}>{claim.patientId}</td>
                                        <td style={{ ...styles.td, ...styles.amount }}>
                                            ${claim.claimAmount.toLocaleString()}
                                        </td>
                                        <td style={styles.td}>{claim.daysPending}</td>
                                        <td style={styles.td}>{claim.insuranceCompany}</td>
                                        <td style={styles.td}>
                                            <PriorityBadge priority={claim.priority} />
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.statusBadge,
                                                background: statusColor.bg,
                                                color: statusColor.color,
                                            }}>
                                                {status}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            {claim.emailSent ? (
                                                <span style={styles.sentBadge}>✓ Sent</span>
                                            ) : (
                                                <button
                                                    className="btn btn-success"
                                                    style={styles.emailBtn}
                                                    onClick={() => handleSend(claim.id)}
                                                    disabled={sendingId === claim.id}
                                                    id={`send-email-${claim.id}`}
                                                >
                                                    {sendingId === claim.id ? 'Sending…' : '📧 Send Email'}
                                                </button>
                                            )}
                                        </td>
                                        {onViewClaim && (
                                            <td style={styles.td}>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={styles.emailBtn}
                                                    onClick={() => onViewClaim(claim.id)}
                                                    id={`view-claim-${claim.id}`}
                                                >
                                                    View →
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

const highlightPinStyle = {
    marginLeft: '0.4rem',
    fontSize: '0.75rem',
}
