import React from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === 'tr' ? 'en' : 'tr')
  }

  return (
    <div 
      className="language-toggle-container"
    >
      <button
        onClick={toggleLanguage}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          fontFamily: 'inherit',
          fontSize: '18px',
          fontWeight: '900',
          color: '#1f2937',
          padding: '16px 32px',
          borderRadius: '16px',
          cursor: 'pointer',
          transform: 'scale(1)',
          transition: 'all 0.3s ease',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.2)'
          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)'
          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        aria-label="Toggle language"
      >
        {/* Animated gradient overlay for hover */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(-45deg, rgba(238, 119, 82, 0.3), rgba(231, 60, 126, 0.3), rgba(35, 166, 213, 0.3), rgba(35, 213, 171, 0.3))',
            backgroundSize: '400% 400%',
            animation: 'gradient 4s ease infinite',
            opacity: 0,
            transition: 'opacity 0.5s ease',
            borderRadius: '16px'
          }}
          className="hover:opacity-100"
        />
        
        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{
            fontSize: '20px',
            fontWeight: '900',
            transition: 'all 0.3s ease',
            color: '#1f2937',
            opacity: language === 'tr' ? 1 : 0.6,
            transform: language === 'tr' ? 'scale(1.1)' : 'scale(0.9)'
          }}>
            TR
          </span>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(31, 41, 55, 0.5)' }} />
          
          <span style={{
            fontSize: '20px',
            fontWeight: '900',
            transition: 'all 0.3s ease',
            color: '#1f2937',
            opacity: language === 'en' ? 1 : 0.6,
            transform: language === 'en' ? 'scale(1.1)' : 'scale(0.9)'
          }}>
            EN
          </span>
          
          <div style={{ marginLeft: '8px', display: 'flex', gap: '4px' }}>
            <div style={{
              width: '4px',
              height: '4px',
              backgroundColor: '#1f2937',
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }} />
            <div style={{
              width: '4px',
              height: '4px',
              backgroundColor: 'rgba(31, 41, 55, 0.7)',
              borderRadius: '50%',
              animation: 'pulse 2s infinite 0.5s'
            }} />
          </div>
        </div>
        
        {/* Shine effect */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            transform: 'skewX(-12deg)',
            transition: 'left 1s ease'
          }}
          className="hover:left-full"
        />
      </button>
    </div>
  )
}
