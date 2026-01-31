import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BRANDING } from './config/branding'

// Set dynamic title
document.title = `${BRANDING.companyName} | Portale Comunicazione`;

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
