import jsPDF from 'jspdf'
import {
  generateQuotationId,
  drawBarcode,
  loadLogo,
  outputPDF,
  type QuotationData
} from './pdfUtils'

// Setup custom font for Turkish support
const setupFont = async (doc: jsPDF): Promise<boolean> => {
  const fontName = 'Roboto'
  const fontFile = 'Roboto-Regular.ttf'
  
  try {
    // Check if already in session storage
    const fontBase64 = window.sessionStorage.getItem(fontName)
    
    if (!fontBase64) {
      throw new Error('Font not found in cache')
    }

    // Embed the custom font into THIS document instance
    doc.addFileToVFS(fontFile, fontBase64)
    doc.addFont(fontFile, fontName, 'normal')
    
    // Debug: Check what fonts are available
    console.log('📋 Available fonts in jsPDF:', (doc as any).getFontList())
    
    // Test if we can actually use the font without warnings
    try {
      doc.setFont(fontName)
      console.log('✅ Font set successfully in jsPDF for this document')
    } catch (fontErr) {
      console.log('❌ Cannot set font in jsPDF:', fontErr)
      return false
    }

    // Test Turkish characters - but don't fail if this gives warnings
    const testDoc = new jsPDF()
    testDoc.addFileToVFS(fontFile, fontBase64)
    testDoc.addFont(fontFile, fontName, 'normal')
    testDoc.setFont(fontName)
    testDoc.text('Şöğü test', 10, 10)

    console.log('✅ Font embedded in PDF document successfully')
    return true
  } catch (err) {
    console.log('❌ Font embedding failed:', err)
    return false
  }
}

// Safe text rendering with font fallback
function safeText(
  doc: jsPDF,
  hasFont: boolean,
  text: string,
  x: number,
  y: number,
  options?: any
) {
  if (hasFont) {
    // Use custom font for Turkish support - ignore the jsPDF warnings
    try {
      doc.setFont('Roboto')
      doc.text(text, x, y, options as any)
    } catch (err) {
      // If custom font fails, fall back to default
      doc.setFont('helvetica')
      doc.text(text, x, y, options as any)
    }
  } else {
    // Use default font for ASCII only
    doc.setFont('helvetica')
    doc.text(text, x, y, options as any)
  }
}

// Data interfaces moved to pdfUtils.ts to avoid duplication

export const generateQuotationPDF = async (data: QuotationData, openInNewTab = false) => {
  console.log('PDF Generation - Input Data:', data)

  // Special Detail option translations (Turkish only for pdfService_new)
  const translateSpecialDetailForPdf = (option: string): string => {
    const specialDetailTranslations: { [key: string]: string } = {
      'PİRAMİT': 'PİRAMİT',
      'Profil': 'Profil',
      'Hera': 'Hera',
      'Hera Klasik': 'Hera Klasik',
      'Trio': 'Trio',
      'Country': 'Country',
      'Balık Sırtı': 'Balık Sırtı',
      'M20': 'M20',
      'MQ40': 'MQ40',
      'U40': 'U40'
    }
    
    return specialDetailTranslations[option] || option
  }

  const doc = new jsPDF('portrait', 'mm', 'a4')
  const hasFont = await setupFont(doc)
  const logoBase64 = await loadLogo()
  const quotationId = generateQuotationId()

  console.log(`📋 PDF Generation Mode: ${hasFont ? 'Roboto (Turkish support)' : 'Helvetica (ASCII fallback)'}`)
  console.log(`📋 Quotation ID: ${quotationId}`)

  // Flowing layout constants for A4 portrait
  const MARGIN_LEFT = 20
  const MARGIN_RIGHT = 20
  const PAGE_TOP = 20
  const PAGE_BOTTOM_SAFE = 285 // ~297mm - bottom margin
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
    ensureRoom(8)
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, title, MARGIN_LEFT, y)
    y += 4
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.2)
    doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
    y += 4
  }

  // Header with ID and Barcode (start of flowing layout)
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  safeText(doc, hasFont, `ID: ${quotationId}`, MARGIN_LEFT, y)
  
  // Date at top right
  const displayDate = data.tarih || new Date().toLocaleDateString('tr-TR')
  safeText(doc, hasFont, displayDate, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
  y += 5
  
  // Draw barcode below the ID
  drawBarcode(doc, quotationId, MARGIN_LEFT, y, 25, 4)
  y += 8

  // Logo Section
  if (logoBase64) {
    try {
      ensureRoom(20)
      doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 75, y, 60, 15)
      y += 20
      console.log('✅ Logo added to PDF')
    } catch (err) {
      console.log('❌ Failed to add logo, using text fallback:', err)
      ensureRoom(10)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(24)
      safeText(doc, hasFont, 'Granitstone', 105, y, { align: 'center' })
      y += 15
    }
  } else {
    ensureRoom(10)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(24)
    safeText(doc, hasFont, 'Granitstone', 105, y, { align: 'center' })
    y += 15
  }

  // Horizontal line under header
  ensureRoom(5)
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(50, y, 160, y)
  y += 8

  // Title
  ensureRoom(10)
  doc.setFontSize(14)
  doc.setTextColor(100, 100, 100)
  safeText(doc, hasFont, 'Teklif', 105, y, { align: 'center' })
  y += 15

  // Customer Information Section
  drawSectionHeader('Müşteri Bilgileri')
  
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  
  if (data.firma) {
    ensureRoom(6)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, 'Firma', MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.firma, MARGIN_LEFT + 25, y)
    y += 6
  }
  
  if (data.musteri) {
    ensureRoom(6)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, 'Müşteri', MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.musteri, MARGIN_LEFT + 25, y)
    y += 6
  }
  
  if (data.mimar) {
    ensureRoom(6)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, 'Mimar', MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.mimar, MARGIN_LEFT + 25, y)
    y += 6
  }

  y += 5

  // Product Information Section
  drawSectionHeader('Ürün Detayları')
  
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  
  if (data.product) {
    ensureRoom(6)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, 'Ürün', MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.product, MARGIN_LEFT + 25, y)
    y += 6
  }
  
  if (data.color) {
    ensureRoom(6)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, 'Renk', MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.color, MARGIN_LEFT + 25, y)
    y += 6
  }
  
  if (data.height) {
    ensureRoom(6)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, 'Kalınlık', MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.height, MARGIN_LEFT + 25, y)
    y += 6
  }
  
  if (data.price && data.price > 0) {
    ensureRoom(6)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, 'M² Fiyat', MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, `${data.price.toLocaleString('tr-TR')} TL`, MARGIN_LEFT + 25, y)
    y += 6
  }

  y += 5

  // Depth Groups Section
  if (data.depthGroups && data.depthGroups.length > 0) {
    drawSectionHeader('Derinlik Grupları')
    
    // Table headers
    ensureRoom(8)
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, 'Derinlik', MARGIN_LEFT, y)
    safeText(doc, hasFont, 'M²', MARGIN_LEFT + 45, y)
    safeText(doc, hasFont, 'Birim', MARGIN_LEFT + 75, y)
    safeText(doc, hasFont, 'Toplam', MARGIN_LEFT + 105, y)
    y += 6
    
    doc.setFontSize(7)
    doc.setTextColor(0, 0, 0)
    data.depthGroups.forEach(group => {
      ensureRoom(5)
      safeText(doc, hasFont, `${group.derinlik} cm'e kadar`, MARGIN_LEFT, y)
      safeText(doc, hasFont, group.mtul.toString(), MARGIN_LEFT + 45, y)
      safeText(doc, hasFont, group.birimFiyati.toLocaleString('tr-TR'), MARGIN_LEFT + 75, y)
      safeText(doc, hasFont, group.toplamFiyat.toLocaleString('tr-TR'), MARGIN_LEFT + 105, y)
      y += 5
    })
    y += 5
  }

  // Panel Groups Section
  if (data.panelGroups && data.panelGroups.length > 0) {
    drawSectionHeader('Panel Grupları')
    
    // Table headers
    ensureRoom(8)
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, 'M²', MARGIN_LEFT, y)
    safeText(doc, hasFont, 'Birim', MARGIN_LEFT + 45, y)
    safeText(doc, hasFont, 'Toplam', MARGIN_LEFT + 75, y)
    y += 6
    
    doc.setFontSize(7)
    doc.setTextColor(0, 0, 0)
    data.panelGroups.forEach(group => {
      ensureRoom(5)
      safeText(doc, hasFont, group.metrekare.toString(), MARGIN_LEFT, y)
      safeText(doc, hasFont, group.birimFiyati.toLocaleString('tr-TR'), MARGIN_LEFT + 45, y)
      safeText(doc, hasFont, group.toplamFiyat.toLocaleString('tr-TR'), MARGIN_LEFT + 75, y)
      y += 5
    })
    y += 5
  }

  // Davlumbaz Groups Section
  if (data.davlumbazGroups && data.davlumbazGroups.length > 0) {
    drawSectionHeader('Davlumbaz Grupları')
    
    // Table headers
    ensureRoom(8)
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, 'M²', MARGIN_LEFT, y)
    safeText(doc, hasFont, 'Birim', MARGIN_LEFT + 45, y)
    safeText(doc, hasFont, 'Toplam', MARGIN_LEFT + 75, y)
    y += 6
    
    doc.setFontSize(7)
    doc.setTextColor(0, 0, 0)
    data.davlumbazGroups.forEach(group => {
      ensureRoom(5)
      safeText(doc, hasFont, group.metrekare.toString(), MARGIN_LEFT, y)
      safeText(doc, hasFont, group.birimFiyati.toLocaleString('tr-TR'), MARGIN_LEFT + 45, y)
      safeText(doc, hasFont, group.toplamFiyat.toLocaleString('tr-TR'), MARGIN_LEFT + 75, y)
      y += 5
    })
    y += 5
  }

  // Services Section
  const hasServices = data.supurgelik || data.eviye || data.specialDetail
  if (hasServices) {
    drawSectionHeader('Hizmetler')
    
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    
    if (data.supurgelik) {
      ensureRoom(6)
      safeText(doc, hasFont, 'Süpürgelik:', MARGIN_LEFT, y)
      safeText(doc, hasFont, `${data.supurgelik.tip} - ${data.supurgelik.toplamFiyat.toLocaleString('tr-TR')}`, MARGIN_LEFT + 30, y)
      y += 6
    }
    
    if (data.eviye) {
      ensureRoom(6)
      safeText(doc, hasFont, 'Eviye:', MARGIN_LEFT, y)
      safeText(doc, hasFont, `${data.eviye.tip} - ${data.eviye.toplamFiyat.toLocaleString('tr-TR')}`, MARGIN_LEFT + 30, y)
      y += 6
    }
    
    if (data.specialDetail) {
      ensureRoom(6)
      safeText(doc, hasFont, 'Özel Detay:', MARGIN_LEFT, y)
      const translatedDetail = translateSpecialDetailForPdf(data.specialDetail.tip)
      safeText(doc, hasFont, `${translatedDetail} - ${data.specialDetail.toplamFiyat.toLocaleString('tr-TR')}`, MARGIN_LEFT + 30, y)
      y += 6
    }
    
    y += 5
  }

  // Labor Section
  if (data.labor && data.labor.services.some(s => s.isActive)) {
    drawSectionHeader('İşçilik Hizmetleri')
    
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    
    data.labor.services.forEach(service => {
      if (service.isActive) {
        ensureRoom(5)
        safeText(doc, hasFont, service.name, MARGIN_LEFT, y)
        y += 5
      }
    })
    y += 5
  }

  // Discounts Section
  if (data.discounts && (data.discounts.totalListDiscount > 0 || data.discounts.depthPanelDiscount > 0)) {
    drawSectionHeader('İndirimler')
    
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    
    if (data.discounts.totalListDiscount > 0) {
      ensureRoom(6)
      safeText(doc, hasFont, 'Toplam Liste İndirimi:', MARGIN_LEFT, y)
      safeText(doc, hasFont, `%${data.discounts.totalListDiscount}`, MARGIN_LEFT + 60, y)
      y += 6
    }
    
    if (data.discounts.depthPanelDiscount > 0) {
      ensureRoom(6)
      safeText(doc, hasFont, 'Derinlik/Panel İndirimi:', MARGIN_LEFT, y)
      safeText(doc, hasFont, `%${data.discounts.depthPanelDiscount}`, MARGIN_LEFT + 60, y)
      y += 6
    }
    
    y += 5
  }

  // Totals Section
  ensureRoom(15)
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
  y += 8

  if (data.finalPrice && data.finalPrice > 0) {
    doc.setFontSize(12)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, 'TOPLAM FİYAT (KDV DAHİL)', MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    safeText(doc, hasFont, `${data.finalPrice.toLocaleString('tr-TR')} TL`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
  } else if (data.totalPrice && data.totalPrice > 0) {
    doc.setFontSize(12)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, 'TOPLAM FİYAT (KDV HARİÇ)', MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    safeText(doc, hasFont, `${data.totalPrice.toLocaleString('tr-TR')} TL`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
  }
  y += 15

  // Notes Section
  drawSectionHeader('Teklif Notları')
  
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  const notes = [
    '• Fiyata montaj ve İstanbul içi nakliye dahildir.',
    '• Teklif geçerlilik süresi 5 iş günüdür.',
    '• İmalat ve malzeme programına alabilmemiz için lütfen onaylayınız.'
  ]
  
  notes.forEach(line => { 
    ensureRoom(5)
    safeText(doc, hasFont, line, MARGIN_LEFT, y)
    y += 5 
  })
  y += 5

  // Contact Information
  drawSectionHeader('İletişim')
  
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
  
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  safeText(doc, hasFont, 'Granitstone 2025', 105, y, { align: 'center' })

  // Output using shared utility
  outputPDF(doc, quotationId, openInNewTab)
}
