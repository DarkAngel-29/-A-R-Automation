import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import ClaimForm from '../components/ClaimForm.jsx'
import { generateClaim } from '../services/api.js'

export default function GenerateClaimPage({ onLogout }) {
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [lastClaim, setLastClaim] = useState(null)

    const handleGenerateClaim = async (formData) => {
        setIsSubmitting(true)
        try {
            const newClaim = await generateClaim(formData)
            setLastClaim(newClaim)
            toast.success(
                `Claim ${newClaim.id} created — Priority: ${newClaim.priority}`,
                { duration: 3500, icon: '✅' }
            )
        } catch (err) {
            toast.error('Failed to generate claim', { icon: '❌' })
        } finally {
            setIsSubmitting(false)
        }
    }

    const priorityColor = {
        High: 'var(--priority-high)',
        Medium: 'var(--priority-medium)',
        Low: 'var(--priority-low)',
    }

    return (
        <div style={styles.page}>
            <Navbar onLogout={onLogout} />

            <main style={styles.main}>
                {/* Header */}
                <div style={styles.header}>
                    <button style={styles.backBtn} onClick={() => navigate('/dashboard')} id="back-to-dashboard">
                        ← Dashboard
                    </button>
                    <h1 style={styles.heading}>Generate Claim</h1>
                    <p style={styles.subheading}>
                        Fill in the patient and insurance details below. Our AI model will automatically assign a priority level.
                    </p>
                </div>

                <div style={styles.layout}>
                    {/* Form column */}
                    <div style={styles.formColumn}>
                        <ClaimForm onSubmit={handleGenerateClaim} isSubmitting={isSubmitting} />
                    </div>

                    {/* Result / sidebar column */}
                    <div style={styles.sideColumn}>
                        {lastClaim ? (
                            <div className="glass-card" style={styles.resultCard}>
                                <div style={styles.resultHeader}>
                                    <span style={styles.resultCheck}>✅</span>
                                    <div>
                                        <div style={styles.resultTitle}>Claim Created</div>
                                        <div style={styles.resultId}>{lastClaim.id}</div>
                                    </div>
                                </div>

                                <div style={styles.resultRow}>
                                    <span style={styles.resultKey}>Patient ID</span>
                                    <span style={styles.resultVal}>{lastClaim.patientId}</span>
                                </div>
                                <div style={styles.resultRow}>
                                    <span style={styles.resultKey}>Amount</span>
                                    <span style={styles.resultVal}>₹{lastClaim.claimAmount.toLocaleString()}</span>
                                </div>
                                <div style={styles.resultRow}>
                                    <span style={styles.resultKey}>Days Pending</span>
                                    <span style={styles.resultVal}>{lastClaim.daysPending}</span>
                                </div>
                                <div style={styles.resultRow}>
                                    <span style={styles.resultKey}>AI Priority</span>
                                    <span style={{
                                        ...styles.resultVal,
                                        color: priorityColor[lastClaim.priority],
                                        fontWeight: 700,
                                    }}>
                                        {lastClaim.priority}
                                    </span>
                                </div>

                                <div style={styles.resultActions}>
                                    <button
                                        id="view-all-claims-btn"
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                        onClick={() => navigate('/claims')}
                                    >
                                        View All Claims →
                                    </button>
                                    <button
                                        id="generate-another-btn"
                                        className="btn btn-secondary"
                                        style={{ width: '100%' }}
                                        onClick={() => setLastClaim(null)}
                                    >
                                        Generate Another
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-card" style={styles.infoCard}>
                                <div style={styles.infoIcon}>🤖</div>
                                <div style={styles.infoTitle}>AI Priority Engine</div>
                                <p style={styles.infoText}>
                                    Our model scores each claim based on the <strong>claim amount</strong> and <strong>days pending</strong> to assign a priority level automatically.
                                </p>
                                <div style={styles.priorityLegend}>
                                    {[
                                        { color: 'var(--priority-high)', bg: 'var(--priority-high-bg)', label: 'High' },
                                        { color: 'var(--priority-medium)', bg: 'var(--priority-medium-bg)', label: 'Medium' },
                                        { color: 'var(--priority-low)', bg: 'var(--priority-low-bg)', label: 'Low' },
                                    ].map(p => (
                                        <div key={p.label} style={{ ...styles.legendItem, background: p.bg, color: p.color }}>
                                            {p.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

const styles = {
    page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    main: {
        flex: 1,
        maxWidth: 1100,
        width: '100%',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    header: { animation: 'fadeInUp 0.4s ease both' },
    backBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        marginBottom: '0.5rem',
        fontFamily: 'inherit',
        transition: 'color var(--transition-fast)',
    },
    heading: { fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.35rem' },
    subheading: { fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 },
    layout: {
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '1.5rem',
        alignItems: 'start',
    },
    formColumn: {},
    sideColumn: {},
    resultCard: {
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        animation: 'fadeInUp 0.4s ease both',
    },
    resultHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' },
    resultCheck: { fontSize: '1.5rem' },
    resultTitle: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' },
    resultId: { fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' },
    resultRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.4rem 0',
        borderBottom: '1px solid var(--border-glass)',
    },
    resultKey: { fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 },
    resultVal: { fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 },
    resultActions: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' },
    infoCard: {
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '0.75rem',
    },
    infoIcon: { fontSize: '2.5rem' },
    infoTitle: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' },
    infoText: { fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 },
    priorityLegend: { display: 'flex', gap: '0.5rem', marginTop: '0.5rem' },
    legendItem: {
        padding: '0.3rem 0.9rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.78rem',
        fontWeight: 700,
    },
}
