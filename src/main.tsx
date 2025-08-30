import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './contexts/LanguageContext.tsx'

// Debug logging
console.log('🚀 main.tsx loading...')

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ PWA Service Worker registered:', registration)
      })
      .catch((error) => {
        console.log('❌ PWA Service Worker registration failed:', error)
      })
  })
}

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }
  
  createRoot(rootElement).render(
    <StrictMode>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </StrictMode>,
  )
  console.log('✅ App rendered successfully')
} catch (error) {
  console.error('❌ Error:', error)
  const errorDiv = document.createElement('div')
  errorDiv.innerHTML = `
    <div style="padding: 20px; font-family: Arial; background: #f00; color: white; text-align: center;">
      <h2>Error Loading App</h2>
      <p>${error}</p>
      <p>Check console for details</p>
    </div>
  `
  document.body.appendChild(errorDiv)
}
