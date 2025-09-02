import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

// Supported languages
export type Language = 'tr' | 'en'

// Translation keys interface
export interface Translations {
  // Common
  reset: string
  download: string
  open: string
  
  // Form labels
  firma: string
  musteri: string
  mimar: string
  tarih: string
  urun: string
  urunSeciniz: string
  yukleniyor: string
  renk: string
  renkSeciniz: string
  onceUrunSeciniz: string
  renkBulunamadi: string
  tezgahKalinlik: string
  onceRenkSeciniz: string
  kalinlikSeciniz: string
  fiyat: string
  
  // Sections
  derinlik: string
  derinlikField: string
  seciniz: string
  iskontoPlus: string
  iskontoFiyat: string
  
  // Special sections
  ozelOnDetay: string
  detaySecimi: string
  ozelUretimEviye: string
  eviyeSecimi: string
  eviyeToplam: string
  lutfenSecin: string
  iscilikHizmetleri: string
  iscilikToplam: string
  
  // Labor services
  tezgahaSifirEviye: string
  tezgahaSifirOcak: string
  suDamlalik: string
  ustten: string
  tezgahAltLavabo: string
  tezgahAltEviye: string
  ceyrekDaire: string
  yarimDaire: string
  
  // Placeholders
  firmaPlaceholder: string
  musteriPlaceholder: string
  mimarPlaceholder: string
  tarihPlaceholder: string
  
  // Depth options
  depth61: string
  depth65: string
  depth70: string
  depth80: string
  depth90: string
  depth100: string
  panel: string
  davlumbaz: string
  supurgelik: string
  eviye: string
  specialDetail: string
  labor: string
  
  // Fields
  mtul: string
  metrekare: string
  birimFiyati: string
  toplamFiyat: string
  
  // Placeholders
  selectProduct: string
  selectColor: string
  selectThickness: string
  selectFirst: string
  loading: string
  
  // Actions
  ekle: string
  
  // Pricing
  listeFiyati: string
  iskonto: string
  iskontoluFiyat: string
  kdv: string
  genelToplam: string
  
  // PDF
  downloadPdf: string
  openPdf: string
  
  // Numbers and counters
  depthCounter: string
  panelCounter: string
  davlumbazCounter: string
  
  // Special Detail Options
  piramit: string
  piramitM20: string
  piramitMQ40: string
  piramitU40: string
  profil: string
  hera: string
  heraKlasik: string
  trio: string
  country: string
  balikSirti: string
  m20: string
  mq40: string
  u40: string
}

// Translation data
const translations: Record<Language, Translations> = {
  tr: {
    // Common
    reset: 'Formu Sıfırla',
    download: 'İndir',
    open: 'Aç',
    
    // Form labels
    firma: 'FİRMA / BAYİ',
    musteri: 'MÜŞTERİ',
    mimar: 'MİMAR',
    tarih: 'TARİH',
    urun: 'ÜRÜN',
    urunSeciniz: 'ÜRÜN SEÇİNİZ',
    yukleniyor: 'Yükleniyor...',
    renk: 'RENK',
    renkSeciniz: 'RENK SEÇİNİZ',
    onceUrunSeciniz: 'ÖNCE ÜRÜN SEÇİNİZ',
    renkBulunamadi: 'Bu ürün için renk bulunamadı',
    tezgahKalinlik: 'TEZGAH ÖN KALINLIK (h)',
    onceRenkSeciniz: 'ÖNCE RENK SEÇİNİZ',
    kalinlikSeciniz: 'KALINLIK SEÇİNİZ',
    fiyat: 'FİYAT',
    
    // Sections
    derinlik: 'PROJEDE KAÇ FARKLI DERİNLİK VAR?',
    derinlikField: 'DERİNLİK',
    seciniz: 'Seçiniz',
    iskontoPlus: '(+) İSKONTO (%)',
    iskontoFiyat: 'İSKONTOLU FİYAT',
    
    // Special sections
    ozelOnDetay: 'ÖZEL ÖN DETAY',
    detaySecimi: 'DETAY SEÇİMİ',
    ozelUretimEviye: 'ÖZEL ÜRETİM ENTEGRE EVYE',
    eviyeSecimi: 'EVİYE SEÇİMİ',
    eviyeToplam: 'EVYE TOPLAM FİYAT',
    lutfenSecin: 'Lütfen Seçin',
    iscilikHizmetleri: 'İŞÇİLİKLER',
    iscilikToplam: 'İŞÇİLİK TOPLAM FİYAT',
    
    // Labor services
    tezgahaSifirEviye: 'TEZGAHA SIFIR EVİYE İŞÇİLİK',
    tezgahaSifirOcak: 'TEZGAHA SIFIR OCAK İŞÇİLİK', 
    suDamlalik: 'SU DAMLALIĞI TAKIM FİYATI',
    ustten: 'ÜSTTEN EVİYE MONTAJ BEDELİ',
    tezgahAltLavabo: 'TEZGAH ALTI LAVABO İŞÇİLİK',
    tezgahAltEviye: 'TEZGAH ALTI EVİYE İŞÇİLİK',
    ceyrekDaire: 'ÇEYREK DAİRE OVAL İŞÇİLİK',
    yarimDaire: 'YARIM DAİRE OVAL İŞÇİLİK',
    
    // Placeholders
    firmaPlaceholder: 'FİRMA / BAYİ',
    musteriPlaceholder: 'MÜŞTERİ',
    mimarPlaceholder: 'MİMAR',
    tarihPlaceholder: 'DD/MM/YYYY',
    
    // Depth options
    depth61: "61 cm'e kadar",
    depth65: "65 cm'e kadar",
    depth70: '70 cm',
    depth80: '80 cm',
    depth90: '90 cm',
    depth100: '100 cm',
    panel: 'PANEL EKLE',
    davlumbaz: 'DAVLUMBAZ PANEL',
    supurgelik: 'SÜPÜRGELİK',
    eviye: 'ÖZEL ÜRETİM ENTEGRE EVYE',
    specialDetail: 'ÖZEL ÖN DETAY',
    labor: 'İŞÇİLİKLER',
    
    // Fields
    mtul: 'MTÜL',
    metrekare: 'M²',
    birimFiyati: 'BİRİM FİYATI',
    toplamFiyat: 'TOPLAM FİYAT',
    
    // Placeholders
    selectProduct: 'ÜRÜN SEÇİNİZ',
    selectColor: 'RENK SEÇİNİZ',
    selectThickness: 'KALINLIK SEÇİNİZ',
    selectFirst: 'ÖNCE',
    loading: 'Yükleniyor...',
    
    // Actions
    ekle: 'EKLE',
    
    // Pricing
    listeFiyati: 'LİSTE FİYATI',
    iskonto: 'İSKONTO (%)',
    iskontoluFiyat: 'İSKONTOLU FİYAT',
    kdv: 'KDV (%20)',
    genelToplam: 'GENEL TOPLAM',
    
    // PDF
    downloadPdf: '📄 PDF İndir',
    openPdf: '🔗 PDF Aç',
    
    // Numbers and counters
    depthCounter: '({count}/5)',
    panelCounter: '({count}/3)',
    davlumbazCounter: '({count}/3)',
    
    // Special Detail Options
    piramit: 'PİRAMİT',
    piramitM20: 'Piramit M20',
    piramitMQ40: 'Piramit MQ40',
    piramitU40: 'Piramit U40',
    profil: 'Profil',
    hera: 'Hera',
    heraKlasik: 'Hera Klasik',
    trio: 'Trio',
    country: 'Country',
    balikSirti: 'Balık Sırtı',
    m20: 'M20',
    mq40: 'MQ40',
    u40: 'U40'
  },
  en: {
    // Common
    reset: 'Reset Form',
    download: 'Download',
    open: 'Open',
    
    // Form labels
    firma: 'COMPANY / DEALER',
    musteri: 'CUSTOMER',
    mimar: 'ARCHITECT',
    tarih: 'DATE',
    urun: 'PRODUCT',
    urunSeciniz: 'SELECT PRODUCT',
    yukleniyor: 'Loading...',
    renk: 'COLOR',
    renkSeciniz: 'SELECT COLOR',
    onceUrunSeciniz: 'SELECT PRODUCT FIRST',
    renkBulunamadi: 'No color found for this product',
    tezgahKalinlik: 'COUNTERTOP FRONT THICKNESS (h)',
    onceRenkSeciniz: 'SELECT COLOR FIRST',
    kalinlikSeciniz: 'SELECT THICKNESS',
    fiyat: 'PRICE',
    
    // Sections
    derinlik: 'HOW MANY DIFFERENT DEPTHS IN PROJECT?',
    derinlikField: 'DEPTH',
    seciniz: 'Select',
    iskontoPlus: '(+) DISCOUNT (%)',
    iskontoFiyat: 'DISCOUNTED PRICE',
    
    // Special sections
    ozelOnDetay: 'SPECIAL FRONT DETAIL',
    detaySecimi: 'DETAIL SELECTION',
    ozelUretimEviye: 'CUSTOM INTEGRATED SINK',
    eviyeSecimi: 'SINK SELECTION',
    eviyeToplam: 'SINK TOTAL PRICE',
    lutfenSecin: 'Please Select',
    iscilikHizmetleri: 'LABOR',
    iscilikToplam: 'LABOR TOTAL PRICE',
    
    // Labor services
    tezgahaSifirEviye: 'FLUSH-MOUNT SINK LABOR',
    tezgahaSifirOcak: 'FLUSH-MOUNT COOKTOP LABOR',
    suDamlalik: 'WATER DRIP EDGE PRICE',
    ustten: 'TOP-MOUNT SINK INSTALLATION',
    tezgahAltLavabo: 'UNDER-COUNTER BASIN LABOR',
    tezgahAltEviye: 'UNDER-COUNTER SINK LABOR',
    ceyrekDaire: 'QUARTER CIRCLE OVAL LABOR',
    yarimDaire: 'HALF CIRCLE OVAL LABOR',
    
    // Placeholders
    firmaPlaceholder: 'COMPANY / DEALER',
    musteriPlaceholder: 'CUSTOMER',
    mimarPlaceholder: 'ARCHITECT',
    tarihPlaceholder: 'DD/MM/YYYY',
    
    // Depth options
    depth61: 'Up to 61 cm',
    depth65: 'Up to 65 cm',
    depth70: '70 cm',
    depth80: '80 cm',
    depth90: '90 cm',
    depth100: '100 cm',
    panel: 'ADD PANEL',
    davlumbaz: 'HOOD PANEL',
    supurgelik: 'BASEBOARD',
    eviye: 'SPECIAL PRODUCTION INTEGRATED SINK',
    specialDetail: 'SPECIAL FRONT DETAIL',
    labor: 'LABOR',
    
    // Fields
    mtul: 'LINEAR METER',
    metrekare: 'M²',
    birimFiyati: 'UNIT PRICE',
    toplamFiyat: 'TOTAL PRICE',
    
    // Placeholders
    selectProduct: 'SELECT PRODUCT',
    selectColor: 'SELECT COLOR',
    selectThickness: 'SELECT THICKNESS',
    selectFirst: 'FIRST SELECT',
    loading: 'Loading...',
    
    // Actions
    ekle: 'ADD',
    
    // Pricing
    listeFiyati: 'LIST PRICE',
    iskonto: 'DISCOUNT (%)',
    iskontoluFiyat: 'DISCOUNTED PRICE',
    kdv: 'VAT (%20)',
    genelToplam: 'GRAND TOTAL',
    
    // PDF
    downloadPdf: '📄 Download PDF',
    openPdf: '🔗 Open PDF',
    
    // Numbers and counters
    depthCounter: '({count}/5)',
    panelCounter: '({count}/3)',
    davlumbazCounter: '({count}/3)',
    
    // Special Detail Options
    piramit: 'PYRAMID',
    piramitM20: 'Pyramid M20',
    piramitMQ40: 'Pyramid MQ40',
    piramitU40: 'Pyramid U40',
    profil: 'Profile',
    hera: 'Hera',
    heraKlasik: 'Hera Classic',
    trio: 'Trio',
    country: 'Country',
    balikSirti: 'Fish Scale',
    m20: 'M20',
    mq40: 'MQ40',
    u40: 'U40'
  }
}

// Context interface
interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof Translations, params?: Record<string, string | number>) => string
}

// Create context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Provider component
interface LanguageProviderProps {
  children: ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('tr')

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('app-language') as Language
    if (savedLanguage && (savedLanguage === 'tr' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage)
    } else {
      // Default to Turkish if no saved language
      setLanguageState('tr')
      localStorage.setItem('app-language', 'tr')
    }
  }, [])

  // Set language and persist to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('app-language', lang)
  }

  // Translation function with parameter support
  const t = (key: keyof Translations, params?: Record<string, string | number>): string => {
    let translation = translations[language][key]
    
    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(`{${paramKey}}`, String(value))
      })
    }
    
    return translation
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

// Hook to use language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
