import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import PriorityBadge from '../components/PriorityBadge.jsx'
import { getClaimById, sendEmail, addFollowUp } from '../services/api.js'

export default function ClaimDetailsPage({ onLogout }) {
    const { id } = useParams()
    const navigate = useNavigate()
    const [claim, setClaim] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSendingEmail, setIsSendingEmail] = useState(false)
    const [isAddingFollowUp, setIsAddingFollowUp] = useState(false)

    useEffect(() => {
        getClaimById(id)
            .then(data => setClaim(data))
            .catch(() => {
                toast.error('Claim not found', { icon: '❌' })
                navigate('/claims')
            })
            .finally(() => setIsLoading(false))
    }, [id])

    const handleSendEmail = async () => {
        if (claim.emailSent) return
        setIsSendingEmail(true)
        try {
            const result = await sendEmail(claim.id)
            setClaim(prev => ({ ...prev, emailSent: true }))
            toast.success(result.message, { duration: 3000, icon: '📧' })
        } catch {
            toast.error('Failed to send email', { icon: '❌' })
        } finally {
            setIsSendingEmail(false)
        }
    }

    const handleAddFollowUp = async () => {
        setIsAddingFollowUp(true)
        try {
            const result = await addFollowUp(claim.id)
            setClaim(prev => ({
                ...prev,
                followUps: result.followUps,
                lastFollowUp: result.lastFollowUp,
            }))
            toast.success(`Follow-up #${result.followUps} logged`, { icon: '📝', duration: 2500 })
        } catch {
            toast.error('Failed to log follow-up', { icon: '❌' })
        } finally {
            setIsAddingFollowUp(false)
        }
    }

    const formatDate = (iso) => {
        if (!iso) return '—'
        return new Date(iso).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
    }

    if (isLoading) {
        return (
            <div style={styles.page}>
                <Navbar onLogout={onLogout} />
                <div style={styles.centered}>Loading claim…</div>
            </div>
        )
    }

    if (!claim) return null

    const details = [
        { label: 'Claim ID', value: claim.id, mono: true },
        { label: 'Patient ID', value: claim.patientId, mono: true },
        { label: 'Insurance Company', value: claim.insuranceCompany },
        { label: 'Insurance Email', value: claim.insuranceEmail, mono: true },
        { label: 'Claim Amount', value: `$${claim.claimAmount.toLocaleString()}` },
        { label: 'Days Pending', value: `${claim.daysPending} days` },
        { label: 'Created At', value: formatDate(claim.createdAt) },
    ]

    return (
        <div style={styles.page}>
            <Navbar onLogout={onLogout} />

            <main style={styles.main}>
                {/* Header */}
                <div style={styles.header}>
                    <button
                        style={styles.backBtn}
                        onClick={() => navigate('/claims')}
                        id="back-to-claims"
                    >
                        ← Claims List
                    </button>
                    <div style={styles.titleRow}>
                        <h1 style={styles.heading}>{claim.id}</h1>
                        <PriorityBadge priority={claim.priority} />
                    </div>
                    <p style={styles.subheading}>
                        Patient {claim.patientId} · {claim.insuranceCompany}
                    </p>
                </div>

                <div style={styles.layout}>
                    {/* Detail grid */}
                    <div className="glass-card" style={styles.detailCard}>
                        <div style={styles.sectionLabel}>Claim Information</div>
                        <div style={styles.detailGrid}>
                            {details.map(({ label, value, mono }) => (
                                <div key={label} style={styles.detailItem}>
                                    <div style={styles.detailKey}>{label}</div>
                                    <div style={{
                                        ...styles.detailVal,
                                        ...(mono ? styles.mono : {}),
                                    }}>
                                        {value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right panel: status + actions */}
                    <div style={styles.rightPanel}>
                        {/* Follow-up tracker */}
                        <div className="glass-card" style={styles.followUpCard}>
                            <div style={styles.sectionLabel}>Follow-up Tracker</div>
                            <div style={styles.followUpCount}>
                                <span style={styles.followUpNumber}>{claim.followUps ?? 0}</span>
                                <span style={styles.followUpLabel}>Follow-ups logged</span>
                            </div>
                            <div style={styles.followUpDate}>
                                <span style={styles.detailKey}>Last follow-up</span>
                                <span style={styles.detailVal}>{formatDate(claim.lastFollowUp)}</span>
                            </div>
                            <button
                                id="add-followup-btn"
                                className={`btn btn-secondary`}
                                style={{ width: '100%', marginTop: '0.75rem' }}
                                onClick={handleAddFollowUp}
                                disabled={isAddingFollowUp}
                            >
                                {isAddingFollowUp ? 'Logging…' : '📝 Log Follow-up'}
                            </button>
                        </div>

                        {/* Email status */}
                        <div className="glass-card" style={styles.emailCard}>
                            <div style={styles.sectionLabel}>Insurance Email</div>
                            <div style={styles.emailStatus}>
                                {claim.emailSent ? (
                                    <div style={styles.emailSent}>
                                        <span>✅</span>
                                        <span>Email sent to {claim.insuranceCompany}</span>
                                    </div>
                                ) : (
                                    <div style={styles.emailPending}>
                                        <span>📭</span>
                                        <span>No email sent yet</span>
                                    </div>
                                )}
                            </div>
                            <button
                                id="send-email-btn"
                                className={`btn ${claim.emailSent ? 'btn-success' : 'btn-primary'}`}
                                style={{ width: '100%', marginTop: '0.75rem' }}
                                onClick={handleSendEmail}
                                disabled={claim.emailSent || isSendingEmail}
                            >
                                {isSendingEmail
                                    ? 'Sending…'
                                    : claim.emailSent
                                        ? '✅ Email Sent'
                                        : '📧 Send Email to Insurer'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

const styles = {
    page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    centered: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '4rem' },
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
    titleRow: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' },
    heading: { fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: 'monospace' },
    subheading: { fontSize: '0.85rem', color: 'var(--text-muted)' },
    layout: {
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: '1.5rem',
        alignItems: 'start',
    },
    detailCard: { padding: '1.75rem' },
    sectionLabel: {
        fontSize: '0.7rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '1.25rem',
    },
    detailGrid: { display: 'flex', flexDirection: 'column', gap: '0' },
    detailItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.65rem 0',
        borderBottom: '1px solid var(--border-glass)',
    },
    detailKey: { fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 },
    detailVal: { fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 },
    mono: { fontFamily: 'monospace', fontSize: '0.85rem' },
    rightPanel: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    followUpCard: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    followUpCount: { display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.5rem 0' },
    followUpNumber: { fontSize: '2.5rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
    followUpLabel: { fontSize: '0.8rem', color: 'var(--text-muted)' },
    followUpDate: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderTop: '1px solid var(--border-glass)' },
    emailCard: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    emailStatus: { margin: '0.5rem 0' },
    emailSent: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--success)' },
    emailPending: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' },
}
