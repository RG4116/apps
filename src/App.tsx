import { useState, useEffect } from 'react'
import './performance.css'
import './App.css'
import {
  startRealTimeUpdates,
  stopRealTimeUpdates,
  getGoogleSheetsData,
  getColorsForProduct,
  type Product,
  type Color
} from './services/googleSheets';
import { generateQuotationPDF } from './services/pdfService'
import DecimalInput, { toNumber } from './components/DecimalInput'
import { useLanguage } from './contexts/LanguageContext'
import { LanguageToggle } from './components/LanguageToggle'
import { getThicknessPriceMultiplier, getDepthPriceMultiplier } from './utils/priceCalculations'

interface DepthGroup {
  id: string
  derinlik: string
  mtul: number
  birimFiyati: number
  toplamFiyat: number
}

interface PanelGroup {
  id: string
  metrekare: number
  birimFiyati: number
  toplamFiyat: number
}

interface DavlumbazGroup {
  id: string
  metrekare: number
  birimFiyati: number
  toplamFiyat: number
}

interface SupurgelikData {
  tip: string
  mtul: number
  birimFiyati: number
  toplamFiyat: number
}

interface EviyeData {
  tip: string
  toplamFiyat: number
}

interface SpecialDetailData {
  tip: string
  mtul: number
  birimFiyati: number
  toplamFiyat: number
}

interface LaborServiceItem {
  name: string
  isActive: boolean
  price: number
}

interface LaborData {
  services: LaborServiceItem[]
  totalPrice: number
}

interface DiscountData {
  totalListDiscount: number // First discount (%) applies to Total List Price
  depthPanelDiscount: number // Second discount (+) applies to Depths, Panel, Hood Panel, and Baseboard
}

interface FormData {
  firmaBayi: string
  musteri: string
  mimar: string
  tarih: string
  urun: string
  renk: string
  tezgahKalinlik: string
  supurgelik: SupurgelikData
  eviye: EviyeData
  specialDetail: SpecialDetailData
  depthGroups: DepthGroup[]
  panelGroups: PanelGroup[]
  davlumbazGroups: DavlumbazGroup[]
  labor: LaborData
  discounts: DiscountData
}

function App() {
  // Language context
  const { t, language } = useLanguage()
  
  // Helper function to translate labor service names
  const translateLaborService = (serviceName: string): string => {
    const translations: Record<string, string> = {
      'TEZGAHA SIFIR EVİYE İŞÇİLİK': t('tezgahaSifirEviye'),
      'TEZGAHA SIFIR OCAK İŞÇİLİK': t('tezgahaSifirOcak'),
      'SU DAMLALIĞI TAKIM FİYATI': t('suDamlalik'),
      'ÜSTTEN EVİYE MONTAJ BEDELİ': t('ustten'),
      'TEZGAH ALTI LAVABO İŞÇİLİK': t('tezgahAltLavabo'),
      'TEZGAH ALTI EVİYE İŞÇİLİK': t('tezgahAltEviye'),
      'ÇEYREK DAİRE OVAL İŞÇİLİK': t('ceyrekDaire'),
      'YARIM DAİRE OVAL İŞÇİLİK': t('yarimDaire')
    }
    return translations[serviceName] || serviceName
  }
  
  // Helper function to translate depth options
  const translateDepthOption = (option: string): string => {
    const translations: Record<string, string> = {
      "61 cm'e kadar": t('depth61'), // For Dekton products
      "65 cm'e kadar": t('depth65'), // For other products
      '70 cm': t('depth70'),
      '80 cm': t('depth80'),
      '90 cm': t('depth90'),
      '100 cm': t('depth100')
    }
    return translations[option] || option
  }
  
  // Get depth options based on selected product
  const getDepthOptions = (): string[] => {
    const productName = getSelectedProduct()?.name.toLowerCase() || ''
    
    // Check if it's a Dekton product
    const isDekton = productName.includes('dekton')
    
    const baseOptions = [
      isDekton ? "61 cm'e kadar" : "65 cm'e kadar",
      "70 cm",
      "80 cm", 
      "90 cm",
      "100 cm",
      "110 cm",
      "120 cm"
    ]
    
    return baseOptions
  }

  // Validate and update depth groups when product changes
  const validateDepthGroups = (newProductId: string): DepthGroup[] => {
    if (!newProductId || formData.depthGroups.length === 0) return formData.depthGroups
    
    const selectedProduct = products.find(p => p.id === newProductId)
    const productName = selectedProduct?.name.toLowerCase() || ''
    const isDekton = productName.includes('dekton')
    
    // Map old depth options to new ones
    return formData.depthGroups.map(group => {
      let newDerinlik = group.derinlik
      
      // Handle transition between Dekton (61cm) and non-Dekton (65cm) products
      if (group.derinlik === "61 cm'e kadar" && !isDekton) {
        newDerinlik = "65 cm'e kadar"
      } else if (group.derinlik === "65 cm'e kadar" && isDekton) {
        newDerinlik = "61 cm'e kadar"
      }
      
      return {
        ...group,
        derinlik: newDerinlik
      }
    })
  }

  // Get today's date in DD/MM/YYYY format
  const getTodayFormatted = (): string => {
    const today = new Date()
    const day = today.getDate().toString().padStart(2, '0')
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const year = today.getFullYear()
    return `${day}/${month}/${year}`
  }

  const [formData, setFormData] = useState<FormData>({
    firmaBayi: '',
    musteri: '',
    mimar: '',
    tarih: getTodayFormatted(), // Set today's date in DD/MM/YYYY format
    urun: '',
    renk: '',
    tezgahKalinlik: 'h:4 cm', // Default: h:4 cm (1.00x base pricing)
    supurgelik: {
      tip: '',
      mtul: 1,
      birimFiyati: 0,
      toplamFiyat: 0
    },
    eviye: {
      tip: '',
      toplamFiyat: 0
    },
    specialDetail: {
      tip: '',
      mtul: 1,
      birimFiyati: 0,
      toplamFiyat: 0
    },
    depthGroups: [],
    panelGroups: [],
    davlumbazGroups: [],
    labor: {
      services: [
        { name: 'TEZGAHA SIFIR EVİYE İŞÇİLİK', isActive: false, price: 0 },
        { name: 'TEZGAHA SIFIR OCAK İŞÇİLİK', isActive: false, price: 0 },
        { name: 'SU DAMLALIĞI TAKIM FİYATI', isActive: false, price: 0 },
        { name: 'ÜSTTEN EVİYE MONTAJ BEDELİ', isActive: false, price: 0 },
        { name: 'TEZGAH ALTI LAVABO İŞÇİLİK', isActive: false, price: 0 },
        { name: 'TEZGAH ALTI EVİYE İŞÇİLİK', isActive: false, price: 0 },
        { name: 'ÇEYREK DAİRE OVAL İŞÇİLİK', isActive: false, price: 0 },
        { name: 'YARIM DAİRE OVAL İŞÇİLİK', isActive: false, price: 0 }
      ],
      totalPrice: 0
    },
    discounts: {
      totalListDiscount: 0,
      depthPanelDiscount: 0
    }
  })
  
  const [products, setProducts] = useState<Product[]>([])
  const [allColors, setAllColors] = useState<Color[]>([]) // Store ALL colors
  const [availableColors, setAvailableColors] = useState<Color[]>([]) // Filtered colors for selected product
  const [allLaborServices, setAllLaborServices] = useState<LaborServiceItem[]>([]) // Store ALL labor services
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Collapsed state for each section
  const [collapsedSections, setCollapsedSections] = useState({
    depth: true,
    panel: true,
    davlumbaz: true,
    supurgelik: true,
    eviye: true,
    specialDetail: true,
    labor: true
  })

  // Toggle section collapsed state
  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Fetch ALL data from Google Sheets once on component mount with instant loading
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setIsLoadingData(true)
        console.time('Data loading')
        
        // Use optimized loading: instant cache, background refresh
        const { products: productsData, colors: colorsData } = await getGoogleSheetsData()
        
        // Sort products and colors alphabetically by name
        const sortedProducts = [...productsData].sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'))
        const sortedColors = [...colorsData].sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'))
        
        setProducts(sortedProducts)
        setAllColors(sortedColors)
        
        // Initialize default labor services
        setAllLaborServices([
          { name: 'Taşıma', isActive: false, price: 0 },
          { name: 'Montaj', isActive: false, price: 0 },
          { name: 'Delik Açma', isActive: false, price: 0 },
          { name: 'Köşe Düzeltme', isActive: false, price: 0 },
          { name: 'Dolap Arkası', isActive: false, price: 0 },
          { name: 'Su Damlacığı', isActive: false, price: 0 }
        ])
        
        console.timeEnd('Data loading')
        console.log('✅ Data loaded:', productsData.length, 'products,', colorsData.length, 'colors')
        
        // Debug: Show all products with their stone types and currencies
        console.log('📊 Product Debug Info:', productsData.map(p => ({
          id: p.id,
          name: p.name,
          stoneType: p.stoneType || 'not set',
          currency: p.currency || 'not set',
          category: p.category
        })))
        
        // Debug: Show KETO specifically
        const keto = productsData.find(p => p.name.toUpperCase().includes('KETO'))
        if (keto) {
          console.log('🎯 KETO Debug Info:', {
            id: keto.id,
            name: keto.name,
            stoneType: keto.stoneType || 'not set',
            currency: keto.currency || 'not set',
            category: keto.category
          })
        } else {
          console.log('❌ KETO not found in products')
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoadingData(false)
      }
    }

    loadAllData()
  }, [])
  
  // Start real-time updates
  useEffect(() => {
    const handleDataUpdate = (newData: { products: Product[]; colors: Color[] }) => {
      console.log('📡 Real-time update received')
      
      // Sort products and colors alphabetically by name
      const sortedProducts = [...newData.products].sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'))
      const sortedColors = [...newData.colors].sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'))
      
      setProducts(sortedProducts)
      setAllColors(sortedColors)
      
      // Update available colors for current product selection
      if (formData.urun) {
        const filtered = getColorsForProduct(sortedColors, formData.urun)
        const sortedFilteredColors = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'))
        setAvailableColors(sortedFilteredColors)
        
        // Only clear color selection if it no longer exists in the updated data
        // This preserves user selections during product changes
        if (formData.renk && !filtered.find(c => c.id === formData.renk)) {
          setFormData(prev => ({ ...prev, renk: '', tezgahKalinlik: 'h:4 cm' }))
        }
      }
    }
    
    startRealTimeUpdates(handleDataUpdate)
    
    // Cleanup on unmount
    return () => {
      stopRealTimeUpdates()
    }
  }, []) // Remove formData dependencies to prevent interference with product changes
  
  // Handle color filtering when product changes (separate from real-time updates)
  useEffect(() => {
    if (formData.urun && allColors.length > 0) {
      console.time('Color filtering')
      const colorsForProduct = getColorsForProduct(allColors, formData.urun)
      const sortedColorsForProduct = [...colorsForProduct].sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'))
      setAvailableColors(sortedColorsForProduct)
      console.timeEnd('Color filtering')
      console.log('🎨 Found', sortedColorsForProduct.length, 'colors for product', formData.urun)
      
      // Don't reset color here - let handleInputChange handle it to preserve measurements
    } else {
      setAvailableColors([])
    }
  }, [formData.urun, allColors])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      }
      
      // Reset color when product changes (but preserve all measurements)
      if (name === 'urun') {
        // Only reset color if it's not available for the new product
        const newProductColors = getColorsForProduct(allColors, value)
        if (formData.renk && !newProductColors.find(c => c.id === formData.renk)) {
          newData.renk = ''
        }
        // Always reset thickness when product changes for consistency
        newData.tezgahKalinlik = 'h:4 cm'
        
        // Validate and update depth groups for the new product (handle Dekton vs non-Dekton)
        newData.depthGroups = validateDepthGroups(value).map(group => ({
          ...group,
          birimFiyati: 0,
          toplamFiyat: 0
        }))
        
        // Reset all prices in panel groups while preserving measurements
        newData.panelGroups = prev.panelGroups.map(group => ({
          ...group,
          birimFiyati: 0,
          toplamFiyat: 0
        }))
        
        // Reset all prices in davlumbaz groups while preserving measurements
        newData.davlumbazGroups = prev.davlumbazGroups.map(group => ({
          ...group,
          birimFiyati: 0,
          toplamFiyat: 0
        }))
        
        // Reset supurgelik prices while preserving selection and measurements
        if (prev.supurgelik.tip && prev.supurgelik.tip !== 'LÜTFEN SEÇİN') {
          newData.supurgelik = {
            ...prev.supurgelik,
            birimFiyati: 0,
            toplamFiyat: 0
          }
        }
        
        // Reset special detail prices while preserving selection and measurements
        // Also validate special detail selection for new product category
        if (prev.specialDetail.tip && prev.specialDetail.tip !== 'Lütfen Seçin') {
          // Check if current special detail selection is valid for new product category
          const selectedProduct = products.find(p => p.id === value)
          const newCategory = selectedProduct?.category
          const currentSelection = prev.specialDetail.tip
          
          // Get valid options for new category
          const validOptions = newCategory === 'Porcelain' 
            ? ['Lütfen Seçin', 'PİRAMİT']
            : ['Lütfen Seçin', 'Profil', 'Hera', 'Hera Klasik', 'Trio', 'Country', 'Balık Sırtı', 'M20', 'MQ40', 'U40']
          
          // Reset selection if it's not valid for new category
          if (!validOptions.includes(currentSelection)) {
            newData.specialDetail = {
              tip: '',
              mtul: prev.specialDetail.mtul,
              birimFiyati: 0,
              toplamFiyat: 0
            }
          } else {
            newData.specialDetail = {
              ...prev.specialDetail,
              birimFiyati: 0,
              toplamFiyat: 0
            }
          }
        }
        
        // Reset eviye prices while preserving selection
        if (prev.eviye.tip && prev.eviye.tip !== 'Lütfen Seçin') {
          newData.eviye = {
            ...prev.eviye,
            toplamFiyat: 0
          }
        }
        
        // Keep all other measurements and configurations
        // This allows users to compare prices across different products with same measurements
      }
      
      // Reset tezgah kalinlik when color changes
      if (name === 'renk') {
        newData.tezgahKalinlik = 'h:4 cm' // Reset to default
      }
      
      return newData
    })
  }

  const handleReset = () => {
    setFormData({
      firmaBayi: '',
      musteri: '',
      mimar: '',
      tarih: getTodayFormatted(), // Reset to today's date in DD/MM/YYYY format
      urun: '',
      renk: '',
      tezgahKalinlik: 'h:4 cm',
      supurgelik: {
        tip: '',
        mtul: 1,
        birimFiyati: 0,
        toplamFiyat: 0
      },
      eviye: {
        tip: '',
        toplamFiyat: 0
      },
      specialDetail: {
        tip: '',
        mtul: 1,
        birimFiyati: 0,
        toplamFiyat: 0
      },
      depthGroups: [],
      panelGroups: [],
      davlumbazGroups: [],
      labor: {
        services: [
          { name: 'TEZGAHA SIFIR EVİYE İŞÇİLİK', isActive: false, price: 0 },
          { name: 'TEZGAHA SIFIR OCAK İŞÇİLİK', isActive: false, price: 0 },
          { name: 'SU DAMLALIĞI TAKIM FİYATI', isActive: false, price: 0 },
          { name: 'ÜSTTEN EVİYE MONTAJ BEDELİ', isActive: false, price: 0 },
          { name: 'TEZGAH ALTI LAVABO İŞÇİLİK', isActive: false, price: 0 },
          { name: 'TEZGAH ALTI EVİYE İŞÇİLİK', isActive: false, price: 0 },
          { name: 'ÇEYREK DAİRE OVAL İŞÇİLİK', isActive: false, price: 0 },
          { name: 'YARIM DAİRE OVAL İŞÇİLİK', isActive: false, price: 0 }
        ],
        totalPrice: 0
      },
      discounts: {
        totalListDiscount: 0,
        depthPanelDiscount: 0
      }
    })
    setAvailableColors([])
    
    // Reset all sections to collapsed state
    setCollapsedSections({
      depth: true,
      panel: true,
      davlumbaz: true,
      supurgelik: true,
      eviye: true,
      specialDetail: true,
      labor: true
    })
  }

  // Depth group management
  const addDepthGroup = () => {
    if (formData.depthGroups.length < 5) {
      const newGroup: DepthGroup = {
        id: `depth_${Date.now()}`,
        derinlik: '',
        mtul: 0,
        birimFiyati: 0,
        toplamFiyat: 0
      }
      setFormData(prev => ({
        ...prev,
        depthGroups: [...prev.depthGroups, newGroup]
      }))
    }
  }

  const removeDepthGroup = (id: string) => {
    setFormData(prev => ({
      ...prev,
      depthGroups: prev.depthGroups.filter(group => group.id !== id)
    }))
  }

  const updateDepthGroup = (id: string, field: keyof DepthGroup, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      depthGroups: prev.depthGroups.map(group => {
        if (group.id === id) {
          const updated = { ...group, [field]: value }
          
          // Auto-calculate birimFiyati from selected color price when derinlik changes
          if (field === 'derinlik' && typeof value === 'string') {
            const selectedColor = getSelectedColor()
            if (selectedColor?.price) {
              // Convert price string to number and apply depth-based and thickness multipliers
              const basePrice = parseFloat(selectedColor.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
              const depthMultiplier = getDepthPriceMultiplier(value)
              const thicknessMultiplier = getThicknessPriceMultiplier(prev.tezgahKalinlik)
              updated.birimFiyati = basePrice * depthMultiplier * thicknessMultiplier
            } else {
              updated.birimFiyati = 0
            }
          }
          
          // Auto-calculate toplamFiyat when mtul or birimFiyati changes
          if (field === 'mtul' || field === 'derinlik') {
            updated.toplamFiyat = updated.mtul * updated.birimFiyati
          }
          
          return updated
        }
        return group
      })
    }))
  }

  // Calculate total price from all depth groups
  const calculateTotalPrice = (): number => {
    return formData.depthGroups.reduce((total, group) => total + group.toplamFiyat, 0)
  }

  // Panel Group Management Functions
  const addPanelGroup = () => {
    if (formData.panelGroups.length >= 3) return // Max 3 panels
    
    const newPanel: PanelGroup = {
      id: `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metrekare: 0,
      birimFiyati: 0,
      toplamFiyat: 0
    }
    
    // Set birimFiyati from selected color if available with 1.25x multiplier for panels
    const selectedColor = getSelectedColor()
    if (selectedColor?.price) {
      const basePrice = parseFloat(selectedColor.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
      newPanel.birimFiyati = basePrice * 1.25 // Apply 1.25x multiplier for panels
    }
    
    setFormData(prev => ({
      ...prev,
      panelGroups: [...prev.panelGroups, newPanel]
    }))
  }

  const removePanelGroup = (id: string) => {
    setFormData(prev => ({
      ...prev,
      panelGroups: prev.panelGroups.filter(group => group.id !== id)
    }))
  }

  const updatePanelGroup = (id: string, field: keyof PanelGroup, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      panelGroups: prev.panelGroups.map(group => {
        if (group.id === id) {
          const updated = { ...group, [field]: value }
          
          // Auto-calculate birimFiyati from selected color price when initially set with 1.25x multiplier
          if (field === 'metrekare' && updated.birimFiyati === 0) {
            const selectedColor = getSelectedColor()
            if (selectedColor?.price) {
              const basePrice = parseFloat(selectedColor.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
              updated.birimFiyati = basePrice * 1.25 // Apply 1.25x multiplier for panels
            }
          }
          
          // Auto-calculate toplamFiyat when metrekare or birimFiyati changes
          if (field === 'metrekare' || field === 'birimFiyati') {
            updated.toplamFiyat = updated.metrekare * updated.birimFiyati
          }
          
          return updated
        }
        return group
      })
    }))
  }

  // Davlumbaz Group Functions
  const addDavlumbazGroup = () => {
    if (formData.davlumbazGroups.length >= 3) return // Max 3 davlumbaz
    
    const newDavlumbaz: DavlumbazGroup = {
      id: `davlumbaz-${Date.now()}`,
      metrekare: 0,
      birimFiyati: 0,
      toplamFiyat: 0
    }
    
    // Auto-fill price from selected color if available with 1.25x multiplier for davlumbaz panels
    const selectedColor = getSelectedColor()
    if (selectedColor?.price) {
      const basePrice = parseFloat(selectedColor.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
      newDavlumbaz.birimFiyati = basePrice * 1.25 // Apply 1.25x multiplier for davlumbaz panels
    }
    
    setFormData(prev => ({
      ...prev,
      davlumbazGroups: [...prev.davlumbazGroups, newDavlumbaz]
    }))
  }

  const removeDavlumbazGroup = (id: string) => {
    setFormData(prev => ({
      ...prev,
      davlumbazGroups: prev.davlumbazGroups.filter(group => group.id !== id)
    }))
  }

  const updateDavlumbazGroup = (id: string, field: keyof DavlumbazGroup, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      davlumbazGroups: prev.davlumbazGroups.map(group => {
        if (group.id === id) {
          const updated = { ...group, [field]: value }
          
          // Auto-calculate birimFiyati from selected color price when initially set with 1.25x multiplier
          if (field === 'metrekare' && updated.birimFiyati === 0) {
            const selectedColor = getSelectedColor()
            if (selectedColor?.price) {
              const basePrice = parseFloat(selectedColor.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
              updated.birimFiyati = basePrice * 1.25 // Apply 1.25x multiplier for davlumbaz panels
            }
          }
          
          // Auto-calculate toplamFiyat when metrekare or birimFiyati changes
          if (field === 'metrekare' || field === 'birimFiyati') {
            updated.toplamFiyat = updated.metrekare * updated.birimFiyati
          }
          
          return updated
        }
        return group
      })
    }))
  }

  // Get automatic skirting band based on front-edge thickness
  const getAutomaticSkirtingBand = (thickness: string): string => {
    // Band selection links to the chosen front-edge thickness:
    // STANDART and h:4 cm → H:05–H:10 band (new default)
    // 5–6 cm edge → H:05–H:10 band
    // 7–8 or 9–10 cm → H:11–H:20 band
    // 11–15 cm → H:11–H:20 band  
    // 16–20 cm → H:21–H:30 band
    
    // Normalize thickness string for parsing (handle different dash types)
    const normalizedThickness = thickness.replace(/[–—]/g, '-')
    
    if (normalizedThickness.includes('4') || normalizedThickness.toUpperCase().includes('STANDART') ||
        normalizedThickness.includes('5-6') || normalizedThickness.includes('5–6')) {
      return 'H:05–H:10'
    } else if (normalizedThickness.includes('7-8') || normalizedThickness.includes('7–8') ||
               normalizedThickness.includes('9-10') || normalizedThickness.includes('9–10')) {
      return 'H:11–H:20'
    } else if (normalizedThickness.includes('11-15') || normalizedThickness.includes('11–15')) {
      return 'H:11–H:20'
    } else if (normalizedThickness.includes('16-20') || normalizedThickness.includes('16–20')) {
      return 'H:21–H:30'
    }
    
    // Default for standard thicknesses - now defaults to h:4cm behavior
    return 'H:05–H:10'
  }

  // SÜPÜRGELİK management functions
  const supurgelikOptions = [
    'LÜTFEN SEÇİN',
    'H:05–H:10',
    'H:11–H:20',
    'H:21–H:30',
    'H:31 – (+)'
  ]

  const getSupurgelikPrice = (tip: string): number => {
    // Süpürgelik fiyatları h:1,5 cm kalınlığının fiyatına göre hesaplanır
    if (!tip || tip === 'LÜTFEN SEÇİN') return 0
    
    // h:1,5 cm kalınlığının fiyatını al
    const selectedColor = getSelectedColor()
    if (!selectedColor?.price) return 0
    
    const basePrice = parseFloat(selectedColor.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
    const h15cmPrice = basePrice * getThicknessPriceMultiplier('h:1.5 cm')
    
    // Get selected product's currency and apply conversion
    
    // Apply currency conversion using shared utilities
    const convertedBasePrice = h15cmPrice
    
    // Süpürgelik fiyat hesaplamaları
    switch (tip) {
      case 'H:05–H:10':
        return convertedBasePrice / 6 // h:1,5 cm fiyatı / 6
      case 'H:11–H:20':
        return convertedBasePrice / 3 // h:1,5 cm fiyatı / 3
      case 'H:21–H:30':
        return convertedBasePrice / 2 // h:1,5 cm fiyatı / 2
      case 'H:31 – (+)':
        return convertedBasePrice // h:1,5 cm fiyatı
      default:
        return 0
    }
  }

  const updateSupurgelik = (field: keyof SupurgelikData, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev.supurgelik, [field]: value }
      
      // Auto-calculate prices when tip or mtul changes
      if (field === 'tip' && typeof value === 'string') {
        updated.birimFiyati = getSupurgelikPrice(value)
        updated.toplamFiyat = updated.mtul * updated.birimFiyati
      } else if (field === 'mtul' && typeof value === 'number') {
        updated.toplamFiyat = value * updated.birimFiyati
      }
      
      return {
        ...prev,
        supurgelik: updated
      }
    })
  }

  // Auto-update skirting band when thickness changes
  const updateSkirtingBandFromThickness = (thickness: string) => {
    if (formData.supurgelik.tip && formData.supurgelik.tip !== 'LÜTFEN SEÇİN') {
      const automaticBand = getAutomaticSkirtingBand(thickness)
      updateSupurgelik('tip', automaticBand)
    }
  }

  // EVİYE management functions
  const eviyeOptions = [
    'Lütfen Seçin',
    '40 X 40 X h18',
    '50 X 40 X h18',
    '60 X 40 X h18',
    '70 X 40 X h23',
    '80 X 40 X h23'
  ]

  // SPECIAL DETAIL management functions
  const getSpecialDetailOptions = (): string[] => {
    // Porcelain grubu için sadece PİRAMİT seçeneği
    if (isSelectedProductPorcelain()) {
      return [
        'Lütfen Seçin',
        'PİRAMİT'
      ]
    }
    
    // Quartz grubu için tüm seçenekler (M20, MQ40, U40 dahil)
    return [
      'Lütfen Seçin',
      'Profil',
      'Hera',
      'Hera Klasik',
      'Trio',
      'Country',
      'Balık Sırtı',
      'M20',
      'MQ40',
      'U40'
    ]
  }

  // Translate special detail option names
  const translateSpecialDetailOption = (option: string): string => {
    const translations: Record<string, string> = {
      'Lütfen Seçin': t('lutfenSecin'),
      'PİRAMİT': t('piramit'),
      'Profil': t('profil'),
      'Hera': t('hera'),
      'Hera Klasik': t('heraKlasik'),
      'Trio': t('trio'),
      'Country': t('country'),
      'Balık Sırtı': t('balikSirti'),
      'M20': t('m20'),
      'MQ40': t('mq40'),
      'U40': t('u40')
    }
    return translations[option] || option
  }

  const getSpecialDetailPrice = (tip: string): number => {
    // Fixed TL/mtül list prices (group-agnostic or group-specific per table)
    // These are NOT derived from base price - they are standalone fixed prices
    if (!tip || tip === 'Lütfen Seçin') return 0
    
    // Get selected product's currency for conversion
    
    // Fixed pricing based on detail type (base prices in TRY)
    let basePriceTRY = 0
    switch (tip) {
      case 'Profil':
        basePriceTRY = 180 // Fixed TL per mtül
        break
      case 'Hera':
        basePriceTRY = 220 // Fixed TL per mtül
        break
      case 'Hera Klasik':
        basePriceTRY = 200 // Fixed TL per mtül
        break
      case 'Trio':
        basePriceTRY = 280 // Fixed TL per mtül
        break
      case 'Country':
        basePriceTRY = 240 // Fixed TL per mtül
        break
      case 'Balık Sırtı':
        basePriceTRY = 260 // Fixed TL per mtül
        break
      case 'M20':
        basePriceTRY = 210 // Fixed TL per mtül
        break
      case 'MQ40':
        basePriceTRY = 300 // Fixed TL per mtül
        break
      case 'U40':
        basePriceTRY = 320 // Fixed TL per mtül
        break
      // Piramit seçeneği için fiyat
      case 'PİRAMİT':
        basePriceTRY = 250 // Fixed TL per mtül (Porcelain için standart fiyat)
        break
      default:
        return 0
        basePriceTRY = 0
    }
    
    // Apply currency conversion
    return basePriceTRY
  }

  const updateSpecialDetail = (field: keyof SpecialDetailData, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev.specialDetail, [field]: value }
      
      // Auto-calculate prices when tip or mtul changes
      if (field === 'tip' && typeof value === 'string') {
        updated.birimFiyati = getSpecialDetailPrice(value)
        updated.toplamFiyat = updated.mtul * updated.birimFiyati
      } else if (field === 'mtul' && typeof value === 'number') {
        updated.toplamFiyat = value * updated.birimFiyati
      }
      
      return {
        ...prev,
        specialDetail: updated
      }
    })
  }

  const getEviyePrice = (tip: string): number => {
    
    // Get selected product's currency for conversion
    
    // Eviye pricing based on size (base prices in TRY)
    let basePriceTRY = 0
    switch (tip) {
      case '40 X 40 X h18':
        basePriceTRY = 1500 // Base price in TRY
        break
      case '50 X 40 X h18':
        basePriceTRY = 1800 // Base price in TRY
        break
      case '60 X 40 X h18':
        basePriceTRY = 2100 // Base price in TRY
        break
      case '70 X 40 X h23':
        basePriceTRY = 2500 // Base price in TRY
        break
      case '80 X 40 X h23':
        basePriceTRY = 2800 // Base price in TRY
        break
      default:
        return 0
        basePriceTRY = 0
    }
    
    // Apply currency conversion
    return basePriceTRY
  }

  const updateEviye = (field: keyof EviyeData, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev.eviye, [field]: value }
      
      // Auto-calculate price when tip changes
      if (field === 'tip' && typeof value === 'string') {
        updated.toplamFiyat = getEviyePrice(value)
      }
      
      return {
        ...prev,
        eviye: updated
      }
    })
  }

  // Update prices when color changes
  useEffect(() => {
    if (formData.renk && (formData.depthGroups.length > 0 || formData.panelGroups.length > 0 || formData.davlumbazGroups.length > 0 || formData.supurgelik.tip || formData.eviye.tip || formData.specialDetail.tip)) {
      const selectedColor = getSelectedColor()
      if (selectedColor?.price) {
        const basePrice = parseFloat(selectedColor.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
        
        setFormData(prev => ({
          ...prev,
          depthGroups: prev.depthGroups.map(group => {
            if (group.derinlik) {
              const depthMultiplier = getDepthPriceMultiplier(group.derinlik)
              const thicknessMultiplier = getThicknessPriceMultiplier(prev.tezgahKalinlik)
              const adjustedPrice = basePrice * depthMultiplier * thicknessMultiplier
              return {
                ...group,
                birimFiyati: adjustedPrice,
                toplamFiyat: group.mtul * adjustedPrice
              }
            }
            return {
              ...group,
              birimFiyati: 0,
              toplamFiyat: 0
            }
          }),
          panelGroups: prev.panelGroups.map(group => ({
            ...group,
            birimFiyati: basePrice * 1.25, // Apply 1.25x multiplier for panels
            toplamFiyat: group.metrekare * (basePrice * 1.25)
          })),
          davlumbazGroups: prev.davlumbazGroups.map(group => ({
            ...group,
            birimFiyati: basePrice * 1.25, // Apply 1.25x multiplier for davlumbaz panels
            toplamFiyat: group.metrekare * (basePrice * 1.25)
          })),
          supurgelik: prev.supurgelik.tip && prev.supurgelik.tip !== 'LÜTFEN SEÇİN' ? {
            ...prev.supurgelik,
            birimFiyati: getSupurgelikPrice(prev.supurgelik.tip),
            toplamFiyat: prev.supurgelik.mtul * getSupurgelikPrice(prev.supurgelik.tip)
          } : prev.supurgelik,
          specialDetail: prev.specialDetail.tip && prev.specialDetail.tip !== 'Lütfen Seçin' ? {
            ...prev.specialDetail,
            birimFiyati: getSpecialDetailPrice(prev.specialDetail.tip),
            toplamFiyat: prev.specialDetail.mtul * getSpecialDetailPrice(prev.specialDetail.tip)
          } : prev.specialDetail,
          eviye: prev.eviye.tip && prev.eviye.tip !== 'Lütfen Seçin' ? {
            ...prev.eviye,
            toplamFiyat: getEviyePrice(prev.eviye.tip)
          } : prev.eviye
        }))
      }
    }
  }, [formData.renk])

  // Update prices when thickness changes
  useEffect(() => {
    if (formData.tezgahKalinlik && formData.renk && formData.depthGroups.length > 0) {
      const selectedColor = getSelectedColor()
      
      if (selectedColor?.price) {
        const basePrice = parseFloat(selectedColor.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
        
        setFormData(prev => ({
          ...prev,
          depthGroups: prev.depthGroups.map(group => {
            if (group.derinlik) {
              const depthMultiplier = getDepthPriceMultiplier(group.derinlik)
              const thicknessMultiplier = getThicknessPriceMultiplier(prev.tezgahKalinlik)
              const adjustedPrice = basePrice * depthMultiplier * thicknessMultiplier
              return {
                ...group,
                birimFiyati: adjustedPrice,
                toplamFiyat: group.mtul * adjustedPrice
              }
            }
            return group
          })
        }))
        
        // Auto-update skirting band based on thickness selection
        updateSkirtingBandFromThickness(formData.tezgahKalinlik)
      }
    }
  }, [formData.tezgahKalinlik, formData.renk])

  // LABOR management functions
  const updateLaborService = (index: number, isActive: boolean) => {
    setFormData(prev => {
      const updatedServices = [...prev.labor.services]
      updatedServices[index] = {
        ...updatedServices[index],
        isActive
      }
      
      // If toggling on, get price from Google Sheets and apply currency conversion
      if (isActive) {
        const sheetService = allLaborServices.find(service => 
          service.name === updatedServices[index].name
        )
        if (sheetService) {
          // Get selected product's currency for conversion
          
          // Apply currency conversion to labor service price
          const convertedPrice = sheetService.price
          updatedServices[index].price = convertedPrice
        }
      } else {
        // If toggling off, reset price to 0
        updatedServices[index].price = 0
      }
      
      // Calculate total price
      const totalPrice = updatedServices
        .filter(service => service.isActive)
        .reduce((sum, service) => sum + service.price, 0)
      
      return {
        ...prev,
        labor: {
          services: updatedServices,
          totalPrice
        }
      }
    })
  }

  // DISCOUNT management functions - immediate updates for real-time price calculation
  const updateDiscountImmediate = (field: keyof DiscountData, stringValue: string) => {
    const numericValue = toNumber(stringValue)
    setFormData(prev => ({
      ...prev,
      discounts: {
        ...prev.discounts,
        [field]: Math.max(0, numericValue) // Ensure non-negative values
      }
    }))
  }

  // Calculate total list price (sum of all sections)
  const calculateTotalListPrice = (): number => {
    const depthTotal = formData.depthGroups.reduce((total, group) => total + group.toplamFiyat, 0)
    const panelTotal = formData.panelGroups.reduce((total, group) => total + group.toplamFiyat, 0)
    const davlumbazTotal = formData.davlumbazGroups.reduce((total, group) => total + group.toplamFiyat, 0)
    const supurgelikTotal = formData.supurgelik.toplamFiyat
    const eviyeTotal = formData.eviye.toplamFiyat
    const specialDetailTotal = formData.specialDetail.toplamFiyat
    const laborTotal = formData.labor.totalPrice

    return depthTotal + panelTotal + davlumbazTotal + supurgelikTotal + eviyeTotal + specialDetailTotal + laborTotal
  }

  // Calculate depth, panel, hood panel, and baseboard total for second discount
  const calculateDepthPanelTotal = (): number => {
    const depthTotal = formData.depthGroups.reduce((total, group) => total + group.toplamFiyat, 0)
    const panelTotal = formData.panelGroups.reduce((total, group) => total + group.toplamFiyat, 0)
    const davlumbazTotal = formData.davlumbazGroups.reduce((total, group) => total + group.toplamFiyat, 0)
    const supurgelikTotal = formData.supurgelik.toplamFiyat

    return depthTotal + panelTotal + davlumbazTotal + supurgelikTotal
  }

  // Calculate final price after discounts
  const calculateFinalPrice = (): number => {
    const totalListPrice = calculateTotalListPrice()
    const depthPanelTotal = calculateDepthPanelTotal()
    
    // Apply first discount (%) to total list price
    const afterFirstDiscount = totalListPrice * (1 - formData.discounts.totalListDiscount / 100)
    
    // Apply second discount (%) to depth/panel/hood/baseboard total only
    const secondDiscountAmount = depthPanelTotal * (formData.discounts.depthPanelDiscount / 100)
    
    return Math.max(0, afterFirstDiscount - secondDiscountAmount)
  }

  // Get selected color details including price
  const getSelectedColor = (): Color | undefined => {
    return allColors.find(color => color.id === formData.renk)
  }

  // Get selected product details including category
  const getSelectedProduct = (): Product | undefined => {
    return products.find(product => product.id === formData.urun)
  }

  // Get product category (Quartz or Porcelain)
  const getProductCategory = (): 'Quartz' | 'Porcelain' | undefined => {
    return getSelectedProduct()?.category
  }

  // Check if selected product is Porcelain
  const isSelectedProductPorcelain = (): boolean => {
    return getProductCategory() === 'Porcelain'
  }

  // Get selected product's stone type from Google Sheets
  const getSelectedProductStoneType = (): string | undefined => {
    const product = getSelectedProduct()
    console.log('🔍 Selected Product Stone Type Debug:', {
      productName: product?.name,
      stoneType: product?.stoneType,
      category: product?.category
    })
    return product?.stoneType
  }

  // Get selected product's currency from Google Sheets
  const getSelectedProductCurrency = (): string => {
    const product = getSelectedProduct()
    const currency = product?.currency || 'TRY'
    console.log('💰 Selected Product Currency Debug:', {
      productName: product?.name,
      currency: currency,
      originalCurrency: product?.currency
    })
    return currency
  }

  // Calculate adjusted price based on thickness multiplier
  const getAdjustedPrice = (): number => {
    const selectedColor = getSelectedColor()
    if (!selectedColor?.price || !formData.tezgahKalinlik) return 0

    
    const basePrice = parseFloat(selectedColor.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
    const thicknessMultiplier = getThicknessPriceMultiplier(formData.tezgahKalinlik)
    return basePrice * thicknessMultiplier
  }

  // Format price with dynamic currency based on selected product (default to Turkish Lira)
  const formatPrice = (price: number): string => {
    const roundedPrice = Math.round(price) // Round to nearest whole number
    const selectedProduct = getSelectedProduct()
    let currency = selectedProduct?.currency || 'TRY' // Default to Turkish Lira
    
    // Validate currency code - must be exactly 3 uppercase letters
    const isValidCurrency = /^[A-Z]{3}$/.test(currency)
    if (!isValidCurrency) {
      console.warn(`Invalid currency code "${currency}", falling back to TRY`)
      currency = 'TRY'
    }
    
    // Determine locale based on currency
    const locale = currency === 'EUR' ? 'de-DE' : 
                   currency === 'USD' ? 'en-US' : 
                   'tr-TR' // Default to Turkish locale
    
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(roundedPrice)
    } catch (error) {
      console.error(`Error formatting price with currency ${currency}:`, error)
      // Fallback to Turkish Lira formatting
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(roundedPrice)
    }
  }

  // Get product-specific height
  // Removed getProductHeight function - all products now use standard thickness options

  // Export form data as PDF quotation
  const handleExportPDF = async (openInNewTab: boolean = false) => {
    const selectedColor = getSelectedColor()
    const productName = products.find(p => p.id === formData.urun)?.name || ''
    const colorName = selectedColor?.name || ''
    const height = formData.tezgahKalinlik || 'h:4 cm' // Default to h:4 cm if no selection
    const price = selectedColor?.price ? parseFloat(selectedColor.price.replace(/[^\d.,]/g, '').replace(',', '.')) : 0

    // Calculate final totals
    const totalPrice = calculateTotalPrice()
    const finalPrice = calculateFinalPrice()

    // Prepare all data for comprehensive PDF export
    const quotationData = {
      // Basic Information
      firma: formData.firmaBayi,
      musteri: formData.musteri,
      mimar: formData.mimar,
      tarih: formData.tarih,
      product: productName,
      color: colorName,
      height: height,
      price: price,
      stoneType: getSelectedProductStoneType(), // From Google Sheets column F
      currency: getSelectedProductCurrency(), // From Google Sheets column G
      
      // Groups - map to match PDF service interfaces
      depthGroups: formData.depthGroups.length > 0 ? formData.depthGroups.map(group => ({
        derinlik: parseInt(group.derinlik.toString()),
        mtul: group.mtul,
        birimFiyati: group.birimFiyati,
        toplamFiyat: group.toplamFiyat
      })) : undefined,
      
      panelGroups: formData.panelGroups.length > 0 ? formData.panelGroups.map(group => ({
        metrekare: group.metrekare,
        birimFiyati: group.birimFiyati,
        toplamFiyat: group.toplamFiyat
      })) : undefined,
      
      davlumbazGroups: formData.davlumbazGroups.length > 0 ? formData.davlumbazGroups.map(group => ({
        metrekare: group.metrekare,
        birimFiyati: group.birimFiyati,
        toplamFiyat: group.toplamFiyat
      })) : undefined,
      
      // Services
      supurgelik: formData.supurgelik.tip && formData.supurgelik.tip !== 'Lütfen Seçin' && formData.supurgelik.tip !== 'LÜTFEN SEÇİN' && formData.supurgelik.tip !== '' ? {
        tip: formData.supurgelik.tip,
        mtul: formData.supurgelik.mtul,
        birimFiyati: formData.supurgelik.birimFiyati,
        toplamFiyat: formData.supurgelik.toplamFiyat
      } : undefined,
      
      eviye: formData.eviye.tip && formData.eviye.tip !== 'Lütfen Seçin' && formData.eviye.tip !== '' ? {
        tip: formData.eviye.tip,
        toplamFiyat: formData.eviye.toplamFiyat
      } : undefined,
      
      specialDetail: formData.specialDetail.tip && formData.specialDetail.tip !== 'Lütfen Seçin' && formData.specialDetail.tip !== '' ? {
        tip: formData.specialDetail.tip,
        mtul: formData.specialDetail.mtul,
        birimFiyati: formData.specialDetail.birimFiyati,
        toplamFiyat: formData.specialDetail.toplamFiyat
      } : undefined,
      
      labor: formData.labor.services.some(s => s.isActive) ? {
        services: formData.labor.services,
        totalPrice: formData.labor.totalPrice
      } : undefined,
      
      // Pricing
      discounts: (formData.discounts.totalListDiscount > 0 || formData.discounts.depthPanelDiscount > 0) ? {
        totalListDiscount: formData.discounts.totalListDiscount,
        depthPanelDiscount: formData.discounts.depthPanelDiscount
      } : undefined,
      
      totalPrice: totalPrice > 0 ? totalPrice : undefined,
      finalPrice: finalPrice > 0 ? finalPrice : undefined
    }

    console.log('Comprehensive PDF Export Data:', quotationData)
    const selectedProduct = getSelectedProduct(); const currency = selectedProduct?.currency || "TRY"; await generateQuotationPDF(quotationData, openInNewTab, language, currency)
  }

  // Handle URL parameters for price list integration
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const productParam = urlParams.get('product')
    const colorParam = urlParams.get('color')
    const source = urlParams.get('source')
    
    if (source === 'price-list' && productParam && products.length > 0) {
      console.log('🔗 Price List Integration: Setting product from URL', productParam)
      
      // Find product by ID
      const product = products.find(p => p.id === productParam)
      if (product) {
        // Set product
        setFormData(prev => ({
          ...prev,
          urun: product.id
        }))
        
        // If color is also specified, set it after a short delay to ensure colors are loaded
        if (colorParam) {
          setTimeout(() => {
            const color = allColors.find(c => c.id === colorParam)
            if (color) {
              console.log('🎨 Price List Integration: Setting color from URL', colorParam)
              setFormData(prev => ({
                ...prev,
                renk: color.id
              }))
            }
          }, 100)
        }
        
        // Clear URL parameters to clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname)
        
        // Show success message
        setTimeout(() => {
          console.log('✅ Price List Integration: Product automatically selected')
        }, 200)
      }
    }
  }, [products, allColors]) // Run when products or colors are loaded

  return (
    <div className="app">
      <LanguageToggle />
      <div className="form-container">
        <div className="glass-card">
          <div className="card-header">
            <div className="logo-container">
              <img src="/logogs.png" alt="Logo" className="logo" />
            </div>
          </div>
          
          <form className="form">
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="firmaBayi" className="label">
                  {t('firma')}
                </label>
                <input
                  type="text"
                  id="firmaBayi"
                  name="firmaBayi"
                  value={formData.firmaBayi}
                  onChange={handleInputChange}
                  className="input"
                  placeholder={t('firmaPlaceholder')}
                  required
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="musteri" className="label">
                  {t('musteri')}
                </label>
                <input
                  type="text"
                  id="musteri"
                  name="musteri"
                  value={formData.musteri}
                  onChange={handleInputChange}
                  className="input"
                  placeholder={t('musteriPlaceholder')}
                  required
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="mimar" className="label">
                  {t('mimar')}
                </label>
                <input
                  type="text"
                  id="mimar"
                  name="mimar"
                  value={formData.mimar}
                  onChange={handleInputChange}
                  className="input"
                  placeholder={t('mimarPlaceholder')}
                  required
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="tarih" className="label">
                  {t('tarih')}
                </label>
                <input
                  type="text"
                  id="tarih"
                  name="tarih"
                  value={formData.tarih}
                  onChange={handleInputChange}
                  className="input"
                  placeholder={t('tarihPlaceholder')}
                  readOnly
                />
              </div>
            </div>
            
            <div className="combo-grid">
              <div className="input-group">
                <label htmlFor="urun" className="label">
                  {t('urun')}
                </label>
                <select
                  id="urun"
                  name="urun"
                  value={formData.urun}
                  onChange={handleInputChange}
                  className="input select"
                  required
                  disabled={isLoadingData}
                >
                  <option value="">
                    {isLoadingData ? t('yukleniyor') : t('urunSeciniz')}
                  </option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label htmlFor="renk" className="label">
                  {t('renk')}
                </label>
                <select
                  id="renk"
                  name="renk"
                  value={formData.renk}
                  onChange={handleInputChange}
                  className="input select"
                  required
                  disabled={!formData.urun || isLoadingData}
                >
                  <option value="">
                    {!formData.urun 
                      ? t('onceUrunSeciniz')
                      : isLoadingData 
                      ? t('yukleniyor')
                      : availableColors.length === 0
                      ? t('renkBulunamadi')
                      : t('renkSeciniz')
                    }
                  </option>
                  {availableColors.map((color) => (
                    <option key={color.id} value={color.id}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label htmlFor="tezgahKalinlik" className="label">
                  {t('tezgahKalinlik')}
                </label>
                <select
                  id="tezgahKalinlik"
                  name="tezgahKalinlik"
                  value={formData.tezgahKalinlik}
                  onChange={handleInputChange}
                  className="input select"
                  required
                  disabled={!formData.renk}
                >
                  <option value="">
                    {!formData.renk ? t('onceRenkSeciniz') : t('kalinlikSeciniz')}
                  </option>
                  <option value="STANDART">STANDART</option>
                  <option value="h:4 cm">h:4 cm</option>
                  <option value="h:5–6 cm">h:5–6 cm</option>
                  <option value="h:7–8 cm">h:7–8 cm</option>
                  <option value="h:9–10 cm">h:9–10 cm</option>
                  <option value="h:11–15 cm">h:11–15 cm</option>
                  <option value="h:16–20 cm">h:16–20 cm</option>
                </select>
              </div>
              
              <div className="input-group price-display">
                <label className="label">
                  {t('fiyat')}
                </label>
                <div className="price-value">
                  {getSelectedColor()?.price && formData.tezgahKalinlik ? (
                    <span className="price">{formatPrice(getAdjustedPrice())}</span>
                  ) : getSelectedColor()?.price ? (
                    <span className="price">₺{getSelectedColor()?.price}</span>
                  ) : (
                    <span className="price-placeholder">{t('renkSeciniz')}</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Depth Groups Section - Full width below combo grid */}
            {(formData.renk || formData.depthGroups.length > 0) && (
              <section className="depth-groups-section">
                <div className="depth-header">
                  <label className="label">{t('derinlik')} ({formData.depthGroups.length}/5)</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (collapsedSections.depth) {
                        toggleSection('depth')
                      }
                      addDepthGroup()
                    }}
                    disabled={formData.depthGroups.length >= 5 || !formData.renk}
                    className="header-add-btn"
                  >
                    + {t('ekle')}
                  </button>
                </div>

                {!collapsedSections.depth && (
                  <>
                    {formData.depthGroups.map((group, index) => (
                      <div key={group.id} className="depth-group">
                        <div className="depth-group-header">
                          <span className="depth-group-title">{t('derinlikField')} {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeDepthGroup(group.id)}
                            className="remove-btn"
                          >
                            ✕
                          </button>
                        </div>
                        
                        <div className="depth-group-fields">
                          <div className="input-group">
                            <label className="label">{t('derinlikField')}</label>
                            <select
                              value={group.derinlik}
                              onChange={(e) => updateDepthGroup(group.id, 'derinlik', e.target.value)}
                              className="input select"
                              disabled={!formData.renk}
                            >
                              <option value="">{t('seciniz')}</option>
                              {getDepthOptions().map((option: string) => (
                                <option key={option} value={option}>{translateDepthOption(option)}</option>
                              ))}
                            </select>
                          </div>

                          <div className="input-group">
                            <label className="label">{t('mtul')}</label>
                            <DecimalInput
                              value={group.mtul || ''}
                              onChange={(value) => updateDepthGroup(group.id, 'mtul', toNumber(value))}
                              placeholder="0.0"
                              disabled={!formData.renk}
                            />
                          </div>

                          <div className="input-group">
                            <label className="label">{t('birimFiyati')}</label>
                            <div className="price-display">
                              <div className="price-value">
                                <span className="price">
                                  {group.birimFiyati > 0 ? formatPrice(group.birimFiyati) : `${formatPrice(0)}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="input-group">
                            <label className="label">{t('toplamFiyat')}</label>
                            <div className="price-display">
                              <div className="price-value">
                                <span className="price">
                                  {group.toplamFiyat > 0 ? formatPrice(group.toplamFiyat) : `${formatPrice(0)}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </section>
            )}
            
            {/* Panel Groups Section - Full width below depth groups */}
            {(formData.renk || formData.panelGroups.length > 0) && (
              <section className="panel-groups-section">
                <div className="panel-header">
                  <label className="label">{t('panel')} ({formData.panelGroups.length}/3)</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (collapsedSections.panel) {
                        toggleSection('panel')
                      }
                      addPanelGroup()
                    }}
                    disabled={formData.panelGroups.length >= 3 || !formData.renk}
                    className="header-add-btn"
                  >
                    + {t('ekle')}
                  </button>
                </div>

                {!collapsedSections.panel && (
                  <>
                    {formData.panelGroups.map((group, index) => (
                      <div key={group.id} className="panel-group">
                        <div className="panel-group-header">
                          <span className="panel-group-title">{t('panel')} {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removePanelGroup(group.id)}
                            className="remove-btn"
                          >
                            ✕
                          </button>
                        </div>
                        
                        <div className="panel-group-fields">
                          <div className="input-group">
                            <label className="label">{t('metrekare')}</label>
                            <DecimalInput
                              value={group.metrekare || ''}
                              onChange={(value) => updatePanelGroup(group.id, 'metrekare', toNumber(value))}
                              placeholder="0.0"
                              disabled={!formData.renk}
                            />
                          </div>

                          <div className="input-group">
                            <label className="label">{t('birimFiyati')}</label>
                            <div className="price-display">
                              <div className="price-value">
                                <span className="price">
                                  {group.birimFiyati > 0 ? formatPrice(group.birimFiyati) : `${formatPrice(0)}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="input-group">
                            <label className="label">{t('toplamFiyat')}</label>
                            <div className="price-display">
                              <div className="price-value">
                                <span className="price">
                                  {group.toplamFiyat > 0 ? formatPrice(group.toplamFiyat) : `${formatPrice(0)}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </section>
            )}
            
            {/* Davlumbaz Groups Section - Full width below panel groups */}
            {(formData.renk || formData.davlumbazGroups.length > 0) && (
              <section className="davlumbaz-groups-section">
                <div className="davlumbaz-header">
                  <label className="label">{t('davlumbaz')} ({formData.davlumbazGroups.length}/3)</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (collapsedSections.davlumbaz) {
                        toggleSection('davlumbaz')
                      }
                      addDavlumbazGroup()
                    }}
                    disabled={formData.davlumbazGroups.length >= 3 || !formData.renk}
                    className="header-add-btn"
                  >
                    + {t('ekle')}
                  </button>
                </div>

                {!collapsedSections.davlumbaz && (
                  <>
                    {formData.davlumbazGroups.map((group, index) => (
                      <div key={group.id} className="davlumbaz-group">
                        <div className="davlumbaz-group-header">
                          <span className="davlumbaz-group-title">{t('davlumbaz')} {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeDavlumbazGroup(group.id)}
                            className="remove-btn"
                          >
                            ✕
                          </button>
                        </div>
                        
                        <div className="davlumbaz-group-fields">
                          <div className="input-group">
                            <label className="label">{t('metrekare')}</label>
                            <DecimalInput
                              value={group.metrekare || ''}
                              onChange={(value) => updateDavlumbazGroup(group.id, 'metrekare', toNumber(value))}
                              placeholder="0.0"
                              disabled={!formData.renk}
                            />
                          </div>
                          
                          <div className="input-group">
                            <label className="label">{t('birimFiyati')}</label>
                            <div className="price-display">
                              <div className="price-value">
                                <span className="price">
                                  {group.birimFiyati > 0 ? formatPrice(group.birimFiyati) : `${formatPrice(0)}`}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="input-group">
                            <label className="label">{t('toplamFiyat')}</label>
                            <div className="price-display">
                              <div className="price-value">
                                <span className="price">
                                  {group.toplamFiyat > 0 ? formatPrice(group.toplamFiyat) : `${formatPrice(0)}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </section>
            )}
            
            {/* SÜPÜRGELİK Section - Full width below davlumbaz groups */}
            {(formData.renk || formData.supurgelik.tip) && (
              <section className="supurgelik-groups-section">
                <div className="supurgelik-header" onClick={() => toggleSection('supurgelik')}>
                  <label className="label">{t('supurgelik')}</label>
                  <div className="section-toggle">
                    <span className="toggle-icon">{collapsedSections.supurgelik ? '▼' : '▲'}</span>
                  </div>
                </div>

                {!collapsedSections.supurgelik && (
                  <div className="supurgelik-group">
                    <div className="supurgelik-group-fields">
                      <div className="input-group">
                        <label htmlFor="supurgelik" className="label">
                          {t('supurgelik')}
                        </label>
                        <select
                          id="supurgelik"
                          name="supurgelik"
                          value={formData.supurgelik.tip}
                          onChange={(e) => updateSupurgelik('tip', e.target.value)}
                          className="input select"
                          disabled={!formData.renk}
                        >
                          {supurgelikOptions.map((option) => (
                            <option key={option} value={option}>
                              {option === 'LÜTFEN SEÇİN' ? t('lutfenSecin') : option}
                            </option>
                          ))}
                        </select>
                                           </div>

                      {formData.supurgelik.tip && formData.supurgelik.tip !== 'LÜTFEN SEÇİN' && (
                        <>
                          <div className="input-group">
                            <label className="label">{t('mtul')}</label>
                            <DecimalInput
                              value={formData.supurgelik.mtul || ''}
                              onChange={(value) => updateSupurgelik('mtul', Math.max(1, toNumber(value)))}
                              placeholder="1"
                              disabled={!formData.renk}
                            />
                          </div>

                          <div className="input-group">
                            <label className="label">{t('birimFiyati')}</label>
                            <div className="price-display">
                              <div className="price-value">
                                <span className="price">
                                  {formatPrice(formData.supurgelik.birimFiyati)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="input-group">
                            <label className="label">{t('toplamFiyat')}</label>
                            <div className="price-display">
                              <div className="price-value">
                                <span className="price">
                                  {formatPrice(formData.supurgelik.toplamFiyat)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}
            
            {/* SPECIAL DETAIL Section - Full width below supurgelik groups */}
            {(formData.renk || formData.specialDetail.tip) && (
              <section className="supurgelik-groups-section">
                <div className="supurgelik-header disabled" style={{opacity: 0.5, cursor: "not-allowed"}} onClick={() => {}}>
                  <label className="label">{t('ozelOnDetay')}<span style={{fontSize: "12px", color: "#999", marginLeft: "8px"}}>(Geçici olarak devre dışı)</span></label>
                  <div className="section-toggle">
                    <span className="toggle-icon">{collapsedSections.specialDetail ? '▼' : '▲'}</span>
                  </div>
                </div>

                {false && (
                  <div className="supurgelik-group">
                    <div className="special-detail-content">
                      <div className="input-group">
                        <label htmlFor="specialDetail" className="label">
                          {t('detaySecimi')}
                        </label>
                        <select
                          id="specialDetail"
                          name="specialDetail"
                          value={formData.specialDetail.tip}
                          onChange={(e) => updateSpecialDetail('tip', e.target.value)}
                          className="input select"
                          disabled={!formData.renk}
                        >
                          {getSpecialDetailOptions().map((option) => (
                            <option key={option} value={option}>
                              {translateSpecialDetailOption(option)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {formData.specialDetail.tip && formData.specialDetail.tip !== 'Lütfen Seçin' && (
                        <div className="special-detail-row">
                          {/* Image Container */}
                          <div className="detail-image-container">
                            <img
                              src={`/images/special-details/${formData.specialDetail.tip.toLowerCase().replace(/\s+/g, '-')}.jpg`}
                              alt={formData.specialDetail.tip}
                              className="detail-image"
                              onError={(e) => {
                                // Fallback to a placeholder image if the specific image doesn't exist
                                (e.target as HTMLImageElement).src = '/images/special-details/placeholder.jpg';
                              }}
                            />
                            <p className="detail-image-caption">{formData.specialDetail.tip}</p>
                          </div>

                          {/* MTÜL Input */}
                          <div className="input-group">
                            <label className="label">{t('mtul')}</label>
                            <DecimalInput
                              value={formData.specialDetail.mtul || ''}
                              onChange={(value) => updateSpecialDetail('mtul', Math.max(1, toNumber(value)))}
                              placeholder="1"
                              disabled={!formData.renk}
                            />
                          </div>

                          {/* Unit Price */}
                          <div className="input-group">
                            <label className="label">{t('birimFiyati')}</label>
                            <div className="price-display">
                              <div className="price-value">
                                <span className="price">
                                  {formatPrice(formData.specialDetail.birimFiyati)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Total Price */}
                          <div className="input-group">
                            <label className="label">{t('toplamFiyat')}</label>
                            <div className="price-display">
                              <div className="price-value">
                                <span className="price">
                                  {formatPrice(formData.specialDetail.toplamFiyat)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}
            
            {/* EVİYE Section - Full width below special detail groups */}
            {(formData.renk || formData.eviye.tip) && (
              <section className="eviye-groups-section">
                <div className="eviye-header disabled" style={{opacity: 0.5, cursor: "not-allowed"}} onClick={() => {}}>
                  <label className="label">{t('ozelUretimEviye')}<span style={{fontSize: "12px", color: "#999", marginLeft: "8px"}}>(Geçici olarak devre dışı)</span></label>
                  <div className="section-toggle">
                    <span className="toggle-icon">{collapsedSections.eviye ? '▼' : '▲'}</span>
                  </div>
                </div>

                {false && (
                  <div className="eviye-group">
                    <div className="eviye-group-fields">
                      <div className="input-group">
                        <label htmlFor="eviye" className="label">
                          {t('eviyeSecimi')}
                        </label>
                        <select
                          id="eviye"
                          name="eviye"
                          value={formData.eviye.tip}
                          onChange={(e) => updateEviye('tip', e.target.value)}
                          className="input select"
                          disabled={!formData.renk}
                        >
                          {eviyeOptions.map((option) => (
                            <option key={option} value={option}>
                              {option === 'Lütfen Seçin' ? t('lutfenSecin') : option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="input-group">
                        <label className="label">{t('eviyeToplam')}</label>
                        <div className="price-display">
                          <div className="price-value">
                            <span className="price">
                              {formatPrice(formData.eviye.toplamFiyat)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
            
            {/* LABOR Section - İşçilik services with modern toggles */}
            {(formData.renk || formData.labor.services.some(s => s.isActive)) && (
              <section className="supurgelik-groups-section">
                <div className="supurgelik-header disabled" style={{opacity: 0.5, cursor: "not-allowed"}} onClick={() => {}}>
                  <label className="label">{t('iscilikHizmetleri')}<span style={{fontSize: "12px", color: "#999", marginLeft: "8px"}}>(Geçici olarak devre dışı)</span></label>
                  <div className="section-toggle">
                    <span className="toggle-icon">{collapsedSections.labor ? '▼' : '▲'}</span>
                  </div>
                </div>

                {false && (
                  <div className="labor-group">
                    <div className="labor-group-fields">
                      {/* Left column */}
                      <div className="labor-column">
                        {formData.labor.services.slice(0, 4).map((service, index) => {
                          // Hide "SU DAMLALIĞI TAKIM FİYATI" for Porcelain stones
                          if (service.name === 'SU DAMLALIĞI TAKIM FİYATI' && isSelectedProductPorcelain()) {
                            return null;
                          }
                          
                          return (
                            <div key={index} className="labor-service-item">
                              <div className="labor-service-header">
                                <span className="labor-service-name">{translateLaborService(service.name)}</span>
                                <label className="toggle-switch">
                                  <input
                                    type="checkbox"
                                    checked={service.isActive}
                                    onChange={(e) => updateLaborService(index, e.target.checked)}
                                    disabled={!formData.renk}
                                  />
                                  <span className="toggle-slider"></span>
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right column */}
                      <div className="labor-column">
                        {formData.labor.services.slice(4, 8).map((service, index) => (
                          <div key={index + 4} className="labor-service-item">
                            <div className="labor-service-header">
                              <span className="labor-service-name">{translateLaborService(service.name)}</span>
                              <label className="toggle-switch">
                                <input
                                  type="checkbox"
                                  checked={service.isActive}
                                  onChange={(e) => updateLaborService(index + 4, e.target.checked)}
                                  disabled={!formData.renk}
                                />
                                <span className="toggle-slider"></span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total price section */}
                    <div className="input-group">
                      <label className="label">{t('iscilikToplam')}</label>
                      <div className="price-display">
                        <div className="price-value">
                          <span className="price">
                            {formatPrice(formData.labor.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
            
            {/* Discount Section - Two rows layout */}
            {(formData.renk || calculateTotalListPrice() > 0) && (
              <div className="discount-section">
                {/* Top Row - Input Fields */}
                <div className="discount-inputs-row">
                  <div className="input-group">
                    <label className="label">{t('iskonto')}</label>
                    <DecimalInput
                      value={formData.discounts.totalListDiscount || ''}
                      onChange={(value) => updateDiscountImmediate('totalListDiscount', value)}
                      placeholder="0"
                      disabled={!formData.renk}
                    />
                  </div>

                  <div className="input-group">
                    <label className="label">{t('iskontoPlus')}</label>
                    <DecimalInput
                      value={formData.discounts.depthPanelDiscount || ''}
                      onChange={(value) => updateDiscountImmediate('depthPanelDiscount', value)}
                      placeholder="0"
                      disabled={!formData.renk}
                    />
                  </div>
                </div>

                {/* Bottom Row - Read-only Values */}
                <div className="discount-values-row">
                  <div className="value-group">
                    <label className="label">{t('listeFiyati')}</label>
                    <div className="price-display">
                      <div className="price-value">
                        <span className="price">
                          {formatPrice(calculateTotalListPrice())}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="value-group">
                    <label className="label">{t('iskontoFiyat')}</label>
                    <div className="price-display">
                      <div className="price-value">
                        <span className="price">
                          {formatPrice(calculateFinalPrice())}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="value-group">
                    <label className="label">{t('kdv')}</label>
                    <div className="price-display">
                      <div className="price-value">
                        <span className="price">
                          {formatPrice(calculateFinalPrice() * 0.20)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="value-group">
                    <label className="label">{t('genelToplam')}</label>
                    <div className="price-display">
                      <div className="price-value">
                        <span className="price final-price">
                          {formatPrice(calculateFinalPrice() * 1.20)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <button 
              type="button" 
              onClick={handleReset}
              className="reset-btn"
            >
              🗑️ {t('reset')}
            </button>
            
            <div className="pdf-buttons">
              <button 
                type="button"
                onClick={() => handleExportPDF(false)}
                className="pdf-btn"
                disabled={!formData.firmaBayi && !formData.musteri && !formData.urun}
              >
                📄 {t('download')}
              </button>
              
              <button 
                type="button"
                onClick={() => handleExportPDF(true)}
                className="pdf-btn pdf-btn-outline"
                disabled={!formData.firmaBayi && !formData.musteri && !formData.urun}
              >
                🔗 {t('open')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App

// Performance monitoring (development only)
if (import.meta.env.DEV) {
  console.log('App component rendered at:', new Date().toISOString());
}
