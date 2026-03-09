import React from 'react'

const priorityConfig = {
    High: { color: 'var(--priority-high)', bg: 'var(--priority-high-bg)' },
    Medium: { color: 'var(--priority-medium)', bg: 'var(--priority-medium-bg)' },
    Low: { color: 'var(--priority-low)', bg: 'var(--priority-low-bg)' },
}

export default function PriorityBadge({ priority }) {
    const config = priorityConfig[priority] || priorityConfig.Low

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
                color: config.color,
                background: config.bg,
                border: `1px solid ${config.color}22`,
                textTransform: 'uppercase',
            }}
        >
            <span
                style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: config.color,
                    boxShadow: `0 0 6px ${config.color}`,
                }}
            />
            {priority}
        </span>
    )
}
