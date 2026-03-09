import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import PriorityBadge from '../components/PriorityBadge.jsx'
import { getClaimById, sendEmail, deleteClaim } from '../services/api.js'

/* ─────────────────────────────────────────────
   Follow-up Email Report Modal
───────────────────────────────────────────── */
function FollowUpEmailModal({ claim, userEmail, onSend, onCancel }) {
    const nextFollowUpNum = (claim.followUps ?? 0) + 1

    const defaultSubject = `Follow-up Regarding Claim ID ${claim.id}`

    const defaultBody =
        `Dear ${claim.insuranceCompany} Team,

Greetings from Health Ledger Healthcare Claims Management.

We are writing to follow up regarding the status of the following insurance claim.

Claim Details:
Claim ID: ${claim.id}
Patient ID: ${claim.patientId}
Claim Amount: ₹${claim.claimAmount.toLocaleString()}
Days Pending: ${claim.daysPending}

This is our follow-up attempt number ${nextFollowUpNum}.

We kindly request an update regarding the processing status of this claim.
Please inform us if any additional documents or actions are required from our side.

Best Regards
Health Ledger RCM Team`

    const [subject, setSubject] = useState(defaultSubject)
    const [body, setBody] = useState(defaultBody)
    const [isSending, setIsSending] = useState(false)

    const handleSend = async () => {
        setIsSending(true)
        try {
            await onSend(subject, body)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal} className="glass-card">
                {/* Header */}
                <div style={modalStyles.header}>
                    <div>
                        <h2 style={modalStyles.title}>📧 Follow-up Email Report</h2>
                        <p style={modalStyles.subtitle}>Review and send your follow-up email to the insurer</p>
                    </div>
                    <button style={modalStyles.closeBtn} onClick={onCancel} aria-label="Close">✕</button>
                </div>

                {/* From field */}
                {userEmail && (
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>FROM</label>
                        <div style={modalStyles.readonlyValue}>
                            <span style={modalStyles.emailIcon}>👤</span>
                            <span style={modalStyles.emailAddr}>{userEmail}</span>
                            <span style={modalStyles.tag}>You</span>
                        </div>
                    </div>
                )}

                {/* To field */}
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>TO</label>
                    <div style={modalStyles.readonlyValue}>
                        <span style={modalStyles.emailIcon}>📬</span>
                        <span style={modalStyles.emailAddr}>{claim.insuranceEmail}</span>
                        <span style={modalStyles.tag}>{claim.insuranceCompany}</span>
                    </div>
                </div>

                {/* Subject field */}
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>SUBJECT</label>
                    <input
                        id="email-subject"
                        style={modalStyles.input}
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                    />
                </div>

                {/* Body field */}
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>EMAIL BODY</label>
                    <textarea
                        id="email-body"
                        style={modalStyles.textarea}
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        rows={16}
                    />
                </div>

                {/* Follow-up badge */}
                <div style={modalStyles.followUpBadge}>
                    <span style={modalStyles.badgeIcon}>🔁</span>
                    <span>This will be recorded as <strong>Follow-up #{nextFollowUpNum}</strong></span>
                </div>

                {/* Actions */}
                <div style={modalStyles.actions}>
                    <button
                        id="modal-cancel-btn"
                        className="btn btn-secondary"
                        style={modalStyles.cancelBtn}
                        onClick={onCancel}
                        disabled={isSending}
                    >
                        Cancel
                    </button>
                    <button
                        id="modal-send-btn"
                        className="btn btn-primary"
                        style={modalStyles.sendBtn}
                        onClick={handleSend}
                        disabled={isSending}
                    >
                        {isSending ? '⏳ Sending…' : '📤 Send Email'}
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────
   Claim Details Page
───────────────────────────────────────────── */
export default function ClaimDetailsPage({ onLogout, userEmail }) {
    const { id } = useParams()
    const navigate = useNavigate()
    const [claim, setClaim] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showEmailModal, setShowEmailModal] = useState(false)
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

    useEffect(() => {
        getClaimById(id)
            .then(data => setClaim(data))
            .catch(() => {
                toast.error('Claim not found', { icon: '❌' })
                navigate('/claims')
            })
            .finally(() => setIsLoading(false))
    }, [id])

    const handleOpenEmailModal = () => {
        setShowEmailModal(true)
    }

    const handleSendEmail = async (subject, body) => {
        try {
            const result = await sendEmail(claim.id, {
                from: userEmail || undefined,
                to: claim.insuranceEmail,
                subject,
                body,
            })
            setClaim(prev => ({
                ...prev,
                emailSent: true,
                followUps: result.followUps,
                lastFollowUp: result.lastFollowUp,
            }))
            setShowEmailModal(false)
            toast.success(
                `📧 Email sent! Follow-up #${result.followUps} logged.`,
                { duration: 3500 }
            )
        } catch (err) {
            toast.error(err.message || 'Failed to send email', { icon: '❌' })
        }
    }

    const handleCancelModal = () => {
        setShowEmailModal(false)
    }

    const handleRemoveClaim = async () => {
        try {
            await deleteClaim(claim.id)
            toast.success('Claim removed successfully.', { icon: '🗑️', duration: 3000 })
            navigate('/claims')
        } catch {
            toast.error('Failed to remove claim.', { icon: '❌' })
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
        { label: 'Claim Amount', value: `₹${claim.claimAmount.toLocaleString()}` },
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
                    {/* Subtle remove action — low-priority, hidden in normal flow */}
                    <button
                        id="remove-claim-btn"
                        style={styles.removeLink}
                        onClick={() => setShowRemoveConfirm(true)}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
                    >
                        🗑️ Remove this claim
                    </button>
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
                            <div style={styles.followUpHint}>
                                Follow-ups are tracked automatically when an email is sent to the insurer.
                            </div>
                        </div>

                        {/* Email status */}
                        <div className="glass-card" style={styles.emailCard}>
                            <div style={styles.sectionLabel}>Insurance Email</div>
                            <div style={styles.emailStatus}>
                                {(claim.followUps ?? 0) > 0 ? (
                                    <div style={styles.emailSent}>
                                        <span>✅</span>
                                        <span>{claim.followUps} email{claim.followUps > 1 ? 's' : ''} sent to {claim.insuranceCompany}</span>
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
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '0.75rem' }}
                                onClick={handleOpenEmailModal}
                            >
                                📧 Send Email to Insurer
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Follow-up Email Modal */}
            {showEmailModal && (
                <FollowUpEmailModal
                    claim={claim}
                    userEmail={userEmail}
                    onSend={handleSendEmail}
                    onCancel={handleCancelModal}
                />
            )}

            {/* Remove Claim Confirmation Modal */}
            {showRemoveConfirm && (
                <div style={removeModalStyles.overlay}>
                    <div style={removeModalStyles.box} className="glass-card">
                        <div style={removeModalStyles.icon}>🗑️</div>
                        <h3 style={removeModalStyles.title}>Remove Claim</h3>
                        <p style={removeModalStyles.msg}>
                            Are you sure you want to remove <strong>{claim.id}</strong>?<br />
                            This action cannot be undone.
                        </p>
                        <div style={removeModalStyles.actions}>
                            <button
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '0.65rem' }}
                                onClick={() => setShowRemoveConfirm(false)}
                                id="remove-cancel-btn"
                            >
                                Cancel
                            </button>
                            <button
                                style={removeModalStyles.removeBtn}
                                onClick={handleRemoveClaim}
                                id="remove-confirm-btn"
                            >
                                Remove Claim
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
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
    followUpHint: {
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        lineHeight: 1.4,
        marginTop: '0.25rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid var(--border-glass)',
    },
    emailCard: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    emailStatus: { margin: '0.5rem 0' },
    emailSent: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--success)' },
    emailPending: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' },
}

const modalStyles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease both',
    },
    modal: {
        width: '100%',
        maxWidth: 680,
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        animation: 'fadeInUp 0.25s ease both',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1rem',
    },
    title: {
        fontSize: '1.25rem',
        fontWeight: 800,
        color: 'var(--text-primary)',
        margin: 0,
    },
    subtitle: {
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        margin: '0.25rem 0 0',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: '1.1rem',
        padding: '0.25rem 0.5rem',
        fontFamily: 'inherit',
        flexShrink: 0,
        transition: 'color 0.15s',
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
    },
    label: {
        fontSize: '0.68rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
    },
    readonlyValue: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.6rem 0.85rem',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '0.5rem',
        border: '1px solid var(--border-glass)',
        fontSize: '0.875rem',
    },
    emailIcon: { flexShrink: 0 },
    emailAddr: { color: 'var(--text-primary)', fontFamily: 'monospace', flex: 1 },
    tag: {
        fontSize: '0.72rem',
        fontWeight: 600,
        padding: '0.15rem 0.5rem',
        borderRadius: '99px',
        background: 'rgba(99,102,241,0.18)',
        color: '#a5b4fc',
        flexShrink: 0,
    },
    input: {
        width: '100%',
        padding: '0.6rem 0.85rem',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid var(--border-glass)',
        borderRadius: '0.5rem',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
        fontSize: '0.875rem',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s',
    },
    textarea: {
        width: '100%',
        padding: '0.75rem 0.85rem',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid var(--border-glass)',
        borderRadius: '0.5rem',
        color: 'var(--text-primary)',
        fontFamily: 'monospace',
        fontSize: '0.825rem',
        lineHeight: 1.6,
        resize: 'vertical',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s',
    },
    followUpBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.65rem 0.9rem',
        background: 'rgba(99,102,241,0.12)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '0.5rem',
        fontSize: '0.82rem',
        color: '#a5b4fc',
    },
    badgeIcon: { fontSize: '1rem' },
    actions: {
        display: 'flex',
        gap: '0.75rem',
        justifyContent: 'flex-end',
        paddingTop: '0.5rem',
        borderTop: '1px solid var(--border-glass)',
    },
    cancelBtn: { minWidth: 100 },
    sendBtn: { minWidth: 140 },
    removeLink: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        padding: '0.25rem 0',
        marginTop: '0.25rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        transition: 'color 0.2s',
        alignSelf: 'flex-start',
    },
}

const removeModalStyles = {
    overlay: {
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    box: {
        maxWidth: 380, width: '90%', padding: '2rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
        animation: 'fadeInUp 0.25s ease both',
    },
    icon: { fontSize: '2rem', lineHeight: 1 },
    title: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 },
    msg: {
        textAlign: 'center', fontSize: '0.87rem',
        color: 'var(--text-muted)', lineHeight: 1.6, margin: 0,
    },
    actions: { display: 'flex', gap: '0.75rem', marginTop: '0.5rem', width: '100%' },
    removeBtn: {
        flex: 1, padding: '0.65rem',
        background: 'rgba(239,68,68,0.15)',
        border: '1px solid rgba(239,68,68,0.4)',
        borderRadius: 'var(--radius-sm)',
        color: '#f87171',
        fontFamily: 'inherit', fontWeight: 700,
        fontSize: '0.875rem', cursor: 'pointer',
        transition: 'all 0.2s',
    },
}
