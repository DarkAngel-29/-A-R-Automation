import React, { useEffect, useState } from 'react'

/**
 * PriorityChart — SVG donut chart for High/Medium/Low distribution.
 * Uses strokeDasharray/strokeDashoffset technique on a single <circle>.
 */
export default function PriorityChart({ claims }) {
    const [animated, setAnimated] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setAnimated(true), 100)
        return () => clearTimeout(t)
    }, [])

    const high = claims.filter(c => c.priority === 'High').length
    const medium = claims.filter(c => c.priority === 'Medium').length
    const low = claims.filter(c => c.priority === 'Low').length
    const total = claims.length || 1

    const segments = [
        { label: 'High', count: high, color: 'var(--priority-high)', hex: '#ef4444' },
        { label: 'Medium', count: medium, color: 'var(--priority-medium)', hex: '#f59e0b' },
        { label: 'Low', count: low, color: 'var(--priority-low)', hex: '#22c55e' },
    ]

    // SVG donut math
    const R = 52, CX = 70, CY = 70
    const circumference = 2 * Math.PI * R
    let offset = 0
    const arcs = segments.map(seg => {
        const pct = seg.count / total
        const dash = circumference * pct
        const arc = { ...seg, dash, offset, pct }
        offset += dash
        return arc
    })

    return (
        <div style={s.card} className="glass-card" id="widget-priority-chart">
            <div style={s.titleRow}>
                <span style={s.widgetIcon}>🎯</span>
                <div>
                    <div style={s.title}>Priority Distribution</div>
                    <div style={s.subtitle}>AI-classified urgency levels</div>
                </div>
            </div>

            <div style={s.body}>
                {/* Donut */}
                <div style={s.donutWrap}>
                    <svg width="140" height="140" viewBox="0 0 140 140">
                        {/* Background ring */}
                        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />

                        {claims.length === 0 ? (
                            <circle
                                cx={CX} cy={CY} r={R} fill="none"
                                stroke="rgba(255,255,255,0.08)" strokeWidth="18"
                            />
                        ) : (
                            arcs.map((arc, i) => (
                                <circle
                                    key={i}
                                    cx={CX} cy={CY} r={R}
                                    fill="none"
                                    stroke={arc.hex}
                                    strokeWidth="18"
                                    strokeLinecap="butt"
                                    strokeDasharray={`${animated ? arc.dash : 0} ${circumference}`}
                                    strokeDashoffset={-arc.offset}
                                    transform={`rotate(-90 ${CX} ${CY})`}
                                    style={{ transition: `stroke-dasharray 0.9s ease ${i * 0.15}s` }}
                                />
                            ))
                        )}

                        {/* Center label */}
                        <text x={CX} y={CY - 6} textAnchor="middle" fill="var(--text-primary)" fontSize="1.5rem" fontWeight="800" fontFamily="Inter,sans-serif">
                            {claims.length}
                        </text>
                        <text x={CX} y={CY + 12} textAnchor="middle" fill="var(--text-muted)" fontSize="0.55rem" fontFamily="Inter,sans-serif" letterSpacing="0.08em">
                            TOTAL
                        </text>
                    </svg>
                </div>

                {/* Legend */}
                <div style={s.legend}>
                    {segments.map(seg => (
                        <div key={seg.label} style={s.legendItem}>
                            <div style={{ ...s.dot, background: seg.color }} />
                            <div>
                                <div style={{ ...s.legendCount, color: seg.color }}>{seg.count}</div>
                                <div style={s.legendLabel}>{seg.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

const s = {
    card: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' },
    titleRow: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
    widgetIcon: { fontSize: '1.3rem', flexShrink: 0 },
    title: { fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' },
    subtitle: { fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' },
    body: { display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 },
    donutWrap: { flexShrink: 0 },
    legend: { display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 },
    legendItem: { display: 'flex', alignItems: 'center', gap: '0.55rem' },
    dot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
    legendCount: { fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.1 },
    legendLabel: { fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' },
}
