/**
 * start-ngrok.js
 * Starts an ngrok HTTP tunnel on port 3001 and writes the public URL
 * into .env as PUBLIC_BASE_URL, then prints it for manual use.
 *
 * Usage: node start-ngrok.js
 */
const ngrok = require('@ngrok/ngrok')
const fs = require('fs')
const path = require('path')

    ; (async () => {
        console.log('🔗 Starting ngrok tunnel on port 3001…')

        const listener = await ngrok.forward({
            addr: 3001,
            // If you have an ngrok authtoken, set it here or in NGROK_AUTHTOKEN env var
            // authtoken: 'your_ngrok_authtoken',
        })

        const url = listener.url()
        console.log(`✅ ngrok tunnel active: ${url}`)

        // Write the URL into .env
        const envPath = path.join(__dirname, '.env')
        let envContent = fs.readFileSync(envPath, 'utf8')

        if (envContent.includes('PUBLIC_BASE_URL=')) {
            envContent = envContent.replace(
                /PUBLIC_BASE_URL=.*/,
                `PUBLIC_BASE_URL=${url}`
            )
        } else {
            envContent += `\nPUBLIC_BASE_URL=${url}\n`
        }

        fs.writeFileSync(envPath, envContent)
        console.log(`📝 Updated .env: PUBLIC_BASE_URL=${url}`)
        console.log('\n───────────────────────────────────────────────')
        console.log('Now restart the backend in a NEW terminal:')
        console.log('  node server.js')
        console.log('Then open: http://localhost:5173')
        console.log('───────────────────────────────────────────────')
        console.log('\n(Keep this terminal open — ngrok stops when you close it)\n')

        // Keep alive
        await new Promise(() => { })
    })()
