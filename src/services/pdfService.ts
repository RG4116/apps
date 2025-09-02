import jsPDF from 'jspdf'
import { formatPrice } from "../priceCalculations"
import {
  generateQuotationId,
  drawBarcode,
  loadLogo,
  outputPDF,
  type QuotationData
} from './pdfUtils'

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
// Moved to pdfUtils.ts to avoid duplication

// Estimate total vertical height required for the current data (in mm, unscaled)
function estimateTotalHeight(data: QuotationData) {
  const PAGE_TOP = 15
  let yy = PAGE_TOP
  const adv = (n: number) => { yy += n }

  // Header
  adv(4) // ID / date line
  adv(6) // barcode
  adv(15) // logo
  adv(6) // horizontal rule + gap
  adv(10) // title

  // Customer Info
  adv(6) // section header
  let customerFields = 0
  if (data.firma) customerFields++
  if (data.musteri) customerFields++
  if (data.mimar) customerFields++
  adv(4 * customerFields)
  adv(3)

  // Product Info
  adv(6) // section header
  let productFields = 0
  if (data.product) productFields++
  if (data.color) productFields++
  if (data.height) productFields++
  if (data.price && data.price > 0) productFields++
  adv(5 * productFields)
  adv(3)

  // Depth Groups
  if (data.depthGroups && data.depthGroups.length > 0) {
    adv(6) // header
    adv(5) // table headers
    adv(4 * data.depthGroups.length)
    const depthTotal = data.depthGroups.reduce((s, g) => s + (g.toplamFiyat || 0), 0)
    if (depthTotal > 0) adv(3 + 5) // rule + total row
    adv(3) // gap
  }

  // Panel Groups
  if (data.panelGroups && data.panelGroups.length > 0) {
    adv(6)
    adv(5)
    adv(4 * data.panelGroups.length)
    const panelTotal = data.panelGroups.reduce((s, g) => s + (g.toplamFiyat || 0), 0)
    if (panelTotal > 0) adv(3 + 5)
    adv(3)
  }

  // Hood/Davlumbaz Groups
  if (data.davlumbazGroups && data.davlumbazGroups.length > 0) {
    adv(6)
    adv(5)
    adv(4 * data.davlumbazGroups.length)
    const hoodTotal = data.davlumbazGroups.reduce((s, g) => s + (g.toplamFiyat || 0), 0)
    if (hoodTotal > 0) adv(3 + 5)
    adv(3)
  }

  // Services
  const hasServices = !!(data.supurgelik || data.eviye || data.specialDetail)
  if (hasServices) {
    adv(6)
    let svc = 0
    if (data.supurgelik) svc++
    if (data.eviye) svc++
    if (data.specialDetail) svc++
    adv(4 * svc)
    adv(3)
  }

  // Labor
  const activeLabor = (data.labor?.services || []).filter(s => s.isActive)
  if (activeLabor.length > 0) {
    adv(6)
    adv(4 * activeLabor.length)
    if ((data.labor?.totalPrice || 0) > 0) adv(3 + 5)
    adv(3)
  }

  // Discounts
  if (data.discounts && (data.discounts.totalListDiscount > 0 || data.discounts.depthPanelDiscount > 0)) {
    adv(6)
    if (data.discounts.totalListDiscount > 0) adv(4)
    if (data.discounts.depthPanelDiscount > 0) adv(4)
    adv(3)
  }

  // Price details
  adv(6) // section header
  const depthTotal2 = data.depthGroups?.reduce((sum, g) => sum + g.toplamFiyat, 0) || 0
  const panelTotal2 = data.panelGroups?.reduce((sum, g) => sum + g.toplamFiyat, 0) || 0
  const davlumbazTotal2 = data.davlumbazGroups?.reduce((sum, g) => sum + g.toplamFiyat, 0) || 0
  const supurgelikTotal = data.supurgelik?.toplamFiyat || 0
  const eviyeTotal = data.eviye?.toplamFiyat || 0
  const specialDetailTotal = data.specialDetail?.toplamFiyat || 0
  const laborTotal = data.labor?.totalPrice || 0
  const baseTotal = depthTotal2 + panelTotal2 + davlumbazTotal2 + supurgelikTotal + eviyeTotal + specialDetailTotal + laborTotal
  if (baseTotal > 0) adv(6)
  if (data.discounts?.totalListDiscount && data.discounts.totalListDiscount > 0) adv(6)
  if (data.discounts?.depthPanelDiscount && data.discounts.depthPanelDiscount > 0) adv(6)
  const hasDiscounts = !!((data.discounts?.totalListDiscount || 0) > 0 || (data.discounts?.depthPanelDiscount || 0) > 0)
  if (hasDiscounts) adv(6) // discounted price line
  adv(6) // VAT line
  adv(23) // separator + grand total block

  // Notes
  adv(6) // notes header
  adv(5 * 6) // 6 note lines
  adv(5)

  // Contact
  adv(6) // contact header
  adv(5) // tel
  adv(5) // address
  adv(10) // gap

  // Footer
  adv(6)

  return yy - PAGE_TOP
}

export const generateQuotationPDF = async (data: QuotationData, openInNewTab = false, language: 'tr' | 'en' = 'tr', currency: string = "TRY") => {
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

  // Special Detail option translations
  const translateSpecialDetailForPdf = (option: string): string => {
    const specialDetailTranslations: { [key: string]: string } = {
      'PİRAMİT': language === 'en' ? 'PYRAMID' : 'PİRAMİT',
      'Profil': language === 'en' ? 'Profile' : 'Profil',
      'Hera': language === 'en' ? 'Hera' : 'Hera',
      'Hera Klasik': language === 'en' ? 'Hera Classic' : 'Hera Klasik',
      'Trio': language === 'en' ? 'Trio' : 'Trio',
      'Country': language === 'en' ? 'Country' : 'Country',
      'Balık Sırtı': language === 'en' ? 'Fish Scale' : 'Balık Sırtı',
      'M20': language === 'en' ? 'M20' : 'M20',
      'MQ40': language === 'en' ? 'MQ40' : 'MQ40',
      'U40': language === 'en' ? 'U40' : 'U40'
    }
    
    return specialDetailTranslations[option] || option
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
  const AVAILABLE_HEIGHT = PAGE_BOTTOM_SAFE - PAGE_TOP

  // Compute adaptive scale to force single-page output
  const estimatedHeight = estimateTotalHeight(data)
  const minScale = 0.55 // allow down to ~55% to force-fit
  const scale = Math.max(minScale, Math.min(1, AVAILABLE_HEIGHT / Math.max(estimatedHeight, 1)))

  // Helpers for scaled layout
  let y = PAGE_TOP
  const advance = (n: number) => { y += n * scale }
  const setFS = (n: number) => { doc.setFontSize(Math.max(6, n * scale)) }

  // Override ensureRoom: we now always fit one page by scaling
  function ensureRoom(_nextBlockHeight: number) {
    /* no-op: scaling guarantees fit */
  }

  function drawSectionHeader(title: string) {
    ensureRoom(6 * scale)
    setFS(10)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, title, MARGIN_LEFT, y)
    advance(3)
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.2)
    doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
    advance(3)
  }

  // Header with ID and Barcode (compact header)
  setFS(7)
  doc.setTextColor(100, 100, 100)
  safeText(doc, hasFont, `ID: ${quotationId}`, MARGIN_LEFT, y)
  
  // Date at top right
  const displayDate = data.tarih || new Date().toLocaleDateString('tr-TR')
  safeText(doc, hasFont, displayDate, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
  advance(4)
  
  // Draw barcode below the ID (smaller)
  drawBarcode(doc, quotationId, MARGIN_LEFT, y, 20, 3 * scale)
  advance(6)

  // Logo Section (more compact)
  if (logoBase64) {
    try {
      ensureRoom(15 * scale)
      doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 80, y, 50 * scale, 12 * scale)
      advance(15)
      console.log('✅ Logo added to PDF')
    } catch (err) {
      console.log('❌ Failed to add logo, using text fallback:', err)
      ensureRoom(8 * scale)
      doc.setTextColor(0, 0, 0)
      setFS(20)
      safeText(doc, hasFont, 'Granitstone', 105, y, { align: 'center' })
      advance(12)
    }
  } else {
    ensureRoom(8 * scale)
    doc.setTextColor(0, 0, 0)
    setFS(20)
    safeText(doc, hasFont, 'Granitstone', 105, y, { align: 'center' })
    advance(12)
  }

  // Horizontal line under header (compact)
  ensureRoom(4 * scale)
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(50, y, 160, y)
  advance(6)

  // Title (compact)
  ensureRoom(8 * scale)
  setFS(12)
  doc.setTextColor(100, 100, 100)
  safeText(doc, hasFont, t.quotation, 105, y, { align: 'center' })
  advance(10)

  // Customer Information Section (ultra compact)
  drawSectionHeader(t.customerInfo)
  
  setFS(7)
  doc.setTextColor(0, 0, 0)
  
  if (data.firma) {
    ensureRoom(4 * scale)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.company, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.firma, MARGIN_LEFT + 25, y)
    advance(4)
  }
  
  if (data.musteri) {
    ensureRoom(4 * scale)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.customer, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.musteri, MARGIN_LEFT + 25, y)
    advance(4)
  }
  
  if (data.mimar) {
    ensureRoom(4 * scale)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.architect, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.mimar, MARGIN_LEFT + 25, y)
    advance(4)
  }

  advance(3)

  // Product Information Section (compact)
  drawSectionHeader(t.productDetails)
  
  setFS(8)
  doc.setTextColor(0, 0, 0)
  
  if (data.product) {
    ensureRoom(5 * scale)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.product, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.product, MARGIN_LEFT + 25, y)
    advance(5)
  }
  
  if (data.color) {
    ensureRoom(5 * scale)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.color, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.color, MARGIN_LEFT + 25, y)
    advance(5)
  }
  
  if (data.height) {
    ensureRoom(5 * scale)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.thickness, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, data.height, MARGIN_LEFT + 25, y)
    advance(5)
  }
  
  if (data.price && data.price > 0) {
    ensureRoom(5 * scale)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.mtulPrice, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, formatPrice(data.price, currency), MARGIN_LEFT + 25, y)
    advance(5)
  }

  advance(3)

  // Depth Groups Section (optimized table layout)
  if (data.depthGroups && data.depthGroups.length > 0) {
    drawSectionHeader(t.depthGroups)
    
    // Table headers (more compact with better spacing)
    ensureRoom(6 * scale)
    setFS(7)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.depth, MARGIN_LEFT, y)
    safeText(doc, hasFont, t.mtul, MARGIN_LEFT + 50, y)
    safeText(doc, hasFont, t.unit, MARGIN_LEFT + 85, y)
    safeText(doc, hasFont, t.total, MARGIN_LEFT + 120, y)
    advance(5)
    
    setFS(7)
    doc.setTextColor(0, 0, 0)
    let depthTotal = 0
    data.depthGroups.forEach(group => {
      ensureRoom(4 * scale)
      safeText(doc, hasFont, `${group.derinlik} ${t.upTo}`, MARGIN_LEFT, y)
      safeText(doc, hasFont, group.mtul.toString(), MARGIN_LEFT + 50, y)
      safeText(doc, hasFont, group.birimFiyati.toLocaleString('tr-TR'), MARGIN_LEFT + 85, y)
      safeText(doc, hasFont, group.toplamFiyat.toLocaleString('tr-TR'), MARGIN_LEFT + 120, y)
      depthTotal += group.toplamFiyat
      advance(4)
    })
    
    // Section total (compact)
    if (depthTotal > 0) {
      ensureRoom(6 * scale)
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
      advance(3)
      setFS(8)
      doc.setTextColor(120, 120, 120)
      safeText(doc, hasFont, `${t.depthTotal}:`, MARGIN_LEFT, y)
      doc.setTextColor(0, 0, 0)
      safeText(doc, hasFont, formatPrice(depthTotal, currency), MARGIN_LEFT + 120, y)
      advance(5)
    }
    
    advance(3)
  }

  // Panel Groups Section (optimized)
  if (data.panelGroups && data.panelGroups.length > 0) {
    drawSectionHeader(t.panelGroups)
    
    // Table headers (compact)
    ensureRoom(6 * scale)
    setFS(7)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.m2, MARGIN_LEFT, y)
    safeText(doc, hasFont, t.unit, MARGIN_LEFT + 50, y)
    safeText(doc, hasFont, t.total, MARGIN_LEFT + 85, y)
    advance(5)
    
    setFS(7)
    doc.setTextColor(0, 0, 0)
    let panelTotal = 0
    data.panelGroups.forEach(group => {
      ensureRoom(4 * scale)
      safeText(doc, hasFont, group.metrekare.toString(), MARGIN_LEFT, y)
      safeText(doc, hasFont, group.birimFiyati.toLocaleString('tr-TR'), MARGIN_LEFT + 50, y)
      safeText(doc, hasFont, group.toplamFiyat.toLocaleString('tr-TR'), MARGIN_LEFT + 85, y)
      panelTotal += group.toplamFiyat
      advance(4)
    })
    
    // Section total (compact)
    if (panelTotal > 0) {
      ensureRoom(6 * scale)
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
      advance(3)
      setFS(8)
      doc.setTextColor(120, 120, 120)
      safeText(doc, hasFont, `${t.panelTotal}:`, MARGIN_LEFT, y)
      doc.setTextColor(0, 0, 0)
      safeText(doc, hasFont, formatPrice(panelTotal, currency), MARGIN_LEFT + 85, y)
      advance(5)
    }
    
    advance(3)
  }

  // Davlumbaz Groups Section (optimized)
  if (data.davlumbazGroups && data.davlumbazGroups.length > 0) {
    drawSectionHeader(t.hoodGroups)
    
    // Table headers (compact)
    ensureRoom(6 * scale)
    setFS(7)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, t.m2, MARGIN_LEFT, y)
    safeText(doc, hasFont, t.unit, MARGIN_LEFT + 50, y)
    safeText(doc, hasFont, t.total, MARGIN_LEFT + 85, y)
    advance(5)
    
    setFS(7)
    doc.setTextColor(0, 0, 0)
    let davlumbazTotal = 0
    data.davlumbazGroups.forEach(group => {
      ensureRoom(4 * scale)
      safeText(doc, hasFont, group.metrekare.toString(), MARGIN_LEFT, y)
      safeText(doc, hasFont, group.birimFiyati.toLocaleString('tr-TR'), MARGIN_LEFT + 50, y)
      safeText(doc, hasFont, group.toplamFiyat.toLocaleString('tr-TR'), MARGIN_LEFT + 85, y)
      davlumbazTotal += group.toplamFiyat
      advance(4)
    })
    
    // Section total (compact)
    if (davlumbazTotal > 0) {
      ensureRoom(6 * scale)
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
      advance(3)
      setFS(8)
      doc.setTextColor(120, 120, 120)
      safeText(doc, hasFont, `${t.hoodTotal}:`, MARGIN_LEFT, y)
      doc.setTextColor(0, 0, 0)
      safeText(doc, hasFont, formatPrice(davlumbazTotal, currency), MARGIN_LEFT + 85, y)
      advance(5)
    }
    
    advance(3)
  }

  // Services Section (compact single-line format)
  const hasServices = data.supurgelik || data.eviye || data.specialDetail
  if (hasServices) {
    drawSectionHeader(t.services)
    
    setFS(8)
    doc.setTextColor(0, 0, 0)
    
    if (data.supurgelik) {
      ensureRoom(4 * scale)
      safeText(doc, hasFont, `${t.baseboard}: ${data.supurgelik.tip}`, MARGIN_LEFT, y)
      safeText(doc, hasFont, formatPrice(data.supurgelik.toplamFiyat, currency), PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      advance(4)
    }
    
    if (data.eviye) {
      ensureRoom(4 * scale)
      safeText(doc, hasFont, `${t.sink}: ${data.eviye.tip}`, MARGIN_LEFT, y)
      safeText(doc, hasFont, formatPrice(data.eviye.toplamFiyat, currency), PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      advance(4)
    }
    
    if (data.specialDetail) {
      ensureRoom(4 * scale)
      const translatedDetail = translateSpecialDetailForPdf(data.specialDetail.tip)
      safeText(doc, hasFont, `${t.specialDetail}: ${translatedDetail}`, MARGIN_LEFT, y)
      safeText(doc, hasFont, formatPrice(data.specialDetail.toplamFiyat, currency), PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      advance(4)
    }
    
    advance(3)
  }

  // Labor Section (compact format)
  if (data.labor && data.labor.services.some(s => s.isActive)) {
    drawSectionHeader(t.laborServices)
    
    setFS(7)
    doc.setTextColor(0, 0, 0)
    
    data.labor.services.forEach(service => {
      if (service.isActive) {
        ensureRoom(4 * scale)
        const translatedName = laborTranslations[service.name] || service.name
        safeText(doc, hasFont, translatedName, MARGIN_LEFT, y)
        safeText(doc, hasFont, formatPrice(service.price, currency), PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
        advance(4)
      }
    })
    
    // Labor total (compact)
    if (data.labor.totalPrice > 0) {
      ensureRoom(6 * scale)
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
      advance(3)
      setFS(8)
      doc.setTextColor(120, 120, 120)
      safeText(doc, hasFont, 'İşçilik Toplam:', MARGIN_LEFT, y)
      doc.setTextColor(0, 0, 0)
      safeText(doc, hasFont, formatPrice(data.labor.totalPrice, currency), PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      advance(5)
    }
    
    advance(3)
  }

  // Discounts Section (compact)
  if (data.discounts && (data.discounts.totalListDiscount > 0 || data.discounts.depthPanelDiscount > 0)) {
    drawSectionHeader(t.discounts)
    
    setFS(8)
    doc.setTextColor(0, 0, 0)
    
    if (data.discounts.totalListDiscount > 0) {
      ensureRoom(4 * scale)
      safeText(doc, hasFont, 'Toplam Liste İndirimi:', MARGIN_LEFT, y)
      safeText(doc, hasFont, `%${data.discounts.totalListDiscount}`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      advance(4)
    }
    
    if (data.discounts.depthPanelDiscount > 0) {
      ensureRoom(4 * scale)
      safeText(doc, hasFont, 'Derinlik/Panel İndirimi:', MARGIN_LEFT, y)
      safeText(doc, hasFont, `%${data.discounts.depthPanelDiscount}`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      advance(4)
    }
    
    advance(3)
  }

  // Comprehensive Pricing Section
  drawSectionHeader(t.priceDetails)
  
  // Calculate section totals
  const depthTotal = data.depthGroups?.reduce((sum, group) => sum + group.toplamFiyat, 0) || 0
  const panelTotal = data.panelGroups?.reduce((sum, group) => sum + group.toplamFiyat, 0) || 0
  const davlumbazTotal = data.davlumbazGroups?.reduce((sum, group) => sum + group.toplamFiyat, 0) || 0
  const supurgelikTotal2 = data.supurgelik?.toplamFiyat || 0
  const eviyeTotal2 = data.eviye?.toplamFiyat || 0
  const specialDetailTotal2 = data.specialDetail?.toplamFiyat || 0
  const laborTotal2 = data.labor?.totalPrice || 0
  
  // Base total (before discounts)
  const baseTotal = depthTotal + panelTotal + davlumbazTotal + supurgelikTotal2 + eviyeTotal2 + specialDetailTotal2 + laborTotal2
  
  setFS(9)
  doc.setTextColor(0, 0, 0)
  
  // Show base total
  if (baseTotal > 0) {
    ensureRoom(6 * scale)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, `${t.listPrice}:`, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, `${baseTotal.toLocaleString('tr-TR')} TL`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
    advance(6)
  }
  
  // Show discounts if any
  let discountedTotal = baseTotal
  if (data.discounts) {
    if (data.discounts.totalListDiscount > 0) {
      const discountAmount = baseTotal * (data.discounts.totalListDiscount / 100)
      ensureRoom(6 * scale)
      doc.setTextColor(120, 120, 120)
      safeText(doc, hasFont, `${t.discount} (%${data.discounts.totalListDiscount}):`, MARGIN_LEFT, y)
      doc.setTextColor(200, 0, 0)
      safeText(doc, hasFont, `-${discountAmount.toLocaleString('tr-TR')} TL`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      discountedTotal -= discountAmount
      advance(6)
    }
    
    if (data.discounts.depthPanelDiscount > 0) {
      // Calculate the total for depth, panel, davlumbaz, and supurgelik only
      const depthPanelTotal = depthTotal + panelTotal + davlumbazTotal + supurgelikTotal2
      const discountAmount = depthPanelTotal * (data.discounts.depthPanelDiscount / 100)
      ensureRoom(6 * scale)
      doc.setTextColor(120, 120, 120)
      safeText(doc, hasFont, `${t.discount} (%${data.discounts.depthPanelDiscount}):`, MARGIN_LEFT, y)
      doc.setTextColor(200, 0, 0)
      safeText(doc, hasFont, `-${discountAmount.toLocaleString('tr-TR')} TL`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
      discountedTotal -= discountAmount
      advance(6)
    }
  }
  
  // Subtotal after discounts
  if (discountedTotal !== baseTotal) {
    ensureRoom(6 * scale)
    doc.setTextColor(120, 120, 120)
    safeText(doc, hasFont, `${t.discountedPrice}:`, MARGIN_LEFT, y)
    doc.setTextColor(0, 0, 0)
    safeText(doc, hasFont, formatPrice(Math.max(0, discountedTotal), currency), PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
    advance(6)
  }
  
  // KDV calculation (20%)
  const kdvRate = 20
  const kdvAmount = Math.max(0, discountedTotal) * (kdvRate / 100)
  const finalTotal = Math.max(0, discountedTotal) + kdvAmount
  
  ensureRoom(6 * scale)
  doc.setTextColor(120, 120, 120)
  safeText(doc, hasFont, `${t.vat} (%${kdvRate}):`, MARGIN_LEFT, y)
  doc.setTextColor(0, 0, 0)
  safeText(doc, hasFont, formatPrice(kdvAmount, currency), PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
  advance(6)
  
  // Final total line
  ensureRoom(15 * scale)
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
  advance(8)
  
  setFS(12)
  doc.setTextColor(120, 120, 120)
  safeText(doc, hasFont, `${t.grandTotal.toUpperCase()} (${t.vat} ${language === 'tr' ? 'DAHİL' : 'INCLUDED'}):`, MARGIN_LEFT, y)
  doc.setTextColor(0, 0, 0)
  setFS(14)
  safeSetFont(doc, hasFont, 'bold')
  safeText(doc, hasFont, formatPrice(finalTotal, currency), PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
  safeSetFont(doc, hasFont, 'normal')
  advance(15)

  // Notes Section
  drawSectionHeader(t.quotationNotes)
  
  setFS(7)
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
    ensureRoom(5 * scale)
    // Make note5 (index 4) bold
    if (index === 4) {
      safeSetFont(doc, hasFont, 'bold')
      safeText(doc, hasFont, line, MARGIN_LEFT, y)
      safeSetFont(doc, hasFont, 'normal')
    } else {
      safeText(doc, hasFont, line, MARGIN_LEFT, y)
    }
    advance(5) 
  })
  advance(5)

  // Contact Information
  drawSectionHeader(t.contact)
  
  setFS(8)
  doc.setTextColor(100, 100, 100)
  
  ensureRoom(10 * scale)
  safeText(doc, hasFont, 'Tel: +90 212 648 1832  |  GSM: +90 530 955 5000', MARGIN_LEFT, y)
  advance(5)
  safeText(doc, hasFont, 'Adres: Altınşehir Şahintepe Mah., Aşık Veysel Cd. No:103/3, Başakşehir/İSTANBUL', MARGIN_LEFT, y)
  advance(10)

  // Footer
  ensureRoom(10 * scale)
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.2)
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
  advance(6)

  // Output using shared utility
  outputPDF(doc, quotationId, openInNewTab)
}
