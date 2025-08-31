import jsPDF from 'jspdf'

// Generate unique ID for quotation
export const generateQuotationId = (): string => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const time = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0')
  return `GS${year}${month}${day}${time}`
}

// Simple barcode generation for Code128
export const generateBarcode = (text: string): string => {
  // Simplified barcode pattern - each character represented by bars
  const patterns: { [key: string]: string } = {
    '0': '11011001100', '1': '11001101100', '2': '11001100110', '3': '10010011000',
    '4': '10010001100', '5': '10001001100', '6': '10011001000', '7': '10011000100',
    '8': '10001100100', '9': '11001001000', 'A': '11001000100', 'B': '11000100100',
    'C': '10110011100', 'D': '10011011100', 'E': '10011001110', 'F': '10111001000',
    'G': '10011101000', 'H': '10011100100', 'S': '11011100100'
  }
  
  let barcode = '11010010000' // Start pattern
  for (const char of text) {
    barcode += patterns[char] || patterns['0']
  }
  barcode += '1100011101011' // Stop pattern
  return barcode
}

// Draw barcode on PDF
export const drawBarcode = (doc: jsPDF, text: string, x: number, y: number, width: number, height: number) => {
  const barcode = generateBarcode(text)
  const barWidth = width / barcode.length
  
  doc.setFillColor(0, 0, 0)
  let currentX = x
  
  for (let i = 0; i < barcode.length; i++) {
    if (barcode[i] === '1') {
      doc.rect(currentX, y, barWidth, height, 'F')
    }
    currentX += barWidth
  }
}

// Load logo image and convert to base64
export const loadLogo = async (): Promise<string | null> => {
  try {
    const response = await fetch('/logogs.png')
    if (!response.ok) {
      console.log('❌ Logo not found at /logogs.png')
      return null
    }
    
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        const base64Data = base64.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.log('❌ Failed to load logo:', err)
    return null
  }
}

// Data interfaces for comprehensive PDF export
export interface DepthGroupData {
  derinlik: number
  mtul: number
  birimFiyati: number
  toplamFiyat: number
}

export interface PanelGroupData {
  metrekare: number
  birimFiyati: number
  toplamFiyat: number
}

export interface DavlumbazGroupData {
  metrekare: number
  birimFiyati: number
  toplamFiyat: number
}

export interface SupurgelikData {
  tip: string
  mtul: number
  birimFiyati: number
  toplamFiyat: number
}

export interface EviyeData {
  tip: string
  toplamFiyat: number
}

export interface SpecialDetailData {
  tip: string
  mtul: number
  birimFiyati: number
  toplamFiyat: number
}

export interface LaborServiceItem {
  name: string
  isActive: boolean
  price: number
}

export interface LaborData {
  services: LaborServiceItem[]
  totalPrice: number
}

export interface DiscountData {
  totalListDiscount: number
  depthPanelDiscount: number
}

export interface QuotationData {
  // Basic Information
  firma: string
  musteri: string
  mimar: string
  tarih: string
  product: string
  color: string
  height: string
  price: number
  stoneType?: string // From Google Sheets column F
  currency?: string // From Google Sheets column G
  
  // Groups
  depthGroups?: DepthGroupData[]
  panelGroups?: PanelGroupData[]
  davlumbazGroups?: DavlumbazGroupData[]
  
  // Services
  supurgelik?: SupurgelikData
  eviye?: EviyeData
  specialDetail?: SpecialDetailData
  labor?: LaborData
  
  // Pricing
  discounts?: DiscountData
  totalPrice?: number
  finalPrice?: number
}

// Generate filename with timestamp
export const generatePDFFilename = (quotationId: string): string => {
  const now = new Date()
  const shortDate = now.getFullYear().toString().slice(-2) + 
                   (now.getMonth() + 1).toString().padStart(2, '0') + 
                   now.getDate().toString().padStart(2, '0')
  const shortTime = now.getHours().toString().padStart(2, '0') + 
                   now.getMinutes().toString().padStart(2, '0')
  return `GS_${shortDate}_${shortTime}_${quotationId}.pdf`
}

// Handle PDF output (download or open in new tab)
export const outputPDF = (doc: jsPDF, quotationId: string, openInNewTab: boolean = false) => {
  const pdfBlob = doc.output('blob')

  if (openInNewTab) {
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.location.href = pdfUrl
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000)
  } else {
    const filename = generatePDFFilename(quotationId)
    doc.save(filename)
  }
}
