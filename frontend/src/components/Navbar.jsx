import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/generate', label: 'Generate Claim', icon: '➕' },
    { to: '/claims', label: 'Claims List', icon: '📋' },
]

export default function Navbar({ onLogout }) {
    const navigate = useNavigate()

    const handleLogout = () => {
        onLogout()
        navigate('/')
    }

    return (
        <nav style={styles.nav}>
            {/* Brand */}
            <div style={styles.brand}>
                <div style={styles.logo}>H</div>
                <div>
                    <div style={styles.title}>Health Ledger</div>
                    <div style={styles.subtitle}>Healthcare Claims Management</div>
                </div>
            </div>

            {/* Nav links */}
            <div style={styles.links}>
                {navLinks.map(({ to, label, icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                        style={({ isActive }) => ({
                            ...styles.link,
                            ...(isActive ? styles.linkActive : {}),
                        })}
                    >
                        <span style={styles.linkIcon}>{icon}</span>
                        {label}
                        {/* Active underline bar — only rendered as a sibling below the text */}
                    </NavLink>
                ))}
            </div>

            {/* Right side */}
            <div style={styles.right}>
                <div style={styles.status}>
                    <span style={styles.dot} />
                    System Active
                </div>
                <button
                    id="logout-btn"
                    style={styles.logoutBtn}
                    onClick={handleLogout}
                    onMouseEnter={e => {
                        e.currentTarget.style.color = 'var(--error)'
                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.color = 'var(--text-secondary)'
                        e.currentTarget.style.borderColor = 'var(--border-glass)'
                    }}
                >
                    ← Logout
                </button>
            </div>
        </nav>
    )
}

const styles = {
    nav: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        height: 60,
        background: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border-glass)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
    },
    brand: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        minWidth: 180,
    },
    logo: {
        width: 34,
        height: 34,
        borderRadius: 'var(--radius-sm)',
        background: 'var(--accent-gradient)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1rem',
        fontWeight: 800,
        color: '#fff',
        boxShadow: '0 2px 12px rgba(99, 102, 241, 0.35)',
        flexShrink: 0,
    },
    title: {
        fontSize: '1rem',
        fontWeight: 700,
        background: 'var(--accent-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        lineHeight: 1.2,
    },
    subtitle: {
        fontSize: '0.65rem',
        color: 'var(--text-muted)',
        fontWeight: 400,
    },
    links: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        height: '100%',
    },
    link: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 0.9rem',
        fontSize: '0.85rem',
        fontWeight: 500,
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        borderRadius: 'var(--radius-sm)',
        transition: 'all var(--transition-fast)',
        border: '1px solid transparent',
    },
    linkActive: {
        color: 'var(--accent-indigo-light)',
        background: 'rgba(99,102,241,0.1)',
        border: '1px solid rgba(99,102,241,0.2)',
    },
    linkIcon: {
        fontSize: '0.9rem',
    },
    right: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        minWidth: 180,
        justifyContent: 'flex-end',
    },
    status: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: '0.75rem',
        color: 'var(--success)',
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: 'var(--success)',
        animation: 'pulse-glow 2s infinite',
        display: 'inline-block',
    },
    logoutBtn: {
        padding: '0.4rem 0.9rem',
        fontSize: '0.8rem',
        fontWeight: 500,
        color: 'var(--text-secondary)',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
    },
}
