/**
 * start-tunnel.js
 * Starts a Cloudflare Quick Tunnel on port 3001 (no auth needed),
 * auto-updates .env with the new PUBLIC_BASE_URL, then restarts server.js.
 *
 * Usage:  node start-tunnel.js
 */
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const ENV_PATH = path.join(__dirname, '.env')

function updateEnv(url) {
    let content = fs.readFileSync(ENV_PATH, 'utf8')
    if (content.includes('PUBLIC_BASE_URL=')) {
        content = content.replace(/PUBLIC_BASE_URL=.*/, `PUBLIC_BASE_URL=${url}`)
    } else {
        content += `\nPUBLIC_BASE_URL=${url}\n`
    }
    fs.writeFileSync(ENV_PATH, content)
    console.log(`📝 .env updated: PUBLIC_BASE_URL=${url}`)
}

let serverProcess = null

function startServer() {
    if (serverProcess) {
        serverProcess.kill()
        console.log('🔄 Restarting backend server...')
    } else {
        console.log('🚀 Starting backend server...')
    }
    serverProcess = spawn('node', ['server.js'], {
        cwd: __dirname,
        stdio: 'inherit',
        env: { ...process.env },
    })
    serverProcess.on('exit', (code) => {
        if (code !== null) console.log(`⚠️  server.js exited (code ${code})`)
    })
}

console.log('🌐 Starting Cloudflare Quick Tunnel on port 3001...')
console.log('   (No authentication required — free Cloudflare tunnel)')

// Use cloudflared via npx — spawns a quick tunnel
const tunnel = spawn('npx', ['-y', 'cloudflared', 'tunnel', '--url', 'http://localhost:3001'], {
    cwd: __dirname,
    shell: true,
})

let urlFound = false

function parseLine(line) {
    // Cloudflare prints the URL in a line like:
    //   https://xxxx.trycloudflare.com
    const match = line.match(/https:\/\/[a-z0-9\-]+\.trycloudflare\.com/)
    if (match && !urlFound) {
        urlFound = true
        const url = match[0].trim()
        console.log(`\n✅ Tunnel active: ${url}`)
        updateEnv(url)
        // Small delay so .env is flushed before server reads it
        setTimeout(startServer, 500)
    }
}

tunnel.stdout.on('data', (d) => {
    process.stdout.write(d)
    d.toString().split('\n').forEach(parseLine)
})

tunnel.stderr.on('data', (d) => {
    const text = d.toString()
    process.stderr.write(d)
    text.split('\n').forEach(parseLine)
})

tunnel.on('exit', (code) => {
    console.error(`\n❌ Cloudflare tunnel exited (code ${code}). Restart with: node start-tunnel.js`)
    if (serverProcess) serverProcess.kill()
    process.exit(1)
})

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...')
    if (serverProcess) serverProcess.kill()
    tunnel.kill()
    process.exit(0)
})

console.log('⏳ Waiting for tunnel URL...\n')
