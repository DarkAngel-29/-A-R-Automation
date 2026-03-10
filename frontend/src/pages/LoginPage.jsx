import React, { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

export default function LoginPage() {
    const { loginWithRedirect, isLoading } = useAuth0()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [isEmailLoading, setIsEmailLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [isSignUpLoading, setIsSignUpLoading] = useState(false)
    const [error, setError] = useState('')
    const [mode, setMode] = useState('signin') // 'signin' | 'signup'


    const handleEmailSignIn = async (e) => {
        e.preventDefault()
        if (!email || !password) {
            setError('Please enter your email and password.')
            return
        }
        setError('')
        setIsEmailLoading(true)
        try {
            await loginWithRedirect({
                authorizationParams: {
                    connection: 'Username-Password-Authentication',
                    login_hint: email,
                    prompt: 'login',
                },
            })
        } catch (err) {
            setError('Sign-in failed. Please check your credentials.')
            console.error(err)
        } finally {
            setIsEmailLoading(false)
        }
    }

    const handleSignUp = async () => {
        setError('')
        setIsSignUpLoading(true)
        try {
            await loginWithRedirect({
                authorizationParams: {
                    connection: 'Username-Password-Authentication',
                    screen_hint: 'signup',
                    login_hint: 'abithb16@gmail.com',
                    prompt: 'login',
                },
            })
        } catch (err) {
            setError('Sign-up failed. Please try again.')
            console.error(err)
        } finally {
            setIsSignUpLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setError('')
        setIsGoogleLoading(true)
        try {
            await loginWithRedirect({
                authorizationParams: {
                    connection: 'google-oauth2',
                    prompt: 'login',
                },
            })
        } catch (err) {
            setError('Google sign-in failed. Please try again.')
            console.error(err)
        } finally {
            setIsGoogleLoading(false)
        }
    }

    const busy = isLoading || isEmailLoading || isGoogleLoading || isSignUpLoading

    return (
        <div style={styles.page}>
            {/* Ambient background blobs */}
            <div style={styles.blob1} />
            <div style={styles.blob2} />

            <div className="glass-card" style={styles.card}>
                {/* Logo */}
                <div style={styles.logoRow}>
                    <div style={styles.logoIcon}>H</div>
                    <div>
                        <div style={styles.logoText}>Health Ledger</div>
                        <div style={styles.logoSubText}>Claims Management</div>
                    </div>
                </div>

                <p style={styles.tagline}>
                    AI-Powered Healthcare Claims Management<br />
                    for Medical Professionals
                </p>

                {/* Error banner */}
                {error && (
                    <div style={styles.errorBanner}>
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Email/Password form */}
                <form onSubmit={handleEmailSignIn} style={styles.form}>
                    <div style={styles.fieldGroup}>
                        <label style={styles.label} htmlFor="login-email">Email Address</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={styles.input}
                            disabled={busy}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label} htmlFor="login-password">Password</label>
                        <div style={styles.passWrap}>
                            <input
                                id="login-password"
                                type={showPass ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                style={{ ...styles.input, paddingRight: '2.8rem' }}
                                disabled={busy}
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                style={styles.eyeBtn}
                                onClick={() => setShowPass(v => !v)}
                                tabIndex={-1}
                                aria-label={showPass ? 'Hide password' : 'Show password'}
                            >
                                {showPass ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button
                        id="email-signin-btn"
                        type="submit"
                        className="btn btn-primary"
                        style={styles.primaryBtn}
                        disabled={busy}
                    >
                        {isEmailLoading ? (
                            <><div style={styles.spinner} /> Signing in…</>
                        ) : '🔐 Sign In'}
                    </button>
                </form>

                {/* Divider */}
                <div style={styles.divider}>
                    <span style={styles.dividerLine} />
                    <span style={styles.dividerText}>or continue with</span>
                    <span style={styles.dividerLine} />
                </div>

                {/* Google */}
                <button
                    id="google-signin-btn"
                    style={{
                        ...styles.googleBtn,
                        ...(busy ? styles.disabledBtn : {}),
                    }}
                    onClick={handleGoogleSignIn}
                    disabled={busy}
                >
                    {isGoogleLoading ? (
                        <><div style={styles.spinner} /> Redirecting…</>
                    ) : (
                        <><GoogleIcon /> Sign in with Google</>
                    )}
                </button>

                {/* Create Account / Sign In toggle */}
                <div style={styles.createAccountRow}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                    </span>
                    <button
                        id={mode === 'signin' ? 'create-account-btn' : 'back-to-signin-btn'}
                        style={styles.linkBtn}
                        onClick={() => {
                            if (mode === 'signup') {
                                setMode('signin')
                            } else {
                                handleSignUp()
                            }
                        }}
                        disabled={busy}
                        type="button"
                    >
                        {isSignUpLoading
                            ? 'Redirecting…'
                            : mode === 'signin'
                                ? 'Create Account'
                                : 'Sign In'}
                    </button>
                </div>

                {/* Footer */}
                <div style={styles.badge}>
                    <span>🔒</span> Secured access — Healthcare professionals only
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
        position: 'relative',
        overflow: 'hidden',
    },
    blob1: {
        position: 'fixed',
        top: '-10vh',
        left: '-10vw',
        width: '55vw',
        height: '55vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
    },
    blob2: {
        position: 'fixed',
        bottom: '-10vh',
        right: '-10vw',
        width: '50vw',
        height: '50vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
    },
    card: {
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 430,
        padding: '2.5rem 2.25rem',
        animation: 'fadeInUp 0.5s ease both',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    logoRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.9rem',
        marginBottom: '0.8rem',
    },
    logoIcon: {
        width: 52,
        height: 52,
        borderRadius: '14px',
        background: 'var(--accent-gradient)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.6rem',
        fontWeight: 800,
        color: '#fff',
        boxShadow: '0 4px 24px rgba(99,102,241,0.45)',
        flexShrink: 0,
    },
    logoText: {
        fontSize: '1.45rem',
        fontWeight: 800,
        background: 'var(--accent-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        lineHeight: 1.2,
    },
    logoSubText: {
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        fontWeight: 500,
        letterSpacing: '0.04em',
    },
    tagline: {
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        marginBottom: '1.75rem',
        lineHeight: 1.6,
    },
    errorBanner: {
        width: '100%',
        padding: '0.65rem 0.9rem',
        borderRadius: '8px',
        background: 'rgba(239,68,68,0.12)',
        border: '1px solid rgba(239,68,68,0.3)',
        color: '#fca5a5',
        fontSize: '0.82rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        boxSizing: 'border-box',
    },
    form: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        width: '100%',
    },
    label: {
        fontSize: '0.73rem',
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
    },
    input: {
        width: '100%',
        padding: '0.7rem 0.9rem',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid var(--border-glass)',
        borderRadius: '8px',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
        fontSize: '0.9rem',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
    },
    passWrap: {
        position: 'relative',
        width: '100%',
    },
    eyeBtn: {
        position: 'absolute',
        right: '0.7rem',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1rem',
        padding: '0.2rem',
        lineHeight: 1,
    },
    primaryBtn: {
        width: '100%',
        padding: '0.8rem 1rem',
        fontSize: '0.95rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        marginTop: '0.25rem',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    divider: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        width: '100%',
        margin: '1.25rem 0',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        background: 'var(--border-glass)',
    },
    dividerText: {
        fontSize: '0.7rem',
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
        padding: '0.78rem 1.5rem',
        fontSize: '0.92rem',
        fontWeight: 600,
        fontFamily: 'inherit',
        color: '#fff',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginBottom: '1.5rem',
    },
    disabledBtn: {
        opacity: 0.6,
        cursor: 'not-allowed',
    },
    spinner: {
        width: 16,
        height: 16,
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
        fontSize: '0.73rem',
        color: 'var(--text-muted)',
        marginBottom: '1.5rem',
    },
    footer: {
        textAlign: 'center',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-glass)',
        paddingTop: '1rem',
        width: '100%',
    },
    createAccountRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        marginBottom: '1.25rem',
        width: '100%',
    },
    linkBtn: {
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '0.82rem',
        fontWeight: 700,
        background: 'var(--accent-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        padding: 0,
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
    },
}
