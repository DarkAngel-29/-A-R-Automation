import React, { useState } from 'react'

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
    daysPending: '',
    insuranceCompany: '',
    insuranceEmail: '',
}

export default function ClaimForm({ onSubmit, isSubmitting }) {
    const [form, setForm] = useState(initialForm)

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        await onSubmit(form)
        setForm(initialForm)
    }

    const isValid =
        form.patientId.trim() &&
        form.claimAmount &&
        form.daysPending &&
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
                        <label htmlFor="claimAmount">Claim Amount ($)</label>
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

                    <div style={styles.fieldGroup}>
                        <label htmlFor="daysPending">Days Pending</label>
                        <input
                            id="daysPending"
                            name="daysPending"
                            type="number"
                            min="0"
                            placeholder="e.g. 30"
                            value={form.daysPending}
                            onChange={handleChange}
                            required
                        />
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
                </div>

                <div style={styles.footer}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setForm(initialForm)}
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
