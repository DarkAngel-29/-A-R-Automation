import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import PriorityBadge from '../components/PriorityBadge.jsx'
import { getClaimById, sendEmail, deleteClaim, logCall } from '../services/api.js'

/* ─────────────────────────────────────────────
   Follow-up Email Modal
───────────────────────────────────────────── */
function FollowUpEmailModal({ claim, userEmail, onSend, onCancel }) {
    const nextFollowUpNum = (claim.followUps ?? 0) + 1
    const defaultSubject = `Follow-up Regarding Claim ID ${claim.id}`
    const defaultBody =
        `Dear ${claim.insuranceCompany} Team,\n\nGreetings from Health Ledger Healthcare Claims Management.\n\nWe are writing to follow up regarding the status of the following insurance claim.\n\nClaim Details:\nClaim ID: ${claim.id}\nPatient ID: ${claim.patientId}\nClaim Amount: ₹${claim.claimAmount.toLocaleString()}\nDays Since Claim: ${claim.daysSinceClaim ?? claim.daysPending ?? 0}\n\nThis is our follow-up attempt number ${nextFollowUpNum}.\n\nWe kindly request an update regarding the processing status of this claim.\nPlease inform us if any additional documents or actions are required from our side.\n\nBest Regards\nHealth Ledger RCM Team`

    const [subject, setSubject] = useState(defaultSubject)
    const [body, setBody] = useState(defaultBody)
    const [isSending, setIsSending] = useState(false)

    const handleSend = async () => {
        setIsSending(true)
        try { await onSend(subject, body) } finally { setIsSending(false) }
    }

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal} className="glass-card">
                <div style={modalStyles.header}>
                    <div>
                        <h2 style={modalStyles.title}>📧 Follow-up Email Report</h2>
                        <p style={modalStyles.subtitle}>Review and send your follow-up email to the insurer</p>
                    </div>
                    <button style={modalStyles.closeBtn} onClick={onCancel} aria-label="Close">✕</button>
                </div>
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
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>TO</label>
                    <div style={modalStyles.readonlyValue}>
                        <span style={modalStyles.emailIcon}>📬</span>
                        <span style={modalStyles.emailAddr}>{claim.insuranceEmail}</span>
                        <span style={modalStyles.tag}>{claim.insuranceCompany}</span>
                    </div>
                </div>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>SUBJECT</label>
                    <input id="email-subject" style={modalStyles.input} value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>EMAIL BODY</label>
                    <textarea id="email-body" style={modalStyles.textarea} value={body} onChange={e => setBody(e.target.value)} rows={14} />
                </div>
                <div style={modalStyles.followUpBadge}>
                    <span style={modalStyles.badgeIcon}>🔁</span>
                    <span>This will be recorded as <strong>Follow-up #{nextFollowUpNum}</strong></span>
                </div>
                <div style={modalStyles.actions}>
                    <button id="modal-cancel-btn" className="btn btn-secondary" style={modalStyles.cancelBtn} onClick={onCancel} disabled={isSending}>Cancel</button>
                    <button id="modal-send-btn" className="btn btn-primary" style={modalStyles.sendBtn} onClick={handleSend} disabled={isSending}>
                        {isSending ? '⏳ Sending…' : '📤 Send Email'}
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────
   AI Call Modal — 3 phases
───────────────────────────────────────────── */
const CALL_QUESTIONS = [
    'What is the current status of this claim?',
    'Are there any pending documents required?',
    'What is the expected processing timeline?',
    'Has an adjuster been assigned to this claim?',
]

function AICallModal({ claim, onComplete, onCancel }) {
    const [phase, setPhase] = useState('dialing') // dialing | calling | complete | error
    const [questionIdx, setQuestionIdx] = useState(0)
    const [responseText, setResponseText] = useState('')
    const [callResult, setCallResult] = useState(null)
    const [callError, setCallError] = useState(null)
    const [callDots, setCallDots] = useState('.')

    // Animated dots
    useEffect(() => {
        if (phase === 'complete') return
        const t = setInterval(() => setCallDots(d => d.length >= 3 ? '.' : d + '.'), 500)
        return () => clearInterval(t)
    }, [phase])

    // Phase progression
    useEffect(() => {
        // Phase 1: Dialing (1.5s)
        const t1 = setTimeout(() => setPhase('calling'), 1500)
        return () => clearTimeout(t1)
    }, [])

    // Cycle through questions during call
    useEffect(() => {
        if (phase !== 'calling') return
        const t = setInterval(() => {
            setQuestionIdx(i => {
                if (i >= CALL_QUESTIONS.length - 1) {
                    clearInterval(t)
                    return i
                }
                return i + 1
            })
        }, 900)
        return () => clearInterval(t)
    }, [phase])

    // Start logCall — results come back after ~5s
    const started = useRef(false)
    useEffect(() => {
        if (started.current) return
        started.current = true
        logCall(claim.id).then(res => {
            setResponseText(res.response_text || 'Call completed.')
            setCallResult(res)
            setPhase('complete')
            onComplete(res)
        }).catch((err) => {
            setCallError(err?.message || 'Call failed. Please try again.')
            setPhase('error')
        })
    }, []) // eslint-disable-line

    return (
        <div style={callModal.overlay}>
            <div style={callModal.box} className="glass-card">
                {phase === 'dialing' && (
                    <>
                        <div style={callModal.icon}>📞</div>
                        <h3 style={callModal.title}>Initiating AI Call{callDots}</h3>
                        <p style={callModal.sub}>Connecting to <strong>{claim.insuranceCompany}</strong></p>
                        {claim.insurancePhone
                            ? <p style={callModal.hint}>📱 {claim.insurancePhone}</p>
                            : <p style={callModal.hint}>No phone number — running simulation</p>
                        }
                        <div style={callModal.dialRing} />
                    </>
                )}
                {phase === 'calling' && (
                    <>
                        <div style={{ ...callModal.icon, color: '#22c55e' }}>🎙️</div>
                        <h3 style={callModal.title}>Call in Progress{callDots}</h3>
                        <p style={callModal.sub}>AI agent speaking with <strong>{claim.insuranceCompany}</strong></p>
                        <div style={callModal.qBox}>
                            <div style={callModal.qLabel}>AI is asking:</div>
                            <div style={callModal.qText}>"{CALL_QUESTIONS[questionIdx]}"</div>
                        </div>
                        <div style={callModal.progressBar}>
                            <div style={{ ...callModal.progressFill, width: `${((questionIdx + 1) / CALL_QUESTIONS.length) * 100}%` }} />
                        </div>
                    </>
                )}
                {phase === 'complete' && (
                    <>
                        <div style={{ ...callModal.icon, color: '#22c55e' }}>✅</div>
                        <h3 style={{ ...callModal.title, color: 'var(--success)' }}>Call Complete</h3>
                        <div style={callModal.viaBadge}>
                            {callResult?.via === 'twilio'
                                ? <><span>📞</span> Real Twilio call — transcription captured</>
                                : <><span>🔁</span> Simulated — add phone number &amp; Twilio credentials for real calls</>
                            }
                        </div>
                        <div style={callModal.responseBox}>
                            <div style={callModal.responseLabel}>💬 Insurance Response</div>
                            <p style={callModal.responseText}>{responseText}</p>
                        </div>
                        {callResult?.recording_url && (
                            <a
                                href={callResult.recording_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={callModal.recordingLink}
                            >
                                🎙️ Listen to Recording
                            </a>
                        )}
                        <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }} onClick={onCancel} id="call-done-btn">
                            Done — View Timeline
                        </button>
                    </>
                )}
                {phase === 'error' && (
                    <>
                        <div style={{ ...callModal.icon, color: '#ef4444' }}>❌</div>
                        <h3 style={{ ...callModal.title, color: '#f87171' }}>Call Failed</h3>
                        <div style={callModal.errorBox}>
                            <div style={callModal.errorLabel}>⚠️ Twilio Error</div>
                            <p style={callModal.errorText}>{callError}</p>
                        </div>
                        {callError?.toLowerCase().includes('unverified') && (
                            <div style={callModal.errorHint}>
                                <strong>Trial account restriction:</strong> Twilio trial accounts can only call numbers you have verified.
                                <br />
                                <a
                                    href="https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#22d3ee', fontWeight: 600 }}
                                >
                                    → Verify your number at Twilio Console
                                </a>
                            </div>
                        )}
                        <button className="btn btn-secondary" style={{ width: '100%', marginTop: '0.75rem' }} onClick={onCancel}>
                            Close
                        </button>
                    </>
                )}
                {phase !== 'complete' && phase !== 'error' && (
                    <button style={callModal.cancelBtn} onClick={onCancel}>Cancel Call</button>
                )}
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────
   Activity Timeline
───────────────────────────────────────────── */
const TYPE_META = {
    system: { icon: '🖥️', label: 'System', color: '#64748b' },
    email: { icon: '📧', label: 'Email', color: '#6366f1' },
    call: { icon: '📞', label: 'Call', color: '#22d3ee' },
    response: { icon: '💬', label: 'Response', color: '#22c55e' },
    call_response: { icon: '🎤', label: 'Call Response', color: '#a855f7' },
}

const STATUS_COLORS = {
    Approved: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
    Denied: { bg: 'rgba(239,68,68,0.12)', text: '#f87171' },
    'Under Review': { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24' },
    Processing: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8' },
    Pending: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24' },
    Submitted: { bg: 'rgba(34,211,238,0.12)', text: '#22d3ee' },
    Closed: { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' },
    Unknown: { bg: 'rgba(100,116,139,0.10)', text: '#94a3b8' },
}

function ActivityTimeline({ log }) {
    if (!log || log.length === 0) {
        return (
            <div style={tl.empty}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem', opacity: 0.4 }}>📋</div>
                <div>No activity recorded yet</div>
            </div>
        )
    }

    const formatTs = (iso) => {
        const d = new Date(iso)
        return d.toLocaleString('en-IN', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
        })
    }

    return (
        <div style={tl.wrapper}>
            {log.map((entry, i) => {
                const meta = TYPE_META[entry.interaction_type] || TYPE_META.system
                const isLast = i === log.length - 1
                return (
                    <div key={i} style={tl.row}>
                        {/* Left: icon + line */}
                        <div style={tl.lineCol}>
                            <div style={{ ...tl.dot, background: meta.color, boxShadow: `0 0 8px ${meta.color}55` }}>
                                <span style={{ fontSize: '0.7rem' }}>{meta.icon}</span>
                            </div>
                            {!isLast && <div style={tl.line} />}
                        </div>
                        {/* Right: content */}
                        <div style={{ ...tl.content, marginBottom: isLast ? 0 : '1.25rem' }}>
                            <div style={tl.topRow}>
                                <span style={{ ...tl.typeBadge, background: `${meta.color}18`, color: meta.color }}>
                                    {meta.label}
                                </span>
                                <span style={tl.ts}>{formatTs(entry.timestamp)}</span>
                            </div>
                            <div style={tl.desc}>{entry.description}</div>
                            {/* Quote block for plain response text */}
                            {entry.response_text && entry.interaction_type !== 'call_response' && (
                                <div style={tl.responseQuote}>
                                    "{entry.response_text}"
                                </div>
                            )}
                            {/* Structured call_response block */}
                            {entry.interaction_type === 'call_response' && (
                                <div style={tl.callResponseBlock}>
                                    {entry.response_text && (
                                        <div style={tl.speechText}>
                                            🗣️ <em>"{entry.response_text}"</em>
                                        </div>
                                    )}
                                    <div style={tl.callMeta}>
                                        {entry.interpreted_status && (() => {
                                            const sc = STATUS_COLORS[entry.interpreted_status] || STATUS_COLORS.Unknown
                                            return (
                                                <span style={{ ...tl.statusPill, background: sc.bg, color: sc.text }}>
                                                    Status: {entry.interpreted_status}
                                                </span>
                                            )
                                        })()}
                                        {entry.confidence && (
                                            <span style={tl.confidencePill}>
                                                🎯 {entry.confidence} confidence
                                            </span>
                                        )}
                                        {entry.recording_url && (
                                            <a
                                                href={entry.recording_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={tl.recordingLink}
                                            >
                                                🎙️ Recording
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
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
    const [showCallModal, setShowCallModal] = useState(false)
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
                followups_done: result.followUps,
                lastFollowUp: result.lastFollowUp,
                last_followup_date: result.lastFollowUp,
                next_followup_due: result.next_followup_due,
                activity_log: result.activity_log || prev.activity_log,
            }))
            setShowEmailModal(false)
            toast.success(`📧 Email sent! Follow-up #${result.followUps} logged.`, { duration: 3500 })
        } catch (err) {
            toast.error(err.message || 'Failed to send email', { icon: '❌' })
        }
    }

    const handleCallComplete = (result) => {
        setClaim(prev => ({
            ...prev,
            followups_done: result.followups_done || (prev.followups_done || 0) + 1,
            last_followup_date: new Date().toISOString(),
            next_followup_due: result.next_followup_due || prev.next_followup_due,
            activity_log: result.activity_log || prev.activity_log,
        }))
        toast.success('📞 Call complete — response logged in timeline.', { duration: 4000 })
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
        return new Date(iso).toLocaleDateString('en-IN', {
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
        { label: 'Insurance Phone', value: claim.insurancePhone || '—', mono: true },
        { label: 'Claim Amount', value: `₹${claim.claimAmount.toLocaleString()}` },
        { label: 'Days Since Claim', value: `${claim.daysSinceClaim ?? claim.daysPending ?? 0} days` },
        { label: 'Created At', value: formatDate(claim.createdAt) },
    ]

    const trackingItems = [
        { label: 'Follow-ups Done', value: claim.followups_done ?? claim.followUps ?? 0, icon: '🔁' },
        { label: 'Last Follow-up', value: formatDate(claim.last_followup_date || claim.lastFollowUp), icon: '📅' },
        { label: 'Next Follow-up Due', value: formatDate(claim.next_followup_due), icon: '⏰' },
    ]

    return (
        <div style={styles.page}>
            <Navbar onLogout={onLogout} />

            <main style={styles.main}>
                {/* Header */}
                <div style={styles.header}>
                    <button style={styles.backBtn} onClick={() => navigate('/claims')} id="back-to-claims">
                        ← Claims List
                    </button>
                    <div style={styles.titleRow}>
                        <h1 style={styles.heading}>{claim.id}</h1>
                        <PriorityBadge priority={claim.priority} />
                    </div>
                    <p style={styles.subheading}>Patient {claim.patientId} · {claim.insuranceCompany}</p>
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
                    {/* Left column */}
                    <div style={styles.leftCol}>
                        {/* Claim Info */}
                        <div className="glass-card" style={styles.detailCard}>
                            <div style={styles.sectionLabel}>Claim Information</div>
                            <div style={styles.detailGrid}>
                                {details.map(({ label, value, mono }) => (
                                    <div key={label} style={styles.detailItem}>
                                        <div style={styles.detailLabel}>{label}</div>
                                        <div style={{ ...styles.detailValue, ...(mono ? styles.mono : {}) }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Status + Priority */}
                        <div className="glass-card" style={styles.statusCard}>
                            <div style={styles.sectionLabel}>Claim Status</div>
                            <div style={styles.statusRow}>
                                <div style={styles.statusPill(claim.status)}>
                                    {claim.status || 'Submitted'}
                                </div>
                                <PriorityBadge priority={claim.priority} />
                            </div>
                        </div>

                        {/* Follow-up Tracking */}
                        <div className="glass-card" style={styles.trackCard}>
                            <div style={styles.sectionLabel}>Follow-up Tracking</div>
                            <div style={styles.trackGrid}>
                                {trackingItems.map(({ label, value, icon }) => (
                                    <div key={label} style={styles.trackItem}>
                                        <div style={styles.trackIcon}>{icon}</div>
                                        <div>
                                            <div style={styles.trackLabel}>{label}</div>
                                            <div style={styles.trackValue}>{value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Communication Actions */}
                        <div className="glass-card" style={styles.actionsCard}>
                            <div style={styles.sectionLabel}>Communication Actions</div>
                            <div style={styles.actionButtons}>
                                <button
                                    id="send-email-btn"
                                    className="btn btn-primary"
                                    style={styles.actionBtn}
                                    onClick={() => setShowEmailModal(true)}
                                >
                                    📧 Send Email to Insurer
                                </button>
                                <button
                                    id="start-call-btn"
                                    className="btn btn-success"
                                    style={styles.actionBtn}
                                    onClick={() => setShowCallModal(true)}
                                >
                                    📞 Start AI Follow-up Call
                                </button>
                            </div>
                            {claim.emailSent && (
                                <div style={styles.sentNote}>
                                    ✓ Email has been sent to this insurer
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right column — Activity Timeline */}
                    <div style={styles.rightCol}>
                        <div className="glass-card" style={styles.timelineCard}>
                            <div style={{ ...styles.sectionLabel, marginBottom: '1.25rem' }}>
                                <span>Activity Log</span>
                                <span style={styles.logCount}>
                                    {(claim.activity_log || []).length} entries
                                </span>
                            </div>
                            <ActivityTimeline log={claim.activity_log || []} />
                        </div>
                    </div>
                </div>
            </main>

            {/* Email Modal */}
            {showEmailModal && (
                <FollowUpEmailModal
                    claim={claim}
                    userEmail={userEmail}
                    onSend={handleSendEmail}
                    onCancel={() => setShowEmailModal(false)}
                />
            )}

            {/* Call Modal */}
            {showCallModal && (
                <AICallModal
                    claim={claim}
                    onComplete={(res) => { handleCallComplete(res) }}
                    onCancel={() => setShowCallModal(false)}
                />
            )}

            {/* Remove Confirm Modal */}
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
                            <button className="btn btn-secondary" style={{ flex: 1, padding: '0.65rem' }} onClick={() => setShowRemoveConfirm(false)} id="remove-cancel-btn">Cancel</button>
                            <button style={removeModalStyles.removeBtn} onClick={handleRemoveClaim} id="remove-confirm-btn">Remove Claim</button>
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
    main: { flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    header: { animation: 'fadeInUp 0.4s ease both' },
    backBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '0.75rem', fontFamily: 'inherit' },
    titleRow: { display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
    heading: { fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 },
    subheading: { fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.3rem' },
    removeLink: { background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.25rem 0', marginTop: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', transition: 'color 0.2s' },
    layout: { display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.5rem', alignItems: 'start' },
    leftCol: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    rightCol: { position: 'sticky', top: '80px' },
    sectionLabel: { fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    logCount: { fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-indigo-light)', background: 'rgba(99,102,241,0.12)', padding: '2px 10px', borderRadius: '999px' },
    detailCard: { padding: '1.5rem' },
    detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
    detailItem: {},
    detailLabel: { fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' },
    detailValue: { fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, wordBreak: 'break-all' },
    mono: { fontFamily: "'Inter', monospace", color: 'var(--accent-indigo-light)' },
    statusCard: { padding: '1.25rem 1.5rem' },
    statusRow: { display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
    statusPill: (status) => {
        const map = {
            'Submitted': { bg: 'rgba(99,102,241,0.12)', color: 'var(--accent-indigo-light)' },
            'Under Review': { bg: 'rgba(245,158,11,0.12)', color: 'var(--priority-medium)' },
            'Denied': { bg: 'rgba(239,68,68,0.12)', color: 'var(--priority-high)' },
            'Pending Documents': { bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
            'Paid': { bg: 'rgba(34,197,94,0.12)', color: 'var(--success)' },
        }
        const s = map[status] || map['Submitted']
        return { display: 'inline-flex', alignItems: 'center', padding: '5px 14px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600, background: s.bg, color: s.color }
    },
    trackCard: { padding: '1.25rem 1.5rem' },
    trackGrid: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
    trackItem: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    trackIcon: { fontSize: '1.1rem', width: 28, textAlign: 'center' },
    trackLabel: { fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' },
    trackValue: { fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 },
    actionsCard: { padding: '1.25rem 1.5rem' },
    actionButtons: { display: 'flex', flexDirection: 'column', gap: '0.65rem' },
    actionBtn: { width: '100%', justifyContent: 'flex-start', padding: '0.7rem 1.2rem', fontSize: '0.88rem' },
    sentNote: { marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem' },
    timelineCard: { padding: '1.5rem' },
}

/* Timeline styles */
const tl = {
    wrapper: { display: 'flex', flexDirection: 'column' },
    row: { display: 'flex', gap: '1rem' },
    lineCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 },
    dot: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 },
    line: { width: 2, flex: 1, background: 'rgba(255,255,255,0.06)', minHeight: 16, margin: '4px 0' },
    content: { flex: 1, paddingBottom: '1.25rem' },
    topRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' },
    typeBadge: { fontSize: '0.68rem', fontWeight: 700, padding: '2px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em' },
    ts: { fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' },
    desc: { fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 },
    responseQuote: { marginTop: '0.6rem', padding: '0.75rem 1rem', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', fontSize: '0.83rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6 },
    empty: { textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' },
    // call_response styles
    callResponseBlock: { marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    speechText: { padding: '0.75rem 1rem', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '8px', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6 },
    callMeta: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' },
    statusPill: { fontSize: '0.72rem', fontWeight: 700, padding: '2px 12px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.04em' },
    confidencePill: { fontSize: '0.72rem', fontWeight: 600, padding: '2px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.08)' },
    recordingLink: { fontSize: '0.75rem', color: '#22d3ee', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)' },
}

/* Email modal styles */
const modalStyles = {
    overlay: { position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
    modal: { width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeInUp 0.3s ease both' },
    header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' },
    title: { fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 },
    subtitle: { fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' },
    closeBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.2rem 0.4rem', flexShrink: 0, fontFamily: 'inherit' },
    field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
    label: { fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-muted)', textTransform: 'uppercase' },
    readonlyValue: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' },
    emailIcon: { fontSize: '1rem' },
    emailAddr: { fontSize: '0.875rem', color: 'var(--text-primary)', flex: 1 },
    tag: { fontSize: '0.7rem', padding: '2px 10px', borderRadius: '999px', background: 'rgba(99,102,241,0.12)', color: 'var(--accent-indigo-light)', fontWeight: 600 },
    input: { width: '100%' },
    textarea: { width: '100%', resize: 'vertical', minHeight: 220, fontFamily: "'Inter', monospace", fontSize: '0.82rem', lineHeight: 1.7 },
    followUpBadge: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.9rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--accent-indigo-light)' },
    badgeIcon: { fontSize: '1rem' },
    actions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-glass)' },
    cancelBtn: { minWidth: 100 },
    sendBtn: { minWidth: 140 },
}

/* AI Call modal styles */
const callModal = {
    overlay: { position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    box: { maxWidth: 420, width: '90%', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', animation: 'fadeInUp 0.25s ease both', textAlign: 'center' },
    icon: { fontSize: '2.5rem', lineHeight: 1 },
    title: { fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 },
    sub: { fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 },
    hint: { fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 },
    dialRing: { width: 60, height: 60, borderRadius: '50%', border: '3px solid rgba(34,211,238,0.2)', borderTopColor: '#22d3ee', animation: 'spin 1s linear infinite', marginTop: '0.5rem' },
    qBox: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '1rem', marginTop: '0.5rem' },
    qLabel: { fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' },
    qText: { fontSize: '0.9rem', color: 'var(--text-primary)', fontStyle: 'italic', animation: 'fadeIn 0.4s ease both' },
    progressBar: { width: '100%', height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: '999px', overflow: 'hidden', marginTop: '0.5rem' },
    progressFill: { height: '100%', background: 'var(--accent-gradient)', borderRadius: '999px', transition: 'width 0.8s ease' },
    responseBox: { width: '100%', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', padding: '1rem', textAlign: 'left' },
    responseLabel: { fontSize: '0.72rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' },
    responseText: { fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 },
    cancelBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', marginTop: '0.5rem' },
    viaBadge: { fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: '999px', padding: '3px 12px', display: 'flex', alignItems: 'center', gap: '0.35rem' },
    recordingLink: { fontSize: '0.8rem', color: '#22d3ee', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' },
    errorBox: { width: '100%', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '1rem', textAlign: 'left' },
    errorLabel: { fontSize: '0.72rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' },
    errorText: { fontSize: '0.83rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 },
    errorHint: { width: '100%', background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '8px', padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 },
}

/* Remove modal styles */
const removeModalStyles = {
    overlay: { position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    box: { maxWidth: 380, width: '90%', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', animation: 'fadeInUp 0.25s ease both' },
    icon: { fontSize: '2rem', lineHeight: 1 },
    title: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 },
    msg: { textAlign: 'center', fontSize: '0.87rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 },
    actions: { display: 'flex', gap: '0.75rem', marginTop: '0.5rem', width: '100%' },
    removeBtn: { flex: 1, padding: '0.65rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' },
}
