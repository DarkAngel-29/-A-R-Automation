import React, { useState, useEffect, useRef } from 'react'

const styles = {
    wrapper: {
        padding: '2rem',
        animation: 'fadeInUp 0.5s ease both',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1.5rem',
    },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-sm)',
        background: 'var(--accent-gradient)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        boxShadow: '0 2px 12px rgba(99, 102, 241, 0.3)',
    },
    title: {
        fontSize: '1.1rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
    },
    subtitle: {
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        marginTop: '2px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '1.1rem',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '1.5rem',
        gap: '0.75rem',
    },
    spinner: {
        display: 'inline-block',
        width: 16,
        height: 16,
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
    },
}

// Inline keyframe for spinner
const spinKeyframe = `@keyframes spin { to { transform: rotate(360deg); } }`

const initialForm = {
    patientId: '',
    claimAmount: '',
    daysSinceClaim: 0,
    insuranceCompany: '',
    insuranceEmail: '',
    insurancePhone: '',
}

export default function ClaimForm({ onSubmit, isSubmitting, onFormChange, predictedPriority }) {
    const [form, setForm] = useState(initialForm)
    const [autoIncrement, setAutoIncrement] = useState(false)
    const autoRef = useRef(null)
    // Capture the moment the form was opened so api.js can auto-compute
    // days_since_claim = floor((today - claim_created_date) / ms_per_day)
    const claimCreatedDateRef = useRef(new Date().toISOString())

    // Auto Increment demo mode — tick every 10 seconds
    useEffect(() => {
        if (autoIncrement) {
            autoRef.current = setInterval(() => {
                setForm(prev => {
                    const updated = { ...prev, daysSinceClaim: prev.daysSinceClaim + 1 }
                    if (onFormChange) {
                        onFormChange({ claimAmount: updated.claimAmount, daysSinceClaim: updated.daysSinceClaim })
                    }
                    return updated
                })
            }, 10000)
        } else {
            clearInterval(autoRef.current)
        }
        return () => clearInterval(autoRef.current)
    }, [autoIncrement, onFormChange])

    const handleChange = (e) => {
        const value = e.target.type === 'number'
            ? (e.target.value === '' ? '' : Number(e.target.value))
            : e.target.value
        const updated = { ...form, [e.target.name]: value }
        setForm(updated)
        // Notify parent so live priority panel can update instantly
        if (onFormChange) {
            onFormChange({ claimAmount: updated.claimAmount, daysSinceClaim: updated.daysSinceClaim })
        }
    }

    const handlePlusOneDay = () => {
        setForm(prev => {
            const updated = { ...prev, daysSinceClaim: Number(prev.daysSinceClaim) + 1 }
            if (onFormChange) {
                onFormChange({ claimAmount: updated.claimAmount, daysSinceClaim: updated.daysSinceClaim })
            }
            return updated
        })
    }

    const handleResetDays = () => {
        setForm(prev => {
            const updated = { ...prev, daysSinceClaim: 0 }
            if (onFormChange) {
                onFormChange({ claimAmount: updated.claimAmount, daysSinceClaim: 0 })
            }
            return updated
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        // Pass claim_created_date so api.js stores it and auto-computes
        // days_since_claim on every future read using real calendar days
        await onSubmit({ ...form, predictedPriority, claim_created_date: claimCreatedDateRef.current })
        setForm(initialForm)
        claimCreatedDateRef.current = new Date().toISOString()
        setAutoIncrement(false)
        if (onFormChange) onFormChange({ claimAmount: '', daysSinceClaim: 0 })
    }

    const isValid =
        form.patientId.trim() &&
        form.claimAmount &&
        form.daysSinceClaim !== '' &&
        form.insuranceCompany.trim() &&
        form.insuranceEmail.trim()

    return (
        <>
            <style>{spinKeyframe}</style>
            <form
                className="glass-card"
                style={styles.wrapper}
                onSubmit={handleSubmit}
                id="claim-form"
            >
                <div style={styles.header}>
                    <div style={styles.icon}>📋</div>
                    <div>
                        <div style={styles.title}>Generate New Claim</div>
                        <div style={styles.subtitle}>Enter patient and insurance details</div>
                    </div>
                </div>

                <div style={styles.grid}>
                    <div style={styles.fieldGroup}>
                        <label htmlFor="patientId">Patient ID</label>
                        <input
                            id="patientId"
                            name="patientId"
                            placeholder="e.g. PAT-001"
                            value={form.patientId}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={styles.fieldGroup}>
                        <label htmlFor="claimAmount">Claim Amount (₹)</label>
                        <input
                            id="claimAmount"
                            name="claimAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="e.g. 5000"
                            value={form.claimAmount}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Days Since Claim — with +1 Day / Reset controls */}
                    <div style={{ ...styles.fieldGroup, gridColumn: 'span 2' }}>
                        <label htmlFor="daysSinceClaim">Days Since Claim</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                                id="daysSinceClaim"
                                name="daysSinceClaim"
                                type="number"
                                min="0"
                                value={form.daysSinceClaim}
                                onChange={handleChange}
                                required
                                style={{ maxWidth: 130 }}
                            />
                            <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.42rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                                onClick={handlePlusOneDay}
                                id="plus-one-day-btn"
                            >
                                +1 Day
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.42rem 0.85rem', fontSize: '0.8rem' }}
                                onClick={handleResetDays}
                                id="reset-days-btn"
                            >
                                Reset
                            </button>
                            {/* Auto Increment Toggle */}
                            <label
                                htmlFor="auto-increment-toggle"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    fontSize: '0.78rem',
                                    color: autoIncrement ? 'var(--priority-low)' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    transition: 'color 0.2s',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <input
                                    id="auto-increment-toggle"
                                    type="checkbox"
                                    checked={autoIncrement}
                                    onChange={e => setAutoIncrement(e.target.checked)}
                                    style={{ accentColor: 'var(--priority-low)', width: 14, height: 14 }}
                                />
                                Auto Increment
                                {autoIncrement && (
                                    <span style={{
                                        fontSize: '0.68rem',
                                        background: 'rgba(34,197,94,0.12)',
                                        color: 'var(--priority-low)',
                                        padding: '1px 8px',
                                        borderRadius: 999,
                                        fontWeight: 700,
                                        letterSpacing: '0.04em',
                                    }}>
                                        DEMO
                                    </span>
                                )}
                            </label>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                            {autoIncrement
                                ? '⏱ Auto Increment active — +1 every 10 seconds'
                                : 'Type manually, click +1 Day, or enable Auto Increment (Demo Mode)'}
                        </div>
                    </div>

                    <div style={styles.fieldGroup}>
                        <label htmlFor="insuranceCompany">Insurance Company</label>
                        <input
                            id="insuranceCompany"
                            name="insuranceCompany"
                            placeholder="e.g. BlueCross"
                            value={form.insuranceCompany}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={styles.fieldGroup}>
                        <label htmlFor="insuranceEmail">Insurance Email</label>
                        <input
                            id="insuranceEmail"
                            name="insuranceEmail"
                            type="email"
                            placeholder="e.g. claims@bluecross.com"
                            value={form.insuranceEmail}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={styles.fieldGroup}>
                        <label htmlFor="insurancePhone">
                            Insurance Phone
                            <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: '0.4rem', opacity: 0.7 }}>(for AI call)</span>
                        </label>
                        <input
                            id="insurancePhone"
                            name="insurancePhone"
                            type="tel"
                            placeholder="e.g. +919876543210"
                            value={form.insurancePhone}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div style={styles.footer}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => { setForm(initialForm); setAutoIncrement(false) }}
                        disabled={isSubmitting}
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        id="generate-claim-btn"
                        disabled={!isValid || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span style={styles.spinner} />
                                Processing…
                            </>
                        ) : (
                            '⚡ Generate Claim'
                        )}
                    </button>
                </div>
            </form>
        </>
    )
}
