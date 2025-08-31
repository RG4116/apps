
// Format price with currency symbol based on the selected currency
export const formatPrice = (price, currency = 'TRY') => {
  const roundedPrice = Math.round(price) // Round to nearest whole number
  
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
