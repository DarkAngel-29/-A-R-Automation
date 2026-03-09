import React, { useMemo } from 'react'

/**
 * ActivityFeed — derives a timeline of events from real claims data.
 * Events include: claim created, email sent, follow-up logged.
 */
export default function ActivityFeed({ claims }) {
    const activities = useMemo(() => {
        const events = []

        claims.forEach(c => {
            // Claim created event
            if (c.createdAt) {
                events.push({
                    id: `${c.id}-created`,
                    icon: '📋',
                    color: 'var(--accent-indigo-light)',
                    bg: 'rgba(99,102,241,0.1)',
                    text: `Claim ${c.id} created for Patient ${c.patientId}`,
                    time: new Date(c.createdAt),
                })
            }

            // Email sent event
            if (c.emailSent && c.createdAt) {
                events.push({
                    id: `${c.id}-email`,
                    icon: '📧',
                    color: 'var(--success)',
                    bg: 'var(--success-bg)',
                    text: `Follow-up email sent for ${c.id} to ${c.insuranceCompany}`,
                    time: new Date(new Date(c.createdAt).getTime() + 300000),
                })
            }

            // Follow-up logged event
            if (c.lastFollowUp) {
                events.push({
                    id: `${c.id}-followup`,
                    icon: '📝',
                    color: 'var(--priority-medium)',
                    bg: 'var(--priority-medium-bg)',
                    text: `Follow-up #${c.followUps} logged for ${c.id}`,
                    time: new Date(c.lastFollowUp),
                })
            }

            // High priority alert
            if (c.priority === 'High' && !c.emailSent) {
                events.push({
                    id: `${c.id}-alert`,
                    icon: '🚨',
                    color: 'var(--priority-high)',
                    bg: 'var(--priority-high-bg)',
                    text: `${c.id} flagged as HIGH priority — action required`,
                    time: new Date(new Date(c.createdAt).getTime() + 1000),
                })
            }
        })

        // Sort by time descending (newest first), take top 6
        return events.sort((a, b) => b.time - a.time).slice(0, 6)
    }, [claims])

    const timeAgo = (date) => {
        const diff = Date.now() - date.getTime()
        const mins = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)
        if (mins < 1) return 'just now'
        if (mins < 60) return `${mins}m ago`
        if (hours < 24) return `${hours}h ago`
        return `${days}d ago`
    }

    return (
        <div style={s.card} className="glass-card" id="widget-activity-feed">
            <div style={s.titleRow}>
                <span style={s.widgetIcon}>⚡</span>
                <div>
                    <div style={s.title}>Recent Activity</div>
                    <div style={s.subtitle}>Latest claim and follow-up events</div>
                </div>
            </div>

            {activities.length === 0 ? (
                <div style={s.empty}>No activity yet — generate your first claim!</div>
            ) : (
                <div style={s.feed}>
                    {activities.map((act, i) => (
                        <div key={act.id} style={{ ...s.item, animationDelay: `${i * 0.07}s` }}>
                            {/* Timeline line */}
                            <div style={s.timelineCol}>
                                <div style={{ ...s.dot, background: act.bg, border: `1.5px solid ${act.color}` }}>
                                    <span style={s.dotIcon}>{act.icon}</span>
                                </div>
                                {i < activities.length - 1 && <div style={s.line} />}
                            </div>
                            <div style={s.content}>
                                <div style={s.actText}>{act.text}</div>
                                <div style={{ ...s.timestamp, color: act.color }}>{timeAgo(act.time)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const s = {
    card: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' },
    titleRow: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
    widgetIcon: { fontSize: '1.3rem', flexShrink: 0 },
    title: { fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' },
    subtitle: { fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' },
    empty: { textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', padding: '1.5rem 0' },
    feed: { display: 'flex', flexDirection: 'column', flex: 1 },
    item: {
        display: 'flex',
        gap: '0.75rem',
        animation: 'fadeInUp 0.4s ease both',
    },
    timelineCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 },
    dot: {
        width: 28,
        height: 28,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    dotIcon: { fontSize: '0.72rem' },
    line: { flex: 1, width: 1.5, background: 'var(--border-glass)', margin: '2px 0', minHeight: 10 },
    content: { paddingBottom: '0.7rem', flex: 1 },
    actText: { fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 },
    timestamp: { fontSize: '0.7rem', fontWeight: 600, marginTop: '0.15rem' },
}
