import React, { useState } from 'react'

export default function LoginPage({ onLogin }) {
    const [isLoading, setIsLoading] = useState(false)

    const handleGoogleSignIn = async () => {
        setIsLoading(true)
        // Simulate OAuth flow delay
        await new Promise(resolve => setTimeout(resolve, 900))
        onLogin()
    }

    return (
        <div style={styles.page}>
            <div className="glass-card" style={styles.card}>
                {/* Logo */}
                <div style={styles.logoRow}>
                    <div style={styles.logoIcon}>H</div>
                    <div style={styles.logoText}>Health Ledger</div>
                </div>

                <p style={styles.tagline}>
                    AI-Powered Healthcare Claims Management<br />
                    for Medical Professionals
                </p>

                <div style={styles.divider}>
                    <span style={styles.dividerLine} />
                    <span style={styles.dividerText}>Sign in to continue</span>
                    <span style={styles.dividerLine} />
                </div>

                {/* Google Sign-In Button */}
                <button
                    id="google-signin-btn"
                    style={{
                        ...styles.googleBtn,
                        ...(isLoading ? styles.googleBtnLoading : {}),
                    }}
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <div style={styles.spinner} />
                            Signing you in…
                        </>
                    ) : (
                        <>
                            <GoogleIcon />
                            Sign in with Google
                        </>
                    )}
                </button>

                <div style={styles.badge}>
                    <span style={styles.lockIcon}>🔒</span>
                    Secured access — Healthcare professionals only
                </div>

                <div style={styles.footer}>
                    Health Ledger Claims Management System v2.0
                </div>
            </div>
        </div>
    )
}

function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    )
}

const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
    },
    card: {
        width: '100%',
        maxWidth: 420,
        padding: '2.75rem 2.5rem',
        animation: 'fadeInUp 0.6s ease both',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    logoRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        marginBottom: '1rem',
    },
    logoIcon: {
        width: 54,
        height: 54,
        borderRadius: 'var(--radius-md)',
        background: 'var(--accent-gradient)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.7rem',
        fontWeight: 800,
        color: '#fff',
        boxShadow: '0 4px 24px rgba(99, 102, 241, 0.45)',
    },
    logoText: {
        fontSize: '1.6rem',
        fontWeight: 800,
        background: 'var(--accent-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    },
    tagline: {
        textAlign: 'center',
        fontSize: '0.84rem',
        color: 'var(--text-muted)',
        marginBottom: '2rem',
        lineHeight: 1.6,
    },
    divider: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        width: '100%',
        marginBottom: '1.5rem',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        background: 'var(--border-glass)',
    },
    dividerText: {
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        whiteSpace: 'nowrap',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
    },
    googleBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        width: '100%',
        padding: '0.85rem 1.5rem',
        fontSize: '0.95rem',
        fontWeight: 600,
        fontFamily: 'inherit',
        color: '#fff',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        transition: 'all var(--transition-base)',
        marginBottom: '1.5rem',
    },
    googleBtnLoading: {
        opacity: 0.7,
        cursor: 'not-allowed',
    },
    spinner: {
        width: 18,
        height: 18,
        border: '2px solid rgba(255,255,255,0.2)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
    },
    badge: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        marginBottom: '2rem',
    },
    lockIcon: {
        fontSize: '0.8rem',
    },
    footer: {
        textAlign: 'center',
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-glass)',
        paddingTop: '1.25rem',
        width: '100%',
    },
}
