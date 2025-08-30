// Import TTF fonts as raw base64 using Vite's ?base64 suffix
import RegularB64 from './NotoSans-Regular.ttf?base64'
import BoldB64 from './NotoSans-Bold.ttf?base64'

// Also import as URLs for fallback
import RegularUrl from './NotoSans-Regular.ttf?url'
import BoldUrl from './NotoSans-Bold.ttf?url'

// Debug: Log import results immediately
console.log('Font import debug:', {
  RegularB64Type: typeof RegularB64,
  RegularB64Length: RegularB64?.length || 0,
  RegularB64Sample: RegularB64?.substring(0, 50) || 'undefined',
  BoldB64Type: typeof BoldB64,
  BoldB64Length: BoldB64?.length || 0,
  BoldB64Sample: BoldB64?.substring(0, 50) || 'undefined',
  RegularUrlType: typeof RegularUrl,
  RegularUrl: RegularUrl,
  BoldUrlType: typeof BoldUrl,
  BoldUrl: BoldUrl
})

export const NotoSansRegularBase64 = RegularB64
export const NotoSansBoldBase64 = BoldB64
export const NotoSansRegularUrl = RegularUrl
export const NotoSansBoldUrl = BoldUrl
