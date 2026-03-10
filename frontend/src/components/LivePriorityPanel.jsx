import React, { useEffect, useState } from 'react'

/* ─── Priority logic — exactly mirrors api.js predictPriority ─────── */
function computeScore(amount, days) {
    return (amount / 1000) * 0.4 + days * 0.6
}

function computePriority(amount, days) {
    const score = computeScore(amount, days)
    if (score > 30) return 'High'
    if (score > 12) return 'Medium'
    return 'Low'
}

/** Maps raw score to a confidence % (50–99 range) */
function computeConfidence(score) {
    return Math.min(99, Math.round(50 + (score / 60) * 49))
}

const PRIORITY_CONFIG = {
    High: {
        color: 'var(--priority-high)',
        bg: 'var(--priority-high-bg)',
        border: 'rgba(239,68,68,0.3)',
        glow: 'rgba(239,68,68,0.15)',
        icon: '🔴',
        badge: '#ef4444',
        recommendation: 'This claim requires immediate follow-up. Escalate to senior billing staff.',
    },
    Medium: {
        color: 'var(--priority-medium)',
        bg: 'var(--priority-medium-bg)',
        border: 'rgba(245,158,11,0.3)',
        glow: 'rgba(245,158,11,0.12)',
        icon: '🟠',
        badge: '#f59e0b',
        recommendation: 'This claim should be reviewed within the next 2–3 business days.',
    },
    Low: {
        color: 'var(--priority-low)',
        bg: 'var(--priority-low-bg)',
        border: 'rgba(34,197,94,0.3)',
        glow: 'rgba(34,197,94,0.12)',
        icon: '🟢',
        badge: '#22c55e',
        recommendation: 'This claim can be processed under normal workflow.',
    },
}

/* ─── Animated number display ──────────────────────────────────────── */
function PriorityBadgeLarge({ priority, config }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: config.bg,
            border: `1px solid ${config.border}`,
            boxShadow: `0 0 24px ${config.glow}`,
            animation: 'fadeInUp 0.3s ease both',
        }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: config.color, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.8 }}>
                Priority Level
            </div>
            <div style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: config.color,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                lineHeight: 1,
            }}>
                {priority}
            </div>
            <div style={{
                width: 8, height: 8,
                borderRadius: '50%',
                background: config.color,
                boxShadow: `0 0 8px ${config.color}`,
                animation: 'pulse-dot 1.5s ease-in-out infinite',
            }} />
        </div>
    )
}

/* ─── Main component ───────────────────────────────────────────────── */
export default function LivePriorityPanel({ claimAmount, daysSinceClaim }) {
    const hasInputs = claimAmount !== '' && claimAmount !== null &&
        daysSinceClaim !== '' && daysSinceClaim !== null &&
        !isNaN(Number(claimAmount)) && !isNaN(Number(daysSinceClaim)) &&
        Number(claimAmount) > 0

    const [displayPriority, setDisplayPriority] = useState(null)
    const [confidence, setConfidence] = useState(null)
    const [animKey, setAnimKey] = useState(0)

    useEffect(() => {
        if (!hasInputs) { setDisplayPriority(null); setConfidence(null); return }
        const score = computeScore(Number(claimAmount), Number(daysSinceClaim))
        const p = computePriority(Number(claimAmount), Number(daysSinceClaim))
        setDisplayPriority(p)
        setConfidence(computeConfidence(score))
        setAnimKey(k => k + 1)
    }, [claimAmount, daysSinceClaim, hasInputs])

    const cfg = displayPriority ? PRIORITY_CONFIG[displayPriority] : null

    return (
        <>
            <style>{`
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.75); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes scan-line {
                    0%   { transform: translateY(0%); opacity: 0.6; }
                    100% { transform: translateY(100%); opacity: 0; }
                }
            `}</style>

            <div className="glass-card" style={s.panel}>
                {/* Panel header */}
                <div style={s.header}>
                    <div style={s.headerIcon}>⚡</div>
                    <div>
                        <div style={s.title}>Live Priority Prediction</div>
                        <div style={s.subtitle}>Updates as you type</div>
                    </div>
                    {/* Live indicator dot */}
                    <div style={s.liveDot} title="Live">
                        <div style={s.livePulse} />
                        <span style={s.liveLabel}>LIVE</span>
                    </div>
                </div>

                <div style={s.divider} />

                {/* ── Waiting state ── */}
                {!hasInputs && (
                    <div style={s.waiting}>
                        <div style={s.waitingIcon}>📊</div>
                        <div style={s.waitingTitle}>Waiting for Required Inputs</div>
                        <p style={s.waitingText}>Please enter the following fields to generate a prediction:</p>
                        <div style={s.waitingList}>
                            <div style={{ ...s.waitingItem, color: claimAmount ? 'var(--priority-low)' : 'var(--text-muted)' }}>
                                {claimAmount ? '✅' : '○'} Claim Amount
                            </div>
                            <div style={{ ...s.waitingItem, color: daysSinceClaim !== '' && daysSinceClaim !== null ? 'var(--priority-low)' : 'var(--text-muted)' }}>
                                {(daysSinceClaim !== '' && daysSinceClaim !== null) ? '✅' : '○'} Days Since Claim
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Prediction result ── */}
                {hasInputs && cfg && (
                    <div key={animKey} style={s.result}>
                        {/* Priority badge */}
                        <PriorityBadgeLarge priority={displayPriority} config={cfg} />

                        {/* Factors */}
                        <div style={s.section}>
                            <div style={s.sectionLabel}>Prediction Based On</div>
                            <div style={s.factorRow}>
                                <span style={s.factorKey}>Claim Amount</span>
                                <span style={s.factorVal}>
                                    ₹{Number(claimAmount).toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div style={s.factorRow}>
                                <span style={s.factorKey}>Days Since Claim</span>
                                <span style={s.factorVal}>{Number(daysSinceClaim)} days</span>
                            </div>
                        </div>

                        {/* Confidence Score */}
                        {confidence !== null && (
                            <div style={s.section}>
                                <div style={s.sectionLabel}>Model Confidence</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--border-glass)', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${confidence}%`,
                                            background: cfg.color,
                                            borderRadius: 99,
                                            transition: 'width 0.4s ease',
                                            boxShadow: `0 0 8px ${cfg.glow}`,
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: cfg.color, minWidth: '3ch' }}>
                                        {confidence}%
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Recommendation */}
                        <div style={{ ...s.recommendation, background: cfg.bg, borderLeft: `3px solid ${cfg.color}` }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.color, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Recommendation
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                {cfg.recommendation}
                            </div>
                        </div>
                    </div>
                )}

                {/* Priority legend (always visible) */}
                <div style={s.divider} />
                <div style={s.legend}>
                    {['High', 'Medium', 'Low'].map(p => {
                        const c = PRIORITY_CONFIG[p]
                        const isActive = displayPriority === p
                        return (
                            <div key={p} style={{
                                ...s.legendItem,
                                background: c.bg,
                                border: `1px solid ${isActive ? c.border : 'transparent'}`,
                                color: c.color,
                                fontWeight: isActive ? 800 : 600,
                                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                                boxShadow: isActive ? `0 0 10px ${c.glow}` : 'none',
                                transition: 'all 0.2s ease',
                            }}>
                                {c.icon} {p}
                            </div>
                        )
                    })}
                </div>
            </div>
        </>
    )
}

const s = {
    panel: {
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        animation: 'fadeInUp 0.4s ease both',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 'var(--radius-sm)',
        background: 'var(--accent-gradient)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1rem',
        boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
        flexShrink: 0,
    },
    title: { fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' },
    subtitle: { fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 },
    liveDot: {
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '0.3rem',
    },
    livePulse: {
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: '#22c55e',
        boxShadow: '0 0 6px #22c55e',
        animation: 'pulse-dot 1.5s ease-in-out infinite',
    },
    liveLabel: { fontSize: '0.65rem', fontWeight: 700, color: '#22c55e', letterSpacing: '0.1em' },
    divider: { height: 1, background: 'var(--border-glass)' },
    // Waiting state
    waiting: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '0.6rem',
        padding: '0.75rem 0',
    },
    waitingIcon: { fontSize: '2rem', opacity: 0.5 },
    waitingTitle: { fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' },
    waitingText: { fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 },
    waitingList: { display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '100%', paddingLeft: '0.5rem', textAlign: 'left' },
    waitingItem: { fontSize: '0.8rem', fontWeight: 500, transition: 'color 0.2s ease' },
    // Result
    result: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
    },
    sectionLabel: {
        fontSize: '0.7rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '0.1rem',
    },
    factorRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.35rem 0',
        borderBottom: '1px solid var(--border-glass)',
    },
    factorKey: { fontSize: '0.78rem', color: 'var(--text-muted)' },
    factorVal: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' },
    recommendation: {
        padding: '0.75rem 0.9rem',
        borderRadius: 'var(--radius-sm)',
    },
    // Legend
    legend: {
        display: 'flex',
        gap: '0.4rem',
        justifyContent: 'center',
    },
    legendItem: {
        padding: '0.3rem 0.75rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        cursor: 'default',
        userSelect: 'none',
    },
}
