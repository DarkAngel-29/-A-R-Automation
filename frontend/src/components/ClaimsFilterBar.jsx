import React from 'react'

const PRIORITIES = ['All', 'High', 'Medium', 'Low']
const STATUSES = ['All', 'Submitted', 'Under Review', 'Denied', 'Pending Documents', 'Paid']
const FOLLOWUP_OPTIONS = ['All', 'Required', 'None']

const priorityColors = {
    All: { bg: 'rgba(99,102,241,0.1)', color: 'var(--accent-indigo-light)', border: 'rgba(99,102,241,0.2)' },
    High: { bg: 'var(--priority-high-bg)', color: 'var(--priority-high)', border: 'rgba(239,68,68,0.3)' },
    Medium: { bg: 'var(--priority-medium-bg)', color: 'var(--priority-medium)', border: 'rgba(245,158,11,0.3)' },
    Low: { bg: 'var(--priority-low-bg)', color: 'var(--priority-low)', border: 'rgba(34,197,94,0.3)' },
}
const followupColors = {
    All: { bg: 'rgba(99,102,241,0.1)', color: 'var(--accent-indigo-light)', border: 'rgba(99,102,241,0.2)' },
    Required: { bg: 'var(--priority-medium-bg)', color: 'var(--priority-medium)', border: 'rgba(245,158,11,0.3)' },
    None: { bg: 'var(--success-bg)', color: 'var(--success)', border: 'rgba(34,197,94,0.3)' },
}

/**
 * ClaimsFilterBar — full filter bar with priority pills, status dropdown,
 * follow-up pills, and a search input.
 */
export default function ClaimsFilterBar({ filters, onChange, claimCounts }) {
    const set = (key, val) => onChange({ ...filters, [key]: val })

    return (
        <div style={s.wrap} className="glass-card" id="claims-filter-bar">
            {/* Row 1: Search + Status */}
            <div style={s.row}>
                {/* Search */}
                <div style={s.searchWrap}>
                    <span style={s.searchIcon}>🔍</span>
                    <input
                        id="filter-search"
                        type="text"
                        placeholder="Search by Claim ID, Patient, Insurance…"
                        value={filters.search}
                        onChange={e => set('search', e.target.value)}
                        style={s.searchInput}
                    />
                    {filters.search && (
                        <button
                            style={s.clearBtn}
                            onClick={() => set('search', '')}
                            title="Clear search"
                        >×</button>
                    )}
                </div>

                {/* Status dropdown */}
                <div style={s.selectWrap}>
                    <label style={s.selectLabel}>Status</label>
                    <select
                        id="filter-status"
                        value={filters.status}
                        onChange={e => set('status', e.target.value)}
                        style={s.select}
                    >
                        {STATUSES.map(st => (
                            <option key={st} value={st}>{st}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Row 2: Priority pills + Follow-up pills */}
            <div style={s.pillsRow}>
                {/* Priority */}
                <div style={s.pillGroup}>
                    <span style={s.pillGroupLabel}>Priority</span>
                    {PRIORITIES.map(p => {
                        const isActive = filters.priority === p
                        const c = priorityColors[p]
                        return (
                            <button
                                key={p}
                                id={`filter-priority-${p.toLowerCase()}`}
                                onClick={() => set('priority', p)}
                                style={{
                                    ...s.pill,
                                    background: isActive ? c.bg : 'transparent',
                                    color: isActive ? c.color : 'var(--text-muted)',
                                    border: `1px solid ${isActive ? c.border : 'var(--border-glass)'}`,
                                }}
                            >
                                {p}
                                {p !== 'All' && claimCounts && (
                                    <span style={s.pillCount}>{claimCounts[p] ?? 0}</span>
                                )}
                            </button>
                        )
                    })}
                </div>

                <div style={s.divider} />

                {/* Follow-up */}
                <div style={s.pillGroup}>
                    <span style={s.pillGroupLabel}>Follow-up</span>
                    {FOLLOWUP_OPTIONS.map(f => {
                        const isActive = filters.followup === f
                        const c = followupColors[f]
                        return (
                            <button
                                key={f}
                                id={`filter-followup-${f.toLowerCase()}`}
                                onClick={() => set('followup', f)}
                                style={{
                                    ...s.pill,
                                    background: isActive ? c.bg : 'transparent',
                                    color: isActive ? c.color : 'var(--text-muted)',
                                    border: `1px solid ${isActive ? c.border : 'var(--border-glass)'}`,
                                }}
                            >
                                {f === 'Required' ? '⏳ Required' : f === 'None' ? '✅ None' : f}
                            </button>
                        )
                    })}
                </div>

                {/* Active filter count + reset */}
                {isFiltered(filters) && (
                    <button
                        id="filter-reset"
                        style={s.resetBtn}
                        onClick={() => onChange(defaultFilters())}
                    >
                        ✕ Reset Filters
                    </button>
                )}
            </div>
        </div>
    )
}

export function defaultFilters() {
    return { priority: 'All', status: 'All', followup: 'All', search: '' }
}

export function isFiltered(filters) {
    return filters.priority !== 'All' || filters.status !== 'All' ||
        filters.followup !== 'All' || filters.search.trim() !== ''
}

export function applyFilters(claims, filters) {
    return claims.filter(claim => {
        // Priority
        if (filters.priority !== 'All' && claim.priority !== filters.priority) return false

        // Status (default 'Submitted' for older claims without status)
        if (filters.status !== 'All') {
            const claimStatus = claim.status || 'Submitted'
            if (claimStatus !== filters.status) return false
        }

        // Follow-up
        if (filters.followup === 'Required' && claim.emailSent) return false
        if (filters.followup === 'None' && !claim.emailSent) return false

        // Search: Claim ID, Patient ID, Insurance Company
        if (filters.search.trim()) {
            const q = filters.search.trim().toLowerCase()
            const haystack = [
                claim.id,
                claim.patientId,
                claim.insuranceCompany,
            ].join(' ').toLowerCase()
            if (!haystack.includes(q)) return false
        }

        return true
    })
}

const s = {
    wrap: {
        padding: '1rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        animation: 'fadeInUp 0.4s ease both',
        animationDelay: '0.05s',
    },
    row: { display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' },
    searchWrap: {
        flex: 1,
        minWidth: 200,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    searchIcon: {
        position: 'absolute',
        left: '0.75rem',
        fontSize: '0.9rem',
        pointerEvents: 'none',
        zIndex: 1,
    },
    searchInput: {
        width: '100%',
        paddingLeft: '2.25rem',
        paddingRight: '2rem',
        height: 38,
        fontSize: '0.85rem',
    },
    clearBtn: {
        position: 'absolute',
        right: '0.6rem',
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: '1.1rem',
        lineHeight: 1,
        padding: '0 0.2rem',
        fontFamily: 'inherit',
    },
    selectWrap: { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
    selectLabel: {
        fontSize: '0.65rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        margin: 0,
    },
    select: {
        height: 38,
        fontSize: '0.82rem',
        padding: '0 0.75rem',
        minWidth: 160,
        cursor: 'pointer',
    },
    pillsRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
    pillGroup: { display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' },
    pillGroupLabel: {
        fontSize: '0.68rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginRight: '0.1rem',
    },
    pill: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.3rem 0.8rem',
        fontSize: '0.78rem',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all var(--transition-fast)',
    },
    pillCount: {
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 'var(--radius-full)',
        padding: '0.05rem 0.35rem',
        fontSize: '0.68rem',
    },
    divider: {
        width: 1,
        height: 24,
        background: 'var(--border-glass)',
        margin: '0 0.25rem',
    },
    resetBtn: {
        marginLeft: 'auto',
        padding: '0.3rem 0.8rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'var(--priority-high)',
        background: 'var(--priority-high-bg)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 'var(--radius-full)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all var(--transition-fast)',
    },
}
