import React, { useMemo } from 'react'

/**
 * AIInsightsCard — dynamically generated insights from claims data.
 */
export default function AIInsightsCard({ claims }) {
    const insights = useMemo(() => {
        const list = []

        // 1. Count approaching 60-day limit
        const approaching60 = claims.filter(c => {
            const d = c.daysSinceClaim ?? c.daysPending ?? 0
            return d >= 55 && d <= 65 && !c.emailSent
        })
        if (approaching60.length > 0) {
            list.push({
                icon: '⚠️',
                color: 'var(--priority-medium)',
                bg: 'var(--priority-medium-bg)',
                text: `${approaching60.length} claim${approaching60.length > 1 ? 's' : ''} approaching the 60-day aging limit`,
            })
        }

        // 2. High priority with no follow-up
        const highNoFollowUp = claims.filter(c => c.priority === 'High' && (c.followUps || 0) === 0)
        if (highNoFollowUp.length > 0) {
            list.push({
                icon: '🚨',
                color: 'var(--priority-high)',
                bg: 'var(--priority-high-bg)',
                text: `${highNoFollowUp.length} high-priority claim${highNoFollowUp.length > 1 ? 's' : ''} require${highNoFollowUp.length === 1 ? 's' : ''} immediate follow-up`,
            })
        }

        // 3. Insurance company with most outstanding claims
        const insuranceCounts = {}
        claims.filter(c => !c.emailSent).forEach(c => {
            insuranceCounts[c.insuranceCompany] = (insuranceCounts[c.insuranceCompany] || 0) + 1
        })
        const topInsurer = Object.entries(insuranceCounts).sort((a, b) => b[1] - a[1])[0]
        if (topInsurer && topInsurer[1] >= 2) {
            list.push({
                icon: '🏥',
                color: 'var(--accent-indigo-light)',
                bg: 'rgba(99,102,241,0.1)',
                text: `${topInsurer[0]} has the most outstanding claims (${topInsurer[1]}) pending response`,
            })
        }

        // 4. 90+ day overdue claims
        const overdue90 = claims.filter(c => (c.daysSinceClaim ?? c.daysPending ?? 0) > 90)
        if (overdue90.length > 0) {
            list.push({
                icon: '🔴',
                color: 'var(--priority-high)',
                bg: 'var(--priority-high-bg)',
                text: `${overdue90.length} claim${overdue90.length > 1 ? 's are' : ' is'} over 90 days old — escalation recommended`,
            })
        }

        // 5. Emails not yet sent on high priority
        const highNotEmailed = claims.filter(c => c.priority === 'High' && !c.emailSent)
        if (highNotEmailed.length > 0 && !list.find(i => i.icon === '🚨')) {
            list.push({
                icon: '📧',
                color: 'var(--priority-medium)',
                bg: 'var(--priority-medium-bg)',
                text: `${highNotEmailed.length} high-priority claim${highNotEmailed.length > 1 ? 's' : ''} still missing insurer notification`,
            })
        }

        // Fallback
        if (list.length === 0 && claims.length === 0) {
            list.push({
                icon: '✅',
                color: 'var(--success)',
                bg: 'var(--success-bg)',
                text: 'No claims yet. Generate your first claim to see AI insights.',
            })
        } else if (list.length === 0) {
            list.push({
                icon: '✅',
                color: 'var(--success)',
                bg: 'var(--success-bg)',
                text: 'All claims are within acceptable thresholds. No action required.',
            })
        }

        return list.slice(0, 4)
    }, [claims])

    return (
        <div style={s.card} className="glass-card" id="widget-ai-insights">
            <div style={s.header}>
                <div style={s.titleRow}>
                    <span style={s.widgetIcon}></span>
                    <div>
                        <div style={s.titleFlex}>
                            <span style={s.title}>AI Insights</span>
                            <span style={s.aiBadge}>AI-Powered</span>
                        </div>
                        <div style={s.subtitle}>Automated insights from the prioritization engine</div>
                    </div>
                </div>
            </div>

            <div style={s.list}>
                {insights.map((insight, i) => (
                    <div
                        key={i}
                        style={{ ...s.item, animationDelay: `${i * 0.1}s` }}
                    >
                        <div style={{ ...s.insightIcon, background: insight.bg }}>
                            {insight.icon}
                        </div>
                        <p style={{ ...s.insightText, borderLeft: `2px solid ${insight.color}44` }}>
                            {insight.text}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}

const s = {
    card: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' },
    header: {},
    titleRow: { display: 'flex', alignItems: 'flex-start', gap: '0.6rem' },
    widgetIcon: { fontSize: '1.3rem', flexShrink: 0, marginTop: '0.1rem' },
    titleFlex: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    title: { fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' },
    aiBadge: {
        fontSize: '0.62rem',
        fontWeight: 700,
        padding: '0.15rem 0.5rem',
        borderRadius: 'var(--radius-full)',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(34,211,238,0.2))',
        border: '1px solid rgba(99,102,241,0.25)',
        color: 'var(--accent-indigo-light)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
    },
    subtitle: { fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' },
    list: { display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 },
    item: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.65rem',
        animation: 'fadeInUp 0.4s ease both',
    },
    insightIcon: {
        width: 34,
        height: 34,
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.9rem',
        flexShrink: 0,
    },
    insightText: {
        fontSize: '0.82rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
        margin: 0,
        paddingLeft: '0.65rem',
    },
}
