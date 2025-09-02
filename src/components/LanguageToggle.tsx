import React from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { createPortal } from 'react-dom'

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === 'tr' ? 'en' : 'tr')
  }

  return createPortal(
    <div 
      className="language-toggle-container"
    >
      <button
        onClick={toggleLanguage}
        style={{
          background: 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          fontFamily: 'Tahoma, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '12px',
          fontWeight: '600',
          color: 'rgba(0, 0, 0, 0.9)',
          padding: '12px 6px',
          borderRadius: '8px',
          cursor: 'pointer',
          transform: 'scale(1)',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          width: '35px',
          height: '65px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.8,
          zIndex: 99999
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)'
          e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.6)'
          e.currentTarget.style.opacity = '1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
          e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.4)'
          e.currentTarget.style.opacity = '0.8'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
        }}
        aria-label="Toggle language"
      >
        {/* Content */}
        <div style={{ 
          position: 'relative', 
          zIndex: 10, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '4px',
          height: '100%'
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            color: 'rgba(0, 0, 0, 0.9)',
            opacity: language === 'tr' ? 1 : 0.5,
            transform: language === 'tr' ? 'scale(1.1)' : 'scale(0.9)'
          }}>
            TR
          </span>
          
          <div style={{ width: '14px', height: '2px', backgroundColor: 'rgba(0, 0, 0, 0.4)' }} />
          
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            color: 'rgba(0, 0, 0, 0.9)',
            opacity: language === 'en' ? 1 : 0.5,
            transform: language === 'en' ? 'scale(1.1)' : 'scale(0.9)'
          }}>
            EN
          </span>
        </div>
      </button>
    </div>,
    document.body
  )
}
