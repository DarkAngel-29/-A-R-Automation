/* ===================================================================
   api.js — Service layer for backend communication

   Uses localStorage + mock logic so the frontend runs standalone.
   All claim mutations also maintain an activity_log array on each claim.
   =================================================================== */

const STORAGE_KEY = 'rcm_claims'
let claimCounter = parseInt(localStorage.getItem('rcm_claim_counter') || '1000', 10)

/* ---------- Helpers ---------- */
function getStoredClaims() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    } catch {
        return []
    }
}

function saveStoredClaims(claims) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(claims))
}

function predictPriority(claimAmount, daysPending) {
    const score = (claimAmount / 1000) * 0.4 + daysPending * 0.6
    if (score > 30) return 'High'
    if (score > 12) return 'Medium'
    return 'Low'
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function makeLogEntry(type, description, extra = {}) {
    return {
        interaction_type: type,
        description,
        timestamp: new Date().toISOString(),
        ...extra,
    }
}

/* ---------- Public API ---------- */

/**
 * POST — Generate a new claim with activity log initialized.
 */
export async function generateClaim({ patientId, claimAmount, daysPending, insuranceCompany, insuranceEmail, insurancePhone }) {
    await sleep(600)

    claimCounter += 1
    localStorage.setItem('rcm_claim_counter', String(claimCounter))

    const priority = predictPriority(Number(claimAmount), Number(daysPending))
    const now = new Date().toISOString()
    const nextDue = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

    const newClaim = {
        id: `CLM-${claimCounter}`,
        patientId,
        claimAmount: Number(claimAmount),
        daysPending: Number(daysPending),
        insuranceCompany,
        insuranceEmail,
        insurancePhone: insurancePhone || '',
        priority,
        status: 'Submitted',
        createdAt: now,
        emailSent: false,
        followUps: 0,
        lastFollowUp: null,
        followups_done: 0,
        last_followup_date: null,
        next_followup_due: nextDue,
        activity_log: [
            makeLogEntry('system', 'Claim created and submitted for processing'),
        ],
    }

    const claims = getStoredClaims()
    claims.unshift(newClaim)
    saveStoredClaims(claims)

    return newClaim
}

/**
 * GET — Retrieve all claims.
 */
export async function getClaims() {
    await sleep(300)
    return getStoredClaims()
}

/**
 * GET — Retrieve a single claim by ID.
 */
export async function getClaimById(id) {
    await sleep(250)
    const claims = getStoredClaims()
    const claim = claims.find(c => c.id === id)
    if (!claim) throw new Error(`Claim ${id} not found`)
    // Ensure legacy claims without activity_log get an empty array
    if (!claim.activity_log) claim.activity_log = []
    return claim
}

/**
 * Append an activity log entry to a claim in localStorage.
 */
export async function addActivityLog(claimId, entry) {
    await sleep(50)
    const claims = getStoredClaims()
    const idx = claims.findIndex(c => c.id === claimId)
    if (idx === -1) throw new Error('Claim not found')
    if (!claims[idx].activity_log) claims[idx].activity_log = []
    const logEntry = makeLogEntry(entry.type, entry.description, entry.extra || {})
    claims[idx].activity_log.push(logEntry)
    saveStoredClaims(claims)
    return logEntry
}

/**
 * POST — Send a real follow-up email via the Node.js backend.
 * Also logs an 'email' activity entry on the claim.
 */
export async function sendEmail(claimId, emailData) {
    let response
    try {
        response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                claimId,
                to: emailData.to,
                subject: emailData.subject,
                body: emailData.body,
            }),
        })
    } catch {
        throw new Error(
            'Cannot reach email server. Make sure the backend is running:\n  cd backend && node server.js'
        )
    }

    let data = {}
    try {
        data = await response.json()
    } catch {
        throw new Error(
            `Email server returned an unexpected response (status ${response.status}). ` +
            'Is the backend running on port 3001?'
        )
    }

    if (!response.ok) {
        throw new Error(data.error || `Server error ${response.status}: Failed to send email`)
    }

    // Update localStorage
    const claims = getStoredClaims()
    const idx = claims.findIndex(c => c.id === claimId)
    if (idx !== -1) {
        claims[idx].emailSent = true
        claims[idx].followUps = (claims[idx].followUps || 0) + 1
        claims[idx].followups_done = (claims[idx].followups_done || 0) + 1
        claims[idx].last_followup_date = new Date().toISOString()
        claims[idx].lastFollowUp = data.lastFollowUp || new Date().toISOString()
        claims[idx].next_followup_due = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

        // Log the email activity
        if (!claims[idx].activity_log) claims[idx].activity_log = []
        claims[idx].activity_log.push(
            makeLogEntry('email', `Follow-up email sent to ${emailData.to} — Subject: "${emailData.subject}"`)
        )
        saveStoredClaims(claims)

        return {
            success: true,
            message: `Email sent to ${emailData.to}`,
            followUps: claims[idx].followUps,
            lastFollowUp: claims[idx].lastFollowUp,
            next_followup_due: claims[idx].next_followup_due,
            activity_log: claims[idx].activity_log,
        }
    }

    return { success: true, ...data }
}

/**
 * Initiate a real Twilio automated follow-up call.
 * Falls back to simulation if Twilio backend is not configured.
 */
export async function logCall(claimId) {
    // Read claim to get phone number
    const claims = getStoredClaims()
    const idx = claims.findIndex(c => c.id === claimId)
    if (idx === -1) throw new Error('Claim not found')

    const claim = claims[idx]
    if (!claim.activity_log) claim.activity_log = []

    // Log call initiation immediately
    const callEntry = makeLogEntry('call', `Automated AI follow-up call initiated to ${claim.insuranceCompany}${claim.insurancePhone ? ` (${claim.insurancePhone})` : ''}`)
    claim.activity_log.push(callEntry)
    claim.followups_done = (claim.followups_done || 0) + 1
    claim.last_followup_date = new Date().toISOString()
    claim.next_followup_due = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    saveStoredClaims(claims)

    // Try real Twilio backend first
    if (claim.insurancePhone) {
        try {
            const res = await fetch('/api/twilio-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    claimId: claim.id,
                    to: claim.insurancePhone,
                    patientId: claim.patientId,
                    claimAmount: claim.claimAmount,
                    insuranceCompany: claim.insuranceCompany,
                    priority: claim.priority,
                }),
            })

            if (res.ok) {
                const data = await res.json()
                // Poll for call completion (max 90s)
                const result = await pollCallResult(claimId, data.callSid)
                // Update localStorage with structured call_response log entry
                const freshClaims = getStoredClaims()
                const freshIdx = freshClaims.findIndex(c => c.id === claimId)
                if (freshIdx !== -1) {
                    if (result.transcription) {
                        freshClaims[freshIdx].activity_log.push(
                            makeLogEntry('call_response', 'Insurance response captured via Twilio automated call', {
                                response_text: result.transcription,
                                interpreted_status: result.interpretedStatus || 'Unknown',
                                recording_url: result.recordingUrl || null,
                                confidence: result.confidence ? `${(result.confidence * 100).toFixed(0)}%` : null,
                            })
                        )
                        // Auto-update claim status if a clear status was interpreted
                        if (result.interpretedStatus && result.interpretedStatus !== 'Unknown') {
                            freshClaims[freshIdx].status = result.interpretedStatus
                        }
                        saveStoredClaims(freshClaims)
                    }
                }
                return {
                    success: true,
                    response_text: result.transcription || 'Call completed — awaiting transcription.',
                    recording_url: result.recordingUrl || null,
                    interpreted_status: result.interpretedStatus || null,
                    confidence: result.confidence || null,
                    activity_log: freshClaims[freshIdx]?.activity_log || claim.activity_log,
                    next_followup_due: claim.next_followup_due,
                    via: 'twilio',
                }
            } else {
                // Twilio returned an error (e.g. unverified number on trial account)
                const errData = await res.json().catch(() => ({}))
                const msg = errData.error || `Twilio error (HTTP ${res.status})`
                throw new Error(msg)
            }
        } catch (err) {
            // Only fall through to simulation for genuine network failures
            // Re-throw Twilio API errors so the UI can show them
            if (err.message && !err.message.includes('fetch')) {
                throw err
            }
            // fetch() itself failed (backend down) — fall through to simulation
        }
    }

    // ── Fallback: simulate call (no phone number or backend unavailable) ──
    await sleep(5000)
    const responses = {
        High: `Thank you for calling regarding claim ${claimId}. This is a high-priority case and has been escalated to our senior review team. A decision is expected within 2 business days.`,
        Medium: `We have received your follow-up for claim ${claimId}. The claim is currently under standard review and will be processed within 5–7 business days.`,
        Low: `Thank you for your inquiry about claim ${claimId}. The claim is in our processing queue. Estimated completion is within 10–14 business days.`,
    }
    const responseText = responses[claim.priority] || responses.Medium

    const freshClaims = getStoredClaims()
    const freshIdx = freshClaims.findIndex(c => c.id === claimId)
    if (freshIdx !== -1) {
        freshClaims[freshIdx].activity_log.push(
            makeLogEntry('response', 'Insurance response recorded (simulated — no phone number configured)', {
                response_text: responseText,
            })
        )
        saveStoredClaims(freshClaims)
    }

    return {
        success: true,
        response_text: responseText,
        activity_log: freshClaims[freshIdx]?.activity_log || claim.activity_log,
        next_followup_due: claim.next_followup_due,
        via: 'simulation',
    }
}

/**
 * Poll backend every 3s for Twilio call completion (recording + transcription).
 * Times out after 90s.
 */
async function pollCallResult(claimId, callSid, timeoutMs = 90000) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
        await sleep(3000)
        try {
            const res = await fetch(`/api/twilio-status/${callSid}`)
            if (res.ok) {
                const data = await res.json()
                if (data.status === 'completed') return data
            }
        } catch {
            // keep polling
        }
    }
    return { status: 'timeout', transcription: 'Call timed out — recording may still be processing.', recordingUrl: null }
}

/**
 * POST — Add a manual follow-up note to a claim.
 */
export async function addFollowUp(claimId) {
    await sleep(400)

    const claims = getStoredClaims()
    const idx = claims.findIndex(c => c.id === claimId)
    if (idx === -1) throw new Error('Claim not found')

    claims[idx].followUps = (claims[idx].followUps || 0) + 1
    claims[idx].followups_done = (claims[idx].followups_done || 0) + 1
    claims[idx].lastFollowUp = new Date().toISOString()
    claims[idx].last_followup_date = claims[idx].lastFollowUp
    claims[idx].next_followup_due = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    saveStoredClaims(claims)

    return {
        success: true,
        followUps: claims[idx].followUps,
        lastFollowUp: claims[idx].lastFollowUp,
    }
}

/**
 * DELETE — Remove a claim by ID from localStorage.
 */
export async function deleteClaim(claimId) {
    await sleep(200)
    const claims = getStoredClaims()
    const filtered = claims.filter(c => c.id !== claimId)
    if (filtered.length === claims.length) throw new Error(`Claim ${claimId} not found`)
    saveStoredClaims(filtered)
    return { success: true }
}
