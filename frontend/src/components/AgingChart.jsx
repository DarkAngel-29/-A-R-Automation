import React from 'react'

/**
 * AgingChart — pure CSS bar chart for AR aging buckets.
 * Buckets: 0-30, 31-60, 61-90, 90+ days based on claim.daysSinceClaim
 */
export default function AgingChart({ claims }) {
    const buckets = [
        { label: '0–30 days', range: [0, 30], color: 'var(--priority-low)', colorBg: 'var(--priority-low-bg)' },
        { label: '31–60 days', range: [31, 60], color: 'var(--priority-medium)', colorBg: 'var(--priority-medium-bg)' },
        { label: '61–90 days', range: [61, 90], color: '#f97316', colorBg: 'rgba(249,115,22,0.12)' },
        { label: '90+ days', range: [91, Infinity], color: 'var(--priority-high)', colorBg: 'var(--priority-high-bg)' },
    ]

    const counts = buckets.map(b => ({
        ...b,
        count: claims.filter(c => {
            const d = c.daysSinceClaim ?? c.daysPending ?? 0
            return d >= b.range[0] && d <= b.range[1]
        }).length,
    }))

    const max = Math.max(...counts.map(b => b.count), 1)

    return (
        <div style={s.card} className="glass-card" id="widget-aging-chart">
            <div style={s.header}>
                <div style={s.titleRow}>
                    <span style={s.widgetIcon}>📊</span>
                    <div>
                        <div style={s.title}>AR Aging Overview</div>
                        <div style={s.subtitle}>Distribution by payment delay duration</div>
                    </div>
                </div>
            </div>

            <div style={s.chartArea}>
                {counts.map((b, i) => {
                    const pct = (b.count / max) * 100
                    return (
                        <div key={i} style={s.barRow}>
                            <div style={s.barLabel}>{b.label}</div>
                            <div style={s.barTrack}>
                                <div
                                    style={{
                                        ...s.barFill,
                                        width: `${pct}%`,
                                        background: b.color,
                                        boxShadow: `0 0 12px ${b.color}44`,
                                    }}
                                />
                            </div>
                            <div style={{ ...s.barCount, color: b.color, background: b.colorBg }}>
                                {b.count}
                            </div>
                        </div>
                    )
                })}
            </div>

            {claims.length === 0 && (
                <div style={s.empty}>No claims data yet</div>
            )}
        </div>
    )
}

const s = {
    card: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' },
    header: {},
    titleRow: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
    widgetIcon: { fontSize: '1.3rem', flexShrink: 0 },
    title: { fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' },
    subtitle: { fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' },
    chartArea: { display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 },
    barRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    barLabel: { fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, minWidth: 72, flexShrink: 0 },
    barTrack: {
        flex: 1,
        height: 10,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 'var(--radius-full)',
        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        minWidth: 4,
    },
    barCount: {
        fontSize: '0.72rem',
        fontWeight: 700,
        minWidth: 28,
        textAlign: 'center',
        borderRadius: 'var(--radius-full)',
        padding: '0.15rem 0.5rem',
        flexShrink: 0,
    },
    empty: { textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', padding: '1rem 0' },
}
