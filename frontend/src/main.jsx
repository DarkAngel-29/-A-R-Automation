import React from 'react'
import ReactDOM from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import App from './App.jsx'
import './index.css'

const redirectUri = window.location.origin + '/dashboard'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Auth0Provider
            domain="dev-yhe0us32zitgzf0w.us.auth0.com"
            clientId="DKeMk46KiURXVKIlGYR9qTPObTkjYSXm"
            redirectUri={redirectUri}
        >
            <App />
        </Auth0Provider>
    </React.StrictMode>,
)
