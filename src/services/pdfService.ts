import jsPDF from 'jspdf'

// Generate unique ID for quotation
const generateQuotationId = (): string => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const time = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0')
  return `GS${year}${month}${day}${time}`
}

// Simple barcode generation for Code128
const generateBarcode = (text: string): string => {
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
const drawBarcode = (doc: jsPDF, text: string, x: number, y: number, width: number, height: number) => {
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
const loadLogo = async (): Promise<string | null> => {
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

// Setup fonts and headers with proper Turkish support
async function setupFont(doc: jsPDF): Promise<boolean> {
  try {
    // Load Roboto font for Turkish character support
    const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf'
    const fontName = 'Roboto'
    const fontFile = `${fontName}.ttf`

    // Check if font is already cached
    const cachedFont = window.sessionStorage.getItem(fontName)
    
    if (cachedFont) {
      // Use cached font
      doc.addFileToVFS(fontFile, cachedFont)
      doc.addFont(fontFile, fontName, 'normal')
      doc.setFont(fontName, 'normal')
      doc.setFontSize(10)
      return true
    } else {
      // Load font from CDN
      const response = await fetch(fontUrl)
      const blob = await response.blob()
      
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onload = () => {
          const base64 = reader.result?.toString().split(',')[1]
          if (base64) {
            // Cache the font for future use
            window.sessionStorage.setItem(fontName, base64)
            
            // Add font to PDF
            doc.addFileToVFS(fontFile, base64)
            doc.addFont(fontFile, fontName, 'normal')
            doc.setFont(fontName, 'normal')
            doc.setFontSize(10)
            resolve(true)
          } else {
            // Fallback to default font
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            resolve(false)
          }
        }
        reader.onerror = () => {
          // Fallback to default font
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          resolve(false)
        }
      })
    }
  } catch (error) {
    console.warn('Font loading failed, using default font:', error)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    return false
  }
}

// Safe text rendering with proper Turkish font support
function safeText(
  doc: jsPDF,
  hasFont: boolean,
  text: string,
  x: number,
  y: number,
  options?: any
) {
  if (hasFont) {
    // Use Roboto font for Turkish support
    try {
      doc.setFont('Roboto', 'normal')
      doc.text(text, x, y, options as any)
    } catch (err) {
      // If Roboto font fails, fall back to default with character replacement
      doc.setFont('helvetica', 'normal')
      const turkishText = text
        .replace(/ğ/g, 'g')
        .replace(/Ğ/g, 'G')
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'I')
        .replace(/ö/g, 'o')
        .replace(/Ö/g, 'O')
        .replace(/ş/g, 's')
        .replace(/Ş/g, 'S')
        .replace(/ü/g, 'u')
        .replace(/Ü/g, 'U')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'C')
      doc.text(turkishText, x, y, options as any)
    }
  } else {
    // No Turkish font available - use character replacement
    doc.setFont('helvetica', 'normal')
    const turkishText = text
      .replace(/ğ/g, 'g')
      .replace(/Ğ/g, 'G')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'I')
      .replace(/ö/g, 'o')
      .replace(/Ö/g, 'O')
      .replace(/ş/g, 's')
      .replace(/Ş/g, 'S')
      .replace(/ü/g, 'u')
      .replace(/Ü/g, 'U')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C')
    doc.text(turkishText, x, y, options as any)
  }
}

// Safe font setting helper
function safeSetFont(
  doc: jsPDF,
  hasFont: boolean,
  style: 'normal' | 'bold' = 'normal'
) {
  if (hasFont) {
    try {
      doc.setFont('Roboto', style)
    } catch (err) {
      doc.setFont('helvetica', style)
    }
  } else {
    doc.setFont('helvetica', style)
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

export const generateQuotationPDF = async (data: QuotationData, openInNewTab = false, language: 'tr' | 'en' = 'tr') => {
  console.log('PDF Generation - Input Data:', data)

  // PDF text translations
  const translations = {
    tr: {
      // Header
      quotation: 'Teklif',
      offer: 'TEKLİF',
      
      // Basic info
      company: 'Firma',
      customer: 'Müşteri', 
      architect: 'Mimar',
      date: 'TARİH',
      product: 'Ürün',
      color: 'Renk',
      thickness: 'Kalınlık',
      price: 'Fiyat',
      
      // Sections
      customerInfo: 'Müşteri Bilgileri',
      productDetails: 'Ürün Detayları',
      depthGroups: 'Derinlik Grupları',
      panelGroups: 'Panel Grupları',
      hoodGroups: 'Davlumbaz Panel Grupları',
      services: 'Hizmetler',
      laborServices: 'İşçilikler',
      discounts: 'İndirimler',
      priceDetails: 'Fiyat Detayları',
      quotationNotes: 'Teklif Notları',
      contact: 'İletişim',
      
      // Depth/Service labels
      depth: 'Derinlik',
      upTo: 'cm\'e kadar',
      baseboard: 'Süpürgelik',
      sink: 'Eviye',
      specialDetail: 'Özel Detay',
      
      // Fields
      mtul: 'MTÜL',
      m2: 'M²',
      unitPrice: 'Birim Fiyatı',
      totalPrice: 'Toplam Fiyat',
      unit: 'Birim',
      total: 'Toplam',
      depthTotal: 'Derinlik Toplam',
      panelTotal: 'Panel Toplam',
      hoodTotal: 'Davlumbaz Panel Toplam',
      mtulPrice: 'MTÜL Fiyat',
      
      // Pricing
      listPrice: 'Liste Fiyatı',
      discount: 'İskonto',
      discountedPrice: 'İskontoulu Fiyat',
      vat: 'KDV',
      grandTotal: 'Genel Toplam',
      
      // Notes
      note1: '• Fiyata montaj İstanbul içi nakliye dahildir.',
      note2: '• Tezgah taşıyıcı demir konstrüksüyonu imalatı ve montajı fiyata dahil değildir.',
      note3: '• Renk ve detay farklılıkları fiyata yansıtılır.',
      note4: '• Teklif proje üzerinden hazırlanmış olup, imalat ölçüsüne göre değişiklik gösterebilir. Herhangi bir yaptırımı yoktur.',
      note5: '• Teklif geçerlilik süresi 5 iş günüdür.',
      note6: '• İmalat ve malzeme programına alabilmemiz için lütfen onaylayınız.'
    },
    en: {
      // Header
      quotation: 'Quotation',
      offer: 'QUOTATION',
      
      // Basic info
      company: 'Company',
      customer: 'Customer',
      architect: 'Architect', 
      date: 'DATE',
      product: 'Product',
      color: 'Color',
      thickness: 'Thickness',
      price: 'Price',
      
      // Sections
      customerInfo: 'Customer Information',
      productDetails: 'Product Details',
      depthGroups: 'Depth Groups',
      panelGroups: 'Panel Groups',
      hoodGroups: 'Hood Groups',
      services: 'Services',
      laborServices: 'Labor',
      discounts: 'Discounts',
      priceDetails: 'Price Details',
      quotationNotes: 'Quotation Notes',
      contact: 'Contact',
      
      // Depth/Service labels
      depth: 'Depth',
      upTo: 'up to cm',
      baseboard: 'Baseboard',
      sink: 'Sink',
      specialDetail: 'Special Detail',
      
      // Fields
      mtul: 'L.M',
      m2: 'M²',
      unitPrice: 'Unit Price',
      totalPrice: 'Total Price',
      unit: 'Unit',
      total: 'Total',
      depthTotal: 'Depth Total',
      panelTotal: 'Panel Total',
      hoodTotal: 'Hood Total',
      mtulPrice: 'L.Meter Price',
      
      // Pricing
      listPrice: 'List Price',
      discount: 'Discount',
      discountedPrice: 'Discounted Price',
      vat: 'VAT',
      grandTotal: 'Grand Total',
      
      // Notes
      note1: '• Installation and delivery within Istanbul are included in the price.',
      note2: '• Countertop support steel construction manufacturing and installation are not included in the price.',
      note3: '• Color and detail differences will be reflected in the price.',
      note4: '• The quotation is prepared based on the project and may vary according to manufacturing measurements. It has no enforcement.',
      note5: '• Quotation validity period is 5 business days.',
      note6: '• Please confirm for production and material scheduling.'
    }
  }
  
  const t = translations[language]
  
  // Labor service translations
  const laborTranslations: { [key: string]: string } = {
    'TEZGAHA SIFIR EVİYE İŞÇİLİK': language === 'en' ? 'COUNTERTOP FLUSH SINK LABOR' : 'TEZGAHA SIFIR EVİYE İŞÇİLİK',
    'TEZGAHA SIFIR OCAK İŞÇİLİK': language === 'en' ? 'COUNTERTOP FLUSH STOVE LABOR' : 'TEZGAHA SIFIR OCAK İŞÇİLİK',
    'SU DAMLALIĞI TAKIM FİYATI': language === 'en' ? 'WATER DRIP SET PRICE' : 'SU DAMLALIĞI TAKIM FİYATI',
    'ÜSTTEN EVİYE MONTAJ BEDELİ': language === 'en' ? 'TOP SINK INSTALLATION FEE' : 'ÜSTTEN EVİYE MONTAJ BEDELİ',
    'TEZGAH ALTI LAVABO İŞÇİLİK': language === 'en' ? 'UNDER-COUNTER WASHBASIN LABOR' : 'TEZGAH ALTI LAVABO İŞÇİLİK',
    'TEZGAH ALTI EVİYE İŞÇİLİK': language === 'en' ? 'UNDER-COUNTER SINK LABOR' : 'TEZGAH ALTI EVİYE İŞÇİLİK',
    'ÇEYREK DAİRE OVAL İŞÇİLİK': language === 'en' ? 'QUARTER CIRCLE OVAL LABOR' : 'ÇEYREK DAİRE OVAL İŞÇİLİK',
    'YARIM DAİRE OVAL İŞÇİLİK': language === 'en' ? 'HALF CIRCLE OVAL LABOR' : 'YARIM DAİRE OVAL İŞÇİLİK'
  }

  const doc = new jsPDF('portrait', 'mm', 'a4')
  const hasFont = await setupFont(doc)
  const logoBase64 = await loadLogo()
  const quotationId = generateQuotationId()

  console.log(`📋 PDF Generation Mode: ${hasFont ? 'Roboto (Turkish support)' : 'Helvetica (ASCII fallback)'}`)
  console.log(`📋 Quotation ID: ${quotationId}`)

  // Optimized layout constants for A4 portrait (more space efficient)
  const MARGIN_LEFT = 15
  const MARGIN_RIGHT = 15
  const PAGE_TOP = 15
  const PAGE_BOTTOM_SAFE = 290 // ~297mm - reduced bottom margin
  const PAGE_WIDTH = 210
  let y = PAGE_TOP

  // Helper functions for flowing layout
  function ensureRoom(nextBlockHeight: number) {
    if (y + nextBlockHeight > PAGE_BOTTOM_SAFE) {
      doc.addPage()
      y = PAGE_TOP
    }
  }

  function drawSectionHeader(title: string) {
    ensureRoom(6)
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, title, MARGIN_LEFT, y)
    y += 3
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.2)
    doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
    y += 3
  }

  // Header with ID and Barcode (compact header)
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  safeText(doc, hasFont, `ID: ${quotationId}`, MARGIN_LEFT, y)
  
  // Date at top right
  const displayDate = data.tarih || new Date().toLocaleDateString('tr-TR')
  safeText(doc, hasFont, displayDate, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
  y += 4
  
  // Draw barcode below the ID (smaller)
  drawBarcode(doc, quotationId, MARGIN_LEFT, y, 20, 3)
  y += 6

  // Logo Section (more compact)
  if (logoBase64) {
    try {
      ensureRoom(15)
      doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 80, y, 50, 12)
      y += 15
      console.log('✅ Logo added to PDF')
    } catch (err) {
      console.log('❌ Failed to add logo, using text fallback:', err)
      ensureRoom(8)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(20)
      safeText(doc, hasFont, 'Granitstone', 105, y, { align: 'center' })
      y += 12
    }
  } else {
    ensureRoom(8)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(20)
    safeText(doc, hasFont, 'Granitstone', 105, y, { align: 'center' })
    y += 12
  }

  // Horizontal line under header (compact)
  ensureRoom(4)
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(50, y, 160, y)
  y += 6

  // Title (compact)
  ensureRoom(8)
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  safeText(doc, hasFont, t.quotation, 105, y, { align: 'center' })
  y += 10

  // Customer Information Section (ultra compact)
  drawSectionHeader(t.customerInfo)
  
  doc.setFontSize(7)
  doc.setTextColor(0, 0, 0)
  
  if (data.firma) {
    ensureRoom(4)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.company, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.firma, MARGIN_LEFT + 25, y)
    y += 4
  }
  
  if (data.musteri) {
    ensureRoom(4)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.customer, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.musteri, MARGIN_LEFT + 25, y)
    y += 4
  }
  
  if (data.mimar) {
    ensureRoom(4)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.architect, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.mimar, MARGIN_LEFT + 25, y)
    y += 4
  }

  y += 3

  // Product Information Section (compact)
  drawSectionHeader(t.productDetails)
  
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  
  if (data.product) {
    ensureRoom(5)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.product, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.product, MARGIN_LEFT + 25, y)
    y += 5
  }
  
  if (data.color) {
    ensureRoom(5)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.color, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.color, MARGIN_LEFT + 25, y)
    y += 5
  }
  
  if (data.height) {
    ensureRoom(5)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.thickness, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.height, MARGIN_LEFT + 25, y)
    y += 5
  }
  
  if (data.price && data.price > 0) {
    ensureRoom(5)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.mtulPrice, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, `${data.price.toLocaleString('tr-TR')} TL`, MARGIN_LEFT + 25, y)
    y += 5
  }

  y += 3

  // Depth Groups Section (optimized table layout)
  if (data.depthGroups && data.depthGroups.length > 0) {
    drawSectionHeader(t.depthGroups)
    
    // Table headers (more compact with better spacing)
    ensureRoom(6)
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.depth, MARGIN_LEFT, y)
    safeText(doc, hasFont, t.mtul, MARGIN_LEFT + 50, y)
    safeText(doc, hasFont, t.unit, MARGIN_LEFT + 85, y)
    safeText(doc, hasFont, t.total, MARGIN_LEFT + 120, y)
    y += 5
    
    doc.setFontSize(7)
    doc.setTextColor(0, 0, 0)
    let depthTotal = 0
    data.depthGroups.forEach(group => {
      ensureRoom(4)
      safeText(doc, hasFont, `${group.derinlik} ${t.upTo}`, MARGIN_LEFT, y)
      safeText(doc, hasFont, group.mtul.toString(), MARGIN_LEFT + 50, y)
      safeText(doc, hasFont, group.birimFiyati.toLocaleString('tr-TR'), MARGIN_LEFT + 85, y)
      safeText(doc, hasFont, group.toplamFiyat.toLocaleString('tr-TR'), MARGIN_LEFT + 120, y)
      depthTotal += group.toplamFiyat
      y += 4
    })
    
    // Section total (compact)
    if (depthTotal > 0) {
      ensureRoom(6)
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
      y += 3
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      safeText(doc, hasFont, `${t.depthTotal}:`, MARGIN_LEFT, y)
      doc.setTextColor(0, 0, 0)
      safeText(doc, hasFont, `${depthTotal.toLocaleString('tr-TR')} TL`, MARGIN_LEFT + 120, y)
      y += 5
    }
    
    y += 3
  }

  // Panel Groups Section (optimized)
  if (data.panelGroups && data.panelGroups.length > 0) {
    drawSectionHeader(t.panelGroups)
    
    // Table headers (compact)
    ensureRoom(6)
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.m2, MARGIN_LEFT, y)
    safeText(doc, hasFont, t.unit, MARGIN_LEFT + 50, y)
    safeText(doc, hasFont, t.total, MARGIN_LEFT + 85, y)
    y += 5
    
    doc.setFontSize(7)
    doc.setTextColor(0, 0, 0)
    let panelTotal = 0
    data.panelGroups.forEach(group => {
      ensureRoom(4)
      safeText(doc, hasFont, group.metrekare.toString(), MARGIN_LEFT, y)
      safeText(doc, hasFont, group.birimFiyati.toLocaleString('tr-TR'), MARGIN_LEFT + 50, y)
      safeText(doc, hasFont, group.toplamFiyat.toLocaleString('tr-TR'), MARGIN_LEFT + 85, y)
      panelTotal += group.toplamFiyat
      y += 4
    })
    
    // Section total (compact)
    if (panelTotal > 0) {
      ensureRoom(6)
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
      y += 3
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      safeText(doc, hasFont, `${t.panelTotal}:`, MARGIN_LEFT, y)
      doc.setTextColor(0, 0, 0)
      safeText(doc, hasFont, `${panelTotal.toLocaleString('tr-TR')} TL`, MARGIN_LEFT + 85, y)
      y += 5
    }
    
    y += 3
  }

  // Davlumbaz Groups Section (optimized)
  if (data.davlumbazGroups && data.davlumbazGroups.length > 0) {
    drawSectionHeader(t.hoodGroups)
    
    // Table headers (compact)
    ensureRoom(6)
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.m2, MARGIN_LEFT, y)
    safeText(doc, hasFont, t.unit, MARGIN_LEFT + 50, y)
    safeText(doc, hasFont, t.total, MARGIN_LEFT + 85, y)
    y += 5
    
    doc.setFontSize(7)
    doc.setTextColor(0, 0, 0)
    let davlumbazTotal = 0
    data.davlumbazGroups.forEach(group => {
      ensureRoom(4)
      safeText(doc, hasFont, group.metrekare.toString(), MARGIN_LEFT, y)
      safeText(doc, hasFont, group.birimFiyati.toLocaleString('tr-TR'), MARGIN_LEFT + 50, y)
      safeText(doc, hasFont, group.toplamFiyat.toLocaleString('tr-TR'), MARGIN_LEFT + 85, y)
      davlumbazTotal += group.toplamFiyat
      y += 4
    })
    
    // Section total (compact)
    if (davlumbazTotal > 0) {
      ensureRoom(6)
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
      y += 3
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      safeText(doc, hasFont, `${t.hoodTotal}:`, MARGIN_LEFT, y)
      doc.setTextColor(0, 0, 0)
      safeText(doc, hasFont, `${davlumbazTotal.toLocaleString('tr-TR')} TL`, MARGIN_LEFT + 85, y)
      y += 5
    }
    
    y += 3
  }

  // Services Section (compact single-line format)
  const hasServices = data.supurgelik || data.eviye || data.specialDetail
  if (hasServices) {
    drawSectionHeader(t.services)
    
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    
    if (data.supurgelik) {
      ensureRoom(4)
      safeText(doc, hasFont, `${t.baseboard}: ${data.supurgelik.tip}`, MARGIN_LEFT, y)
      safeText(doc, hasFont, `${data.supurgelik.toplamFiyat.toLocaleString('tr-TR')} TL`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      y += 4
    }
    
    if (data.eviye) {
      ensureRoom(4)
      safeText(doc, hasFont, `${t.sink}: ${data.eviye.tip}`, MARGIN_LEFT, y)
      safeText(doc, hasFont, `${data.eviye.toplamFiyat.toLocaleString('tr-TR')} TL`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      y += 4
    }
    
    if (data.specialDetail) {
      ensureRoom(4)
      safeText(doc, hasFont, `${t.specialDetail}: ${data.specialDetail.tip}`, MARGIN_LEFT, y)
      safeText(doc, hasFont, `${data.specialDetail.toplamFiyat.toLocaleString('tr-TR')} TL`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      y += 4
    }
    
    y += 3
  }

  // Labor Section (compact format)
  if (data.labor && data.labor.services.some(s => s.isActive)) {
    drawSectionHeader(t.laborServices)
    
    doc.setFontSize(7)
    doc.setTextColor(0, 0, 0)
    
    data.labor.services.forEach(service => {
      if (service.isActive) {
        ensureRoom(4)
        const translatedName = laborTranslations[service.name] || service.name
        safeText(doc, hasFont, translatedName, MARGIN_LEFT, y)
        safeText(doc, hasFont, `${service.price.toLocaleString('tr-TR')} TL`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
        y += 4
      }
    })
    
    // Labor total (compact)
    if (data.labor.totalPrice > 0) {
      ensureRoom(6)
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
      y += 3
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      safeText(doc, hasFont, 'İşçilik Toplam:', MARGIN_LEFT, y)
      doc.setTextColor(0, 0, 0)
      safeText(doc, hasFont, `${data.labor.totalPrice.toLocaleString('tr-TR')} TL`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      y += 5
    }
    
    y += 3
  }

  // Discounts Section (compact)
  if (data.discounts && (data.discounts.totalListDiscount > 0 || data.discounts.depthPanelDiscount > 0)) {
    drawSectionHeader(t.discounts)
    
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    
    if (data.discounts.totalListDiscount > 0) {
      ensureRoom(4)
      safeText(doc, hasFont, 'Toplam Liste İndirimi:', MARGIN_LEFT, y)
      safeText(doc, hasFont, `%${data.discounts.totalListDiscount}`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      y += 4
    }
    
    if (data.discounts.depthPanelDiscount > 0) {
      ensureRoom(4)
      safeText(doc, hasFont, 'Derinlik/Panel İndirimi:', MARGIN_LEFT, y)
      safeText(doc, hasFont, `%${data.discounts.depthPanelDiscount}`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      y += 4
    }
    
    y += 3
  }

  // Comprehensive Pricing Section
  drawSectionHeader(t.priceDetails)
  
  // Calculate section totals
  const depthTotal = data.depthGroups?.reduce((sum, group) => sum + group.toplamFiyat, 0) || 0
  const panelTotal = data.panelGroups?.reduce((sum, group) => sum + group.toplamFiyat, 0) || 0
  const davlumbazTotal = data.davlumbazGroups?.reduce((sum, group) => sum + group.toplamFiyat, 0) || 0
  const supurgelikTotal = data.supurgelik?.toplamFiyat || 0
  const eviyeTotal = data.eviye?.toplamFiyat || 0
  const specialDetailTotal = data.specialDetail?.toplamFiyat || 0
  const laborTotal = data.labor?.totalPrice || 0
  
  // Base total (before discounts)
  const baseTotal = depthTotal + panelTotal + davlumbazTotal + supurgelikTotal + eviyeTotal + specialDetailTotal + laborTotal
  
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  
  // Show base total
  if (baseTotal > 0) {
    ensureRoom(6)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, `${t.listPrice}:`, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, `${baseTotal.toLocaleString('tr-TR')} TL`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
    y += 6
  }
  
  // Show discounts if any
  let discountedTotal = baseTotal
  if (data.discounts) {
    if (data.discounts.totalListDiscount > 0) {
      const discountAmount = baseTotal * (data.discounts.totalListDiscount / 100)
      ensureRoom(6)
      doc.setTextColor(120, 120, 120)
      safeText(doc, hasFont, `${t.discount} (%${data.discounts.totalListDiscount}):`, MARGIN_LEFT, y)
      doc.setTextColor(200, 0, 0)
      safeText(doc, hasFont, `-${discountAmount.toLocaleString('tr-TR')} TL`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      discountedTotal -= discountAmount
      y += 6
    }
    
    if (data.discounts.depthPanelDiscount > 0) {
      // Calculate the total for depth, panel, davlumbaz, and supurgelik only
      const depthPanelTotal = depthTotal + panelTotal + davlumbazTotal + supurgelikTotal
      const discountAmount = depthPanelTotal * (data.discounts.depthPanelDiscount / 100)
      ensureRoom(6)
      doc.setTextColor(120, 120, 120)
      safeText(doc, hasFont, `${t.discount} (%${data.discounts.depthPanelDiscount}):`, MARGIN_LEFT, y)
      doc.setTextColor(200, 0, 0)
      safeText(doc, hasFont, `-${discountAmount.toLocaleString('tr-TR')} TL`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      discountedTotal -= discountAmount
      y += 6
    }
  }
  
  // Subtotal after discounts
  if (discountedTotal !== baseTotal) {
    ensureRoom(6)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, `${t.discountedPrice}:`, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, `${Math.max(0, discountedTotal).toLocaleString('tr-TR')} TL`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
    y += 6
  }
  
  // KDV calculation (20%)
  const kdvRate = 20
  const kdvAmount = Math.max(0, discountedTotal) * (kdvRate / 100)
  const finalTotal = Math.max(0, discountedTotal) + kdvAmount
  
  ensureRoom(6)
  doc.setTextColor(120, 120, 120)
  safeText(doc, hasFont, `${t.vat} (%${kdvRate}):`, MARGIN_LEFT, y)
  doc.setTextColor(0, 0, 0)
  safeText(doc, hasFont, `${kdvAmount.toLocaleString('tr-TR')} TL`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
  y += 6
  
  // Final total line
  ensureRoom(15)
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
  y += 8
  
  doc.setFontSize(12)
  doc.setTextColor(120, 120, 120)
  safeText(doc, hasFont, `${t.grandTotal.toUpperCase()} (${t.vat} ${language === 'tr' ? 'DAHİL' : 'INCLUDED'}):`, MARGIN_LEFT, y)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  safeSetFont(doc, hasFont, 'bold')
  safeText(doc, hasFont, `${finalTotal.toLocaleString('tr-TR')} TL`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
  safeSetFont(doc, hasFont, 'normal')
  y += 15

  // Notes Section
  drawSectionHeader(t.quotationNotes)
  
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  const notes = [
    t.note1,
    t.note2,
    t.note3,
    t.note4,
    t.note5,
    t.note6
  ]
  
  notes.forEach((line, index) => { 
    ensureRoom(5)
    // Make note5 (index 4) bold
    if (index === 4) {
      safeSetFont(doc, hasFont, 'bold')
      safeText(doc, hasFont, line, MARGIN_LEFT, y)
      safeSetFont(doc, hasFont, 'normal')
    } else {
      safeText(doc, hasFont, line, MARGIN_LEFT, y)
    }
    y += 5 
  })
  y += 5

  // Contact Information
  drawSectionHeader(t.contact)
  
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  
  ensureRoom(10)
  safeText(doc, hasFont, 'Tel: +90 212 648 1832  |  GSM: +90 530 955 5000', MARGIN_LEFT, y)
  y += 5
  safeText(doc, hasFont, 'Adres: Altınşehir Şahintepe Mah., Aşık Veysel Cd. No:103/3, Başakşehir/İSTANBUL', MARGIN_LEFT, y)
  y += 10

  // Footer
  ensureRoom(10)
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.2)
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
  y += 6

  // Output
  const pdfBlob = doc.output('blob')

  if (openInNewTab) {
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.location.href = pdfUrl
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000)
  } else {
    const now = new Date()
    const shortDate = now.getFullYear().toString().slice(-2) + 
                     (now.getMonth() + 1).toString().padStart(2, '0') + 
                     now.getDate().toString().padStart(2, '0')
    const shortTime = now.getHours().toString().padStart(2, '0') + 
                     now.getMinutes().toString().padStart(2, '0')
    const filename = `GS_${shortDate}_${shortTime}_${quotationId}.pdf`
    doc.save(filename)
  }
}
