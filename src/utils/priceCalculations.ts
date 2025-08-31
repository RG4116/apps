// Price calculation utilities - shared between main app and PWA

// Get thickness-based price multiplier following the specified pattern
export const getThicknessPriceMultiplier = (thickness: string): number => {
  // Base multipliers following the pattern (baseline: h:4cm + 65cm = base price):
  // h:4cm → 1.00 (base price - 65cm depth + h:4cm thickness)
  // h:1.5cm, h:1.2cm, h:2cm → 0.90 (discount for thinner than base)
  // 5–6 cm → 1.10 (premium over base)
  // 7–8 cm → 1.15 (premium over base) 
  // 9–10 cm → 1.20 (premium over base)
  // 11–15 cm → 1.30 (premium over base)
  // 16–20 cm → 1.45 (premium over base)
  
  // Normalize thickness string for parsing (handle different dash types)
  const normalizedThickness = thickness.replace(/[–—]/g, '-')
  
  // Check longer patterns first to avoid partial matches
  if (normalizedThickness.includes('16-20') || normalizedThickness.includes('16–20')) {
    return 1.45 // Premium over base
  } else if (normalizedThickness.includes('11-15') || normalizedThickness.includes('11–15')) {
    return 1.30 // Premium over base
  } else if (normalizedThickness.includes('9-10') || normalizedThickness.includes('9–10')) {
    return 1.20 // Premium over base
  } else if (normalizedThickness.includes('7-8') || normalizedThickness.includes('7–8')) {
    return 1.15 // Premium over base
  } else if (normalizedThickness.includes('5-6') || normalizedThickness.includes('5–6')) {
    return 1.10 // Premium over base
  } else if (normalizedThickness.includes('4')) {
    return 1.00 // Base price for h:4cm thickness
  } else if (normalizedThickness.includes('1.5') || normalizedThickness.includes('1.2') || normalizedThickness.includes('2')) {
    return 0.90 // Discount for thinner than base (h:4cm)
  }
  
  return 1.00 // Default to base price (h:5-6cm)
}

// Get depth-based price multiplier following the specified pattern
export const getDepthPriceMultiplier = (depth: string): number => {
  // Base multipliers following the exact specification (baseline: 65cm):
  // 65cm → 1.000 (baseline)
  // 70cm → 1.165 (+16.5% from 65cm)
  // 80cm → 1.335 (+33.5% from 65cm) 
  // 90cm → 2.000 (+100% sharp jump from 65cm)
  // 100/110/120cm → 2.000 (prices stabilize at 90cm+ level)
  
  if (depth.includes('61') || depth.includes('65')) {
    return 1.000 // Base price for 61cm/65cm baseline
  } else if (depth.includes('70')) {
    return 1.165 // +16.5% from baseline (65cm)
  } else if (depth.includes('80')) {
    return 1.335 // +33.5% from baseline (65cm)
  } else if (depth.includes('90')) {
    return 2.000 // +100% sharp jump from baseline (65cm)
  } else if (depth.includes('100') || depth.includes('110') || depth.includes('120')) {
    return 2.000 // Prices stabilize at 90cm+ level
  }
  
  return 1.000 // Default to baseline price
}

// Currency conversion multipliers
export const getCurrencyMultiplier = (currency: string): number => {
  switch (currency) {
    case 'EUR':
      return 35 // EUR to TL
    case 'USD':
      return 32 // USD to TL
    default:
      return 1 // TRY (no conversion)
  }
}

// Category-based pricing multipliers
export const getCategoryMultiplier = (category: string): number => {
  if (category === 'Porcelain') {
    return 1.2
  }
  return 1.0 // Quartz and others
}

// Calculate final base price with all multipliers
export const calculateFinalBasePrice = (
  basePrice: number,
  currency: string,
  category: string
): number => {
  const currencyMultiplier = getCurrencyMultiplier(currency)
  const categoryMultiplier = getCategoryMultiplier(category)
  return basePrice * currencyMultiplier * categoryMultiplier
}

// Group multipliers for pricing tables
export const getGroupMultipliers = () => [
  { name: 'GROUP 01', multiplier: 1.0 },
  { name: 'GROUP 02', multiplier: 1.125 },
  { name: 'GROUP 03', multiplier: 1.167 },
  { name: 'GROUP 04', multiplier: 1.229 },
  { name: 'GROUP 05', multiplier: 1.292 }
]
