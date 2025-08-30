import type { ReactNode } from 'react'

interface NoTranslateProps {
  children: ReactNode
  className?: string
}

// Component to prevent translation of product names, colors, etc.
export const NoTranslate: React.FC<NoTranslateProps> = ({ children, className }) => {
  return (
    <span translate="no" className={className}>
      {children}
    </span>
  )
}
