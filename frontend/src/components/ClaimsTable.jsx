import React, { useState, useRef, useEffect } from 'react'
import PriorityBadge from './PriorityBadge.jsx'

/* ─── Confirmation Modal ────────────────────────────────────────── */
function ConfirmRemoveModal({ claimId, onConfirm, onCancel }) {
    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.box} className="glass-card">
                <div style={modalStyles.iconWrap}>🗑️</div>
                <h3 style={modalStyles.title}>Remove Claim</h3>
                <p style={modalStyles.msg}>
                    Are you sure you want to remove <strong>{claimId}</strong>?<br />
                    This action cannot be undone.
                </p>
                <div style={modalStyles.actions}>
                    <button
                        id="confirm-remove-cancel"
                        className="btn btn-secondary"
                        style={modalStyles.cancelBtn}
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        id="confirm-remove-confirm"
                        style={modalStyles.removeBtn}
                        onClick={onConfirm}
                    >
                        Remove Claim
                    </button>
                </div>
            </div>
        </div>
    )
}

const modalStyles = {
    overlay: {
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    box: {
        maxWidth: 380, width: '90%', padding: '2rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
        animation: 'fadeInUp 0.25s ease both',
    },
    iconWrap: { fontSize: '2rem', lineHeight: 1 },
    title: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 },
    msg: {
        textAlign: 'center', fontSize: '0.87rem',
        color: 'var(--text-muted)', lineHeight: 1.6, margin: 0,
    },
    actions: { display: 'flex', gap: '0.75rem', marginTop: '0.5rem', width: '100%' },
    cancelBtn: { flex: 1, padding: '0.65rem' },
    removeBtn: {
        flex: 1, padding: '0.65rem',
        background: 'rgba(239,68,68,0.15)',
        border: '1px solid rgba(239,68,68,0.4)',
        borderRadius: 'var(--radius-sm)',
        color: '#f87171',
        fontFamily: 'inherit', fontWeight: 700,
        fontSize: '0.875rem', cursor: 'pointer',
        transition: 'all 0.2s',
    },
}

/* ─── Three-dot Overflow Menu ───────────────────────────────────── */
function OverflowMenu({ claimId, onView, onRemove }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    // Close when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div ref={ref} style={{ position: 'relative', display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
            {/* View button */}
            <button
                className="btn btn-secondary"
                style={styles.viewBtn}
                onClick={() => onView(claimId)}
                id={`view-claim-${claimId}`}
            >
                View →
            </button>

            {/* Three-dot trigger */}
            <button
                style={styles.dotsTrigger}
                onClick={() => setOpen(o => !o)}
                id={`overflow-menu-${claimId}`}
                title="More options"
                aria-label="More options"
            >
                ⋯
            </button>

            {/* Dropdown */}
            {open && (
                <div style={styles.dropdown} className="glass-card">
                    <button
                        style={styles.dropdownItem}
                        onClick={() => { setOpen(false); onView(claimId) }}
                    >
                        🔍 View Claim
                    </button>
                    <div style={styles.dropdownDivider} />
                    <button
                        style={{ ...styles.dropdownItem, ...styles.dropdownItemDanger }}
                        onClick={() => { setOpen(false); onRemove(claimId) }}
                        id={`remove-claim-${claimId}`}
                    >
                        🗑️ Remove Claim
                    </button>
                </div>
            )}
        </div>
    )
}

/* ─── Main Table ────────────────────────────────────────────────── */
const STATUS_COLORS = {
    'Submitted': { bg: 'rgba(99,102,241,0.12)', color: 'var(--accent-indigo-light)' },
    'Under Review': { bg: 'rgba(245,158,11,0.12)', color: 'var(--priority-medium)' },
    'Denied': { bg: 'rgba(239,68,68,0.12)', color: 'var(--priority-high)' },
    'Pending Documents': { bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
    'Paid': { bg: 'rgba(34,197,94,0.12)', color: 'var(--success)' },
}

export default function ClaimsTable({ claims, onViewClaim, onRemoveClaim, highlightId }) {
    const [pendingRemoveId, setPendingRemoveId] = useState(null)
    const rowRefs = useRef({})

    useEffect(() => {
        if (!highlightId) return
        const el = rowRefs.current[highlightId]
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, [highlightId, claims])

    const handleConfirmRemove = () => {
        onRemoveClaim(pendingRemoveId)
        setPendingRemoveId(null)
    }

    return (
        <>
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
                                    <th style={styles.th}>Email Status</th>
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
                                                ₹{claim.claimAmount.toLocaleString()}
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
                                                    <span style={styles.notSentBadge}>Not Sent</span>
                                                )}
                                            </td>
                                            {onViewClaim && (
                                                <td style={styles.td}>
                                                    <OverflowMenu
                                                        claimId={claim.id}
                                                        onView={onViewClaim}
                                                        onRemove={setPendingRemoveId}
                                                    />
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

            {/* Confirmation Modal — rendered outside the table card */}
            {pendingRemoveId && (
                <ConfirmRemoveModal
                    claimId={pendingRemoveId}
                    onConfirm={handleConfirmRemove}
                    onCancel={() => setPendingRemoveId(null)}
                />
            )}
        </>
    )
}

const highlightPinStyle = { marginLeft: '0.4rem', fontSize: '0.75rem' }

const styles = {
    wrapper: { padding: '2rem', animation: 'fadeInUp 0.6s ease both', animationDelay: '0.1s' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    icon: {
        width: 40, height: 40, borderRadius: 'var(--radius-sm)',
        background: 'linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem', boxShadow: '0 2px 12px rgba(34,211,238,0.3)',
    },
    title: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' },
    subtitle: { fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' },
    count: {
        fontSize: '0.82rem', color: 'var(--text-muted)',
        background: 'rgba(255,255,255,0.05)', padding: '4px 12px',
        borderRadius: 'var(--radius-full)', border: '1px solid var(--border-glass)',
    },
    tableContainer: { overflowX: 'auto', borderRadius: 'var(--radius-md)' },
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.875rem' },
    th: {
        padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem',
        fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
        color: 'var(--text-muted)', borderBottom: '1px solid var(--border-glass)',
        background: 'rgba(255,255,255,0.02)', whiteSpace: 'nowrap',
    },
    td: { padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)', whiteSpace: 'nowrap' },
    row: { transition: 'background var(--transition-fast)', cursor: 'default' },
    claimId: { fontFamily: "'Inter', monospace", fontWeight: 600, color: 'var(--accent-indigo-light)', fontSize: '0.85rem' },
    amount: { fontWeight: 600, color: 'var(--text-primary)' },
    sentBadge: {
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '4px 12px', borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem', fontWeight: 600,
        color: 'var(--success)', background: 'var(--success-bg)',
    },
    notSentBadge: {
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '4px 12px', borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem', fontWeight: 600,
        color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
    },
    statusBadge: {
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 10px', borderRadius: 'var(--radius-full)',
        fontSize: '0.72rem', fontWeight: 600,
    },
    empty: { textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' },
    emptyIcon: { fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.5 },
    /* Overflow menu */
    viewBtn: { padding: '0.35rem 0.75rem', fontSize: '0.78rem' },
    dotsTrigger: {
        background: 'none', border: '1px solid transparent',
        borderRadius: '6px', cursor: 'pointer',
        color: 'var(--text-muted)', fontSize: '1.1rem',
        padding: '0.2rem 0.4rem', lineHeight: 1,
        transition: 'all 0.15s',
        fontFamily: 'inherit',
    },
    dropdown: {
        position: 'absolute', top: '110%', right: 0, zIndex: 100,
        minWidth: 160, padding: '0.4rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        animation: 'fadeInUp 0.15s ease both',
    },
    dropdownItem: {
        display: 'block', width: '100%', textAlign: 'left',
        padding: '0.5rem 0.75rem', borderRadius: '6px',
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'inherit', fontSize: '0.84rem',
        color: 'var(--text-primary)', transition: 'background 0.15s',
    },
    dropdownItemDanger: { color: '#f87171' },
    dropdownDivider: { height: 1, background: 'var(--border-glass)', margin: '0.3rem 0' },
}
