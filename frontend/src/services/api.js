/* ===================================================================
   api.js — Service layer for backend communication

   Currently uses localStorage + mock logic so the frontend runs
   standalone.  When a real backend is available, replace the fetch
   URLs and remove the mock helpers.
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
    // Simulated ML model: combines amount & age of claim
    const score = (claimAmount / 1000) * 0.4 + daysPending * 0.6
    if (score > 30) return 'High'
    if (score > 12) return 'Medium'
    return 'Low'
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/* ---------- Public API ---------- */

/**
 * POST equivalent — Generate a new claim.
 * Simulates backend ML prediction and DB insert.
 */
export async function generateClaim({ patientId, claimAmount, daysPending, insuranceCompany, insuranceEmail }) {
    await sleep(600) // simulate network latency

    claimCounter += 1
    localStorage.setItem('rcm_claim_counter', String(claimCounter))

    const priority = predictPriority(Number(claimAmount), Number(daysPending))

    const newClaim = {
        id: `CLM-${claimCounter}`,
        patientId,
        claimAmount: Number(claimAmount),
        daysPending: Number(daysPending),
        insuranceCompany,
        insuranceEmail,
        priority,
        createdAt: new Date().toISOString(),
        emailSent: false,
        followUps: 0,
        lastFollowUp: null,
    }

    const claims = getStoredClaims()
    claims.unshift(newClaim)
    saveStoredClaims(claims)

    return newClaim
}

/**
 * GET equivalent — Retrieve all claims.
 */
export async function getClaims() {
    await sleep(300)
    return getStoredClaims()
}

/**
 * GET equivalent — Retrieve a single claim by ID.
 */
export async function getClaimById(id) {
    await sleep(250)
    const claims = getStoredClaims()
    const claim = claims.find(c => c.id === id)
    if (!claim) throw new Error(`Claim ${id} not found`)
    return claim
}

/**
 * POST equivalent — Send follow-up email for a claim.
 */
export async function sendEmail(claimId) {
    await sleep(800) // simulate email sending

    const claims = getStoredClaims()
    const idx = claims.findIndex(c => c.id === claimId)
    if (idx === -1) throw new Error('Claim not found')

    claims[idx].emailSent = true
    saveStoredClaims(claims)

    return { success: true, message: `Email sent to ${claims[idx].insuranceEmail}` }
}

/**
 * POST equivalent — Add a manual follow-up note to a claim.
 */
export async function addFollowUp(claimId) {
    await sleep(400)

    const claims = getStoredClaims()
    const idx = claims.findIndex(c => c.id === claimId)
    if (idx === -1) throw new Error('Claim not found')

    claims[idx].followUps = (claims[idx].followUps || 0) + 1
    claims[idx].lastFollowUp = new Date().toISOString()
    saveStoredClaims(claims)

    return { success: true, followUps: claims[idx].followUps, lastFollowUp: claims[idx].lastFollowUp }
}
