// ─────────────────────────────────────────────────────────────
// Health Ledger — Backend (Email + Twilio Calls)
// Express + Nodemailer + Twilio
//
// Endpoints:
//   POST /api/send-email
//   POST /api/twilio-call           — initiates outbound call
//   GET  /api/twiml/:claimId        — TwiML with Gather (speech input)
//   POST /api/twilio-gather/:claimId — receives SpeechResult from Twilio
//   POST /api/twilio-callback/:claimId — call status webhook
//   GET  /api/twilio-status/:callSid   — frontend polls for result
// ─────────────────────────────────────────────────────────────
require('dotenv').config()
const dns = require('dns')
dns.setServers(['8.8.8.8', '8.8.4.4'])  // Use Google DNS — local DNS can't resolve Atlas SRV
const express = require('express')
const nodemailer = require('nodemailer')
const cors = require('cors')
const mongoose = require('mongoose')
const { execFile } = require('child_process')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001

// ── MongoDB connection ────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI

async function connectWithRetry(uri, retries = 3, delayMs = 3000) {
    const opts = {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
    }
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await mongoose.connect(uri, opts)
            console.log('✅ MongoDB connected successfully.')
            return
        } catch (err) {
            const isAuthErr = err.message && err.message.includes('bad auth')
            const isNetworkErr = err.message && (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT') || err.message.includes('ENOTFOUND'))

            if (isAuthErr) {
                console.error('❌ MongoDB AUTH FAILED — wrong username or password in MONGODB_URI.')
                console.error('   → Go to https://cloud.mongodb.com → Database Access → Edit user → Reset password')
                console.error('   → Then update MONGODB_URI in backend/.env with the new password')
                console.error('   Raw error:', err.message)
                break // No point retrying an auth error
            } else if (isNetworkErr) {
                console.error(`❌ MongoDB network error (attempt ${attempt}/${retries}):`, err.message)
                console.error('   → Make sure your IP is whitelisted in Atlas: Network Access → Add IP Address → Allow from Anywhere (0.0.0.0/0)')
                if (attempt < retries) {
                    console.log(`   ⏳ Retrying in ${delayMs / 1000}s...`)
                    await new Promise(r => setTimeout(r, delayMs))
                }
            } else {
                console.error(`❌ MongoDB connection failed (attempt ${attempt}/${retries}):`, err.message)
                if (attempt < retries) {
                    await new Promise(r => setTimeout(r, delayMs))
                }
            }
        }
    }
    console.warn('⚠️  MongoDB unavailable — claim storage will be skipped until connection is fixed.')
}

if (MONGODB_URI) {
    connectWithRetry(MONGODB_URI)
} else {
    console.warn('⚠️  MONGODB_URI not set — claim storage will be skipped.')
}

// ── Claim Mongoose schema ─────────────────────────────────────
const claimSchema = new mongoose.Schema({
    claim_id: { type: String, required: true, unique: true },
    claim_amount: { type: Number, required: true },
    days_pending: { type: Number, required: true },
    followups_done: { type: Number, required: true },
    insurance_company: { type: String, required: true },
    claim_status: { type: String, required: true },
    priority: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
})
const Claim = mongoose.model('Claim', claimSchema)

// ── Twilio client (optional — configured via .env) ────────────
let twilioClient = null
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER
const PUBLIC_URL = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '')

if (TWILIO_SID && TWILIO_TOKEN && TWILIO_SID.startsWith('AC')) {
    try {
        twilioClient = require('twilio')(TWILIO_SID, TWILIO_TOKEN)
        console.log('✅ Twilio client initialised — ready to make calls.')
    } catch (e) {
        console.warn('⚠️  Twilio init failed:', e.message)
    }
} else {
    console.log('ℹ️  Twilio not configured — AI calls will be simulated in the frontend.')
    console.log('   Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, PUBLIC_BASE_URL to .env')
}

// In-memory store for call results (keyed by callSid)
const callResults = {}

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:5173', 'https://api.twilio.com'],
    methods: ['GET', 'POST'],
}))
app.use(express.json())
app.use(express.urlencoded({ extended: false })) // required for Twilio POST webhooks

// localtunnel bypass — prevents browser challenge page from blocking Twilio
app.use((_req, res, next) => {
    res.setHeader('bypass-tunnel-reminder', 'true')
    next()
})

// ── Nodemailer transporter ────────────────────────────────────
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

transporter.verify((err) => {
    if (err) console.error('❌ SMTP connection failed:', err.message)
    else console.log('✅ SMTP connection verified — ready to send emails.')
})

// ── POST /api/send-email ──────────────────────────────────────
app.post('/api/send-email', async (req, res) => {
    const { to, subject, body, claimId, from } = req.body

    if (!to || !subject || !body)
        return res.status(400).json({ success: false, error: 'Missing required fields: to, subject, body' })

    const senderName = process.env.SENDER_NAME || 'Health Ledger RCM Team'
    const replyToAddress = from || process.env.SMTP_USER

    const mailOptions = {
        from: `"${senderName}" <${process.env.SMTP_USER}>`,
        to,
        replyTo: replyToAddress,
        subject,
        text: body,
        html: `<pre style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap;">${body}</pre>`,
    }

    try {
        const info = await transporter.sendMail(mailOptions)
        console.log(`📧 Email sent to ${to} | Message ID: ${info.messageId} | Claim: ${claimId}`)
        res.json({ success: true, message: `Email sent to ${to}`, messageId: info.messageId, lastFollowUp: new Date().toISOString() })
    } catch (err) {
        console.error('❌ Email send failed:', err.message)
        res.status(500).json({ success: false, error: err.message })
    }
})

// ─────────────────────────────────────────────────────────────
// Twilio Call Endpoints
// ─────────────────────────────────────────────────────────────

/**
 * interpretClaimStatus — maps keywords in the spoken response to a
 * normalised claim status string.
 */
function interpretClaimStatus(text) {
    const t = (text || '').toLowerCase()
    if (t.includes('approved') || t.includes('approval')) return 'Approved'
    if (t.includes('denied') || t.includes('rejection')) return 'Denied'
    if (t.includes('under review') || t.includes('review')) return 'Under Review'
    if (t.includes('processing') || t.includes('process')) return 'Processing'
    if (t.includes('pending')) return 'Pending'
    if (t.includes('submitted')) return 'Submitted'
    if (t.includes('closed') || t.includes('settled')) return 'Closed'
    return 'Unknown'
}

// ── POST /api/twilio-call ─────────────────────────────────────
app.post('/api/twilio-call', async (req, res) => {
    const { claimId, to, patientId, claimAmount, insuranceCompany } = req.body

    if (!twilioClient)
        return res.status(503).json({ success: false, error: 'Twilio not configured. Add credentials to .env' })
    if (!to)
        return res.status(400).json({ success: false, error: 'Missing insurance phone number (to)' })
    if (!PUBLIC_URL)
        return res.status(503).json({ success: false, error: 'PUBLIC_BASE_URL not set in .env. Run: npx localtunnel --port 3001' })

    try {
        // Build the TwiML inline — avoids localtunnel blocking Twilio's GET request
        const inlineTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna" language="en-US">
        Hello. This is the hospital billing department calling regarding claim ID ${claimId}.
        We would like to check the current status of this claim.
        Please state the current status, any pending actions, and the expected processing timeline after the beep.
    </Say>
    <Gather
        input="speech"
        action="${PUBLIC_URL}/api/twilio-gather/${claimId}"
        method="POST"
        timeout="10"
        speechTimeout="auto"
        language="en-US"
    >
        <Say voice="Polly.Joanna">Please go ahead after the beep.</Say>
    </Gather>
    <Say voice="Polly.Joanna">We did not receive a response. We will follow up again shortly. Goodbye.</Say>
</Response>`

        const call = await twilioClient.calls.create({
            to,
            from: TWILIO_FROM,
            twiml: inlineTwiml,                                          // ← inline TwiML, no URL fetch needed
            statusCallback: `${PUBLIC_URL}/api/twilio-callback/${claimId}`,
            statusCallbackEvent: ['completed'],
            statusCallbackMethod: 'POST',
            record: true,
            recordingStatusCallback: `${PUBLIC_URL}/api/twilio-recording/${claimId}`,
            recordingStatusCallbackMethod: 'POST',
        })

        console.log(`📞 Twilio call initiated | CallSid: ${call.sid} | To: ${to} | Claim: ${claimId}`)

        callResults[call.sid] = {
            claimId,
            status: 'initiated',
            callSid: call.sid,
            transcription: null,
            interpretedStatus: null,
            recordingUrl: null,
            confidence: null,
            timestamp: new Date().toISOString(),
        }

        res.json({ success: true, callSid: call.sid, status: call.status })
    } catch (err) {
        console.error('❌ Twilio call failed:', err.message)
        res.status(500).json({ success: false, error: err.message })
    }
})

// ── GET /api/twiml/:claimId ───────────────────────────────────
// Twilio fetches TwiML instructions when the call connects.
// Uses <Gather input="speech"> for real-time speech-to-text.
// Falls back to <Record> if Gather times out (no speech detected).
app.get('/api/twiml/:claimId', (req, res) => {
    const { claimId } = req.params
    res.set('Content-Type', 'text/xml')
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna" language="en-US">
        Hello. This is the hospital billing department calling regarding claim ID ${claimId}.
        We would like to check the current status of this claim.
        Please state the current claim status, any pending actions, and expected processing timeline after the beep.
    </Say>
    <Gather
        input="speech"
        action="${PUBLIC_URL}/api/twilio-gather/${claimId}"
        method="POST"
        timeout="10"
        speechTimeout="auto"
        language="en-US"
    >
        <Say voice="Polly.Joanna">Please go ahead after the beep.</Say>
    </Gather>
    <Say voice="Polly.Joanna">We did not receive a response. We will call again shortly. Goodbye.</Say>
</Response>`)
})

// ── POST /api/twilio-gather/:claimId ─────────────────────────
// Twilio sends the SpeechResult here after the caller speaks.
// This is the core speech processing endpoint.
app.post('/api/twilio-gather/:claimId', (req, res) => {
    const { claimId } = req.params
    const {
        SpeechResult,
        Confidence,
        CallSid,
        RecordingUrl,
    } = req.body

    const speechText = SpeechResult || ''
    const confidenceScore = parseFloat(Confidence) || 0
    const interpretedStatus = interpretClaimStatus(speechText)
    const recordingUrl = RecordingUrl ? `${RecordingUrl}.mp3` : null
    const timestamp = new Date().toISOString()

    console.log(`🎤 Speech captured | Claim: ${claimId} | Confidence: ${(confidenceScore * 100).toFixed(0)}%`)
    console.log(`   Speech: "${speechText}"`)
    console.log(`   Interpreted Status: ${interpretedStatus}`)

    // Store result for frontend polling
    if (CallSid && callResults[CallSid]) {
        callResults[CallSid].transcription = speechText
        callResults[CallSid].interpretedStatus = interpretedStatus
        callResults[CallSid].recordingUrl = recordingUrl
        callResults[CallSid].confidence = confidenceScore
        callResults[CallSid].timestamp = timestamp
        callResults[CallSid].status = 'completed'
    }

    // Respond to Twilio with a TwiML thank-you message
    res.set('Content-Type', 'text/xml')
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">
        Thank you for your response. Your reply has been recorded as, ${interpretedStatus}.
        Goodbye.
    </Say>
    <Hangup />
</Response>`)
})

// ── POST /api/twilio-callback/:claimId ───────────────────────
// Twilio posts call completion status here.
app.post('/api/twilio-callback/:claimId', (req, res) => {
    const { claimId } = req.params
    const { CallSid, CallStatus, Duration } = req.body

    console.log(`📞 Call completed | Claim: ${claimId} | Sid: ${CallSid} | Status: ${CallStatus} | Duration: ${Duration}s`)

    if (CallSid && callResults[CallSid]) {
        if (callResults[CallSid].status !== 'completed') {
            callResults[CallSid].status = CallStatus
        }
    }

    res.sendStatus(200)
})

// ── POST /api/twilio-recording/:claimId ──────────────────────
// Twilio posts the recording URL here ~30-60s after the call ends.
// Updates callResults so the frontend can display the recording link.
app.post('/api/twilio-recording/:claimId', (req, res) => {
    const { claimId } = req.params
    const { CallSid, RecordingUrl, RecordingDuration, RecordingSid } = req.body

    const recordingUrl = RecordingUrl ? `${RecordingUrl}.mp3` : null
    console.log(`🎙️  Recording ready | Claim: ${claimId} | Duration: ${RecordingDuration}s | URL: ${recordingUrl}`)

    if (CallSid && callResults[CallSid]) {
        callResults[CallSid].recordingUrl = recordingUrl
        callResults[CallSid].recordingSid = RecordingSid
    }

    res.sendStatus(200)
})

// ── GET /api/twilio-status/:callSid ──────────────────────────
// Frontend polls this endpoint to get the processed call result.
app.get('/api/twilio-status/:callSid', (req, res) => {
    const { callSid } = req.params
    const result = callResults[callSid]

    if (!result) return res.status(404).json({ success: false, error: 'Call not found' })

    res.json({
        success: true,
        callSid,
        claimId: result.claimId,
        status: result.status,
        transcription: result.transcription,
        interpretedStatus: result.interpretedStatus,
        recordingUrl: result.recordingUrl,
        confidence: result.confidence,
        timestamp: result.timestamp,
    })
})

// ─────────────────────────────────────────────────────────────
// ML Prediction Endpoint
// ─────────────────────────────────────────────────────────────

// Path to the Python predict script
const PREDICT_SCRIPT = path.resolve(__dirname, '..', 'model_train', 'model', 'predict.py')

/**
 * POST /api/predict-priority
 * Body: { claim_amount, days_pending, followups_done, insurance_company, claim_status }
 * Returns: { success, claim_id, priority }
 */
app.post('/api/predict-priority', async (req, res) => {
    const { claim_amount, days_pending, followups_done, insurance_company, claim_status } = req.body

    // Validate required fields
    if (claim_amount == null || days_pending == null || followups_done == null || !insurance_company || !claim_status) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: claim_amount, days_pending, followups_done, insurance_company, claim_status',
        })
    }

    const inputJSON = JSON.stringify({ claim_amount, days_pending, followups_done, insurance_company, claim_status })

    // Shell out to Python predict.py
    execFile('python', [PREDICT_SCRIPT, inputJSON], { timeout: 30000 }, async (err, stdout, stderr) => {
        if (err) {
            console.error('❌ Prediction failed:', err.message, stderr)
            return res.status(500).json({ success: false, error: 'Prediction failed: ' + (stderr || err.message) })
        }

        let result
        try {
            result = JSON.parse(stdout.trim())
        } catch (parseErr) {
            console.error('❌ Failed to parse prediction output:', stdout)
            return res.status(500).json({ success: false, error: 'Invalid prediction output' })
        }

        if (result.error) {
            return res.status(500).json({ success: false, error: result.error })
        }

        // Generate claim_id
        const claim_id = 'CLM-' + Date.now()

        // Store in MongoDB (if connected)
        let savedClaim = null
        if (mongoose.connection.readyState === 1) {
            try {
                savedClaim = await Claim.create({
                    claim_id,
                    claim_amount,
                    days_pending,
                    followups_done,
                    insurance_company,
                    claim_status,
                    priority: result.priority,
                })
                console.log(`📋 Claim stored | ${claim_id} | Priority: ${result.priority}`)
            } catch (dbErr) {
                console.error('⚠️  Failed to store claim:', dbErr.message)
            }
        }

        res.json({
            success: true,
            claim_id,
            priority: result.priority,
            stored: !!savedClaim,
        })
    })
})

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'Health Ledger Backend',
        twilio: twilioClient ? 'configured' : 'not configured (simulation mode)',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    })
})

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 Health Ledger backend running at http://localhost:${PORT}`)
    console.log(`   Email:    POST http://localhost:${PORT}/api/send-email`)
    console.log(`   Call:     POST http://localhost:${PORT}/api/twilio-call`)
    console.log(`   Predict:  POST http://localhost:${PORT}/api/predict-priority`)
    console.log(`   Health:   GET  http://localhost:${PORT}/api/health\n`)
})
