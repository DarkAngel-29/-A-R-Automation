// ─────────────────────────────────────────────────────────────
// Health Ledger — Email Backend
// Express + Nodemailer  |  POST /api/send-email
// ─────────────────────────────────────────────────────────────
require('dotenv').config()
const express = require('express')
const nodemailer = require('nodemailer')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3001

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// ── Nodemailer transporter ────────────────────────────────────
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,           // true for port 465, false for 587 (STARTTLS)
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

// Verify SMTP connection on startup
transporter.verify((err) => {
    if (err) {
        console.error('❌ SMTP connection failed:', err.message)
        console.error('   Check your .env credentials (SMTP_USER / SMTP_PASS).')
    } else {
        console.log('✅ SMTP connection verified — ready to send emails.')
    }
})

// ── POST /api/send-email ──────────────────────────────────────
app.post('/api/send-email', async (req, res) => {
    const { to, subject, body, claimId, from } = req.body

    // Basic validation
    if (!to || !subject || !body) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: to, subject, body',
        })
    }

    // Use the logged-in user's email as the Reply-To (so insurer replies to them)
    // The actual sender is always SMTP_USER (required by Gmail/Outlook auth)
    const senderName = process.env.SENDER_NAME || 'Health Ledger RCM Team'
    const replyToAddress = from || process.env.SMTP_USER

    const mailOptions = {
        from: `"${senderName}" <${process.env.SMTP_USER}>`,
        to,
        replyTo: replyToAddress,   // insurer replies to the logged-in user's email
        subject,
        text: body,
        html: `<pre style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap;">${body}</pre>`,
    }

    try {
        const info = await transporter.sendMail(mailOptions)
        console.log(`📧 Email sent to ${to} | Message ID: ${info.messageId} | Claim: ${claimId}`)

        const now = new Date().toISOString()
        res.json({
            success: true,
            message: `Email sent successfully to ${to}`,
            messageId: info.messageId,
            lastFollowUp: now,
        })
    } catch (err) {
        console.error('❌ Email send failed:', err.message)
        res.status(500).json({
            success: false,
            error: err.message,
        })
    }
})

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Health Ledger Email Backend' })
})

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 Health Ledger backend running at http://localhost:${PORT}`)
    console.log(`   Email endpoint: POST http://localhost:${PORT}/api/send-email\n`)
})
