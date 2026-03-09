import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/generate', label: 'Generate Claim', icon: '➕' },
    { to: '/claims', label: 'Claims List', icon: '📋' },
]

/* ── Theme helpers ── */
function getStoredTheme() {
    return localStorage.getItem('theme') === 'light' ? 'light' : 'dark'
}

function applyTheme(theme) {
    const root = document.documentElement
    if (theme === 'light') {
        root.classList.add('light-theme')
    } else {
        root.classList.remove('light-theme')
    }
    localStorage.setItem('theme', theme)
}

export default function Navbar({ onLogout }) {
    const navigate = useNavigate()
    const [theme, setTheme] = useState(getStoredTheme)

    // Apply stored theme on mount
    useEffect(() => {
        applyTheme(theme)
    }, [])

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark'
        setTheme(next)
        applyTheme(next)
    }

    const handleLogout = () => {
        onLogout()
        navigate('/')
    }

    const isLight = theme === 'light'

    return (
        <nav style={styles.nav}>
            {/* Brand */}
            <div style={styles.brand}>
                <div style={styles.logo}>H</div>
                <div>
                    <div style={{
                        ...styles.title,
                        ...(isLight ? { background: 'none', WebkitTextFillColor: '#202124', color: '#202124' } : {}),
                    }}>
                        Health Ledger
                    </div>
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
                            ...(isActive
                                ? (isLight ? styles.linkActiveLight : styles.linkActive)
                                : {}),
                            ...(isLight ? styles.linkLight : {}),
                        })}
                    >
                        <span style={styles.linkIcon}>{icon}</span>
                        {label}
                    </NavLink>
                ))}
            </div>

            {/* Right side */}
            <div style={styles.right}>
                <div style={{ ...styles.status, ...(isLight ? { color: '#137333' } : {}) }}>
                    <span style={{ ...styles.dot, ...(isLight ? { background: '#137333' } : {}) }} />
                    System Active
                </div>

                {/* ☀ / 🌙 Theme toggle */}
                <button
                    id="theme-toggle-btn"
                    className="theme-toggle"
                    onClick={toggleTheme}
                    title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {isLight ? '🌙 Dark' : '☀️ Light'}
                </button>

                <button
                    id="logout-btn"
                    style={{
                        ...styles.logoutBtn,
                        ...(isLight ? styles.logoutBtnLight : {}),
                    }}
                    onClick={handleLogout}
                    onMouseEnter={e => {
                        e.currentTarget.style.color = isLight ? '#D93025' : 'var(--error)'
                        e.currentTarget.style.borderColor = 'rgba(217,48,37,0.3)'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.color = isLight ? '#5F6368' : 'var(--text-secondary)'
                        e.currentTarget.style.borderColor = isLight ? '#DADCE0' : 'var(--border-glass)'
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
        transition: 'all 0.15s ease',
        border: '1px solid transparent',
    },
    linkLight: {
        color: '#5F6368',
    },
    linkActive: {
        color: 'var(--accent-indigo-light)',
        background: 'rgba(99,102,241,0.1)',
        border: '1px solid rgba(99,102,241,0.2)',
    },
    linkActiveLight: {
        color: '#1A73E8',
        background: '#E8F0FE',
        border: '1px solid #C5D8FB',
    },
    linkIcon: { fontSize: '0.9rem' },
    right: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        minWidth: 220,
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
        transition: 'all 0.15s ease',
        fontFamily: 'inherit',
    },
    logoutBtnLight: {
        color: '#5F6368',
        background: '#F1F3F4',
        border: '1px solid #DADCE0',
    },
}
