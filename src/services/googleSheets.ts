// services/googleSheets.ts
// Load Products & Colors from Apps Script JSON endpoint with local caching.
// Filters out inactive ("Hayır") items just in case (server already filters).

export interface Product {
  id: string;
  name: string;
  category?: 'Quartz' | 'Porcelain'; // New field for stone categorization
  stoneType?: string; // Column F: Stone Type (Taş Tipi)
  currency?: string; // Column G: Currency (Para Birimi)
}

export interface Color {
  id: string;
  name: string;
  productId: string;
  price: string;
  currency?: string;
  hexColor?: string;
  imageUrl?: string;
}

// Helper function to categorize stones based on their names or explicit stoneType field
const categorizeStone = (productName: string, stoneType?: string): 'Quartz' | 'Porcelain' => {
  // First check if we have explicit stone type from Google Sheets
  if (stoneType) {
    const normalizedType = stoneType.toUpperCase();
    if (normalizedType.includes('QUARTZ') || normalizedType.includes('KUVARS')) {
      return 'Quartz';
    }
    if (normalizedType.includes('PORCELAIN') || normalizedType.includes('PORSELEN')) {
      return 'Porcelain';
    }
  }
  
  // Fallback to name-based categorization
  const name = productName.toUpperCase();
  
  // Quartz stones
  if (name.includes('BELENCO') || 
      name.includes('ÇIMSTONE') || 
      name.includes('COANTE') ||
      name.includes('SILESTONE') ||
      name.includes('T-ONE')) {
    return 'Quartz';
  }
  
  // Porcelain stones (default for most)
  if (name.includes('ANATOLIA') ||
      name.includes('AVANTE') ||
      name.includes('DEKTON') ||
      name.includes('FLORIM') ||
      name.includes('INFINITY') ||
      name.includes('LAMAR') ||
      name.includes('LAMINAM') ||
      name.includes('LEVEL') ||
      name.includes('MATERIA') ||
      name.includes('MYTOP') ||
      name.includes('NEOLITH') ||
      name.includes('NG STONE')) {
    return 'Porcelain';
  }
  
  // Default to Porcelain if not specified
  return 'Porcelain';
};

interface CachedData {
  products: Product[];
  colors: Color[];
  timestamp: number;
  etag?: string; // For efficient change detection
  version?: number; // For versioning
}

const CACHE_KEY = 'granitstone_data_cache';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for regular cache
const STALE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for stale-while-revalidate
const POLL_INTERVAL = 5 * 1000; // Check for updates every 5 seconds
const RETRY_DELAYS = [1000, 2000, 5000]; // Progressive retry delays

// Enhanced polling state
let pollingInterval: number | null = null;
let retryCount = 0;
let currentVersion = 0;
let onDataUpdateCallback: ((data: { products: Product[]; colors: Color[] }) => void) | null = null;
let isOnline = navigator.onLine;

// Network status detection
window.addEventListener('online', () => {
  isOnline = true;
  console.log('🌐 Network restored - resuming data sync');
  if (onDataUpdateCallback) {
    startRealTimeUpdates(onDataUpdateCallback);
  }
});

window.addEventListener('offline', () => {
  isOnline = false;
  console.log('📡 Network offline - using cached data');
});

const API_BASE = import.meta.env.VITE_SHEETS_API_URL; // e.g. https://script.google.com/.../exec
const PRODUCTS_URL = `${API_BASE}?sheet=Products`;
const COLORS_URL = `${API_BASE}?sheet=Colors`;

/* -------------------- Cache helpers -------------------- */
function getCachedData(): CachedData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedData = JSON.parse(cached);
    const isExpired = Date.now() - data.timestamp > CACHE_DURATION;
    const isStale = Date.now() - data.timestamp > STALE_CACHE_DURATION;
    
    if (isStale) {
      console.log('⏰ Cache completely stale');
      return null;
    }

    if (isExpired) {
      console.log('🔄 Cache expired but still usable - will refresh in background');
    } else {
      console.log('✅ Using fresh cached data');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error reading cache:', error);
    return null;
  }
}

function setCachedData(products: Product[], colors: Color[]) {
  try {
    currentVersion++;
    const data: CachedData = {
      products,
      colors,
      timestamp: Date.now(),
      version: currentVersion
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    console.log(`💾 Data cached successfully (v${currentVersion})`);
  } catch (error) {
    console.error('❌ Error caching data:', error);
  }
}

// Check if cache is expired but still usable
function isCacheStale(): boolean {
  const cached = getCachedData();
  if (!cached) return true;
  return Date.now() - cached.timestamp > CACHE_DURATION;
}

export const clearCache = (): void => {
  localStorage.removeItem(CACHE_KEY);
  console.log('🗑️ Cache cleared - fresh data will be loaded on next request');
};

// Debug function to test and clear everything
export const debugGoogleSheets = async (): Promise<any> => {
  console.log('🔍 DEBUG: Testing Google Sheets connection...');
  
  // Clear cache first
  clearCache();
  
  // Test URLs directly
  console.log('📍 Testing URLs:');
  console.log('  Products:', PRODUCTS_URL);
  console.log('  Colors:', COLORS_URL);
  
  try {
    const [prodRes, colRes] = await Promise.all([
      fetch(PRODUCTS_URL).then(r => r.json()),
      fetch(COLORS_URL).then(r => r.json())
    ]);
    
    console.log('✅ Raw Products data:', prodRes);
    console.log('✅ Raw Colors data:', colRes);
    
    // Test normalization
    const normalizedProds = prodRes.map(normalizeProduct).filter(Boolean);
    const normalizedCols = colRes.map(normalizeColor).filter(Boolean);
    
    console.log('🔄 Normalized Products:', normalizedProds);
    console.log('🔄 Normalized Colors:', normalizedCols);
    
    return { products: normalizedProds, colors: normalizedCols };
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    throw error;
  }
};

// Force refresh data immediately (clears cache and fetches new data)
export const forceRefresh = async (): Promise<{ products: Product[]; colors: Color[] }> => {
  clearCache();
  return await fetchAllDataFromSheets();
};

// Enhanced real-time polling with smart updates
export const startRealTimeUpdates = (callback: (data: { products: Product[]; colors: Color[] }) => void): void => {
  onDataUpdateCallback = callback;
  
  // Clear any existing interval
  if (pollingInterval) {
    window.clearInterval(pollingInterval);
  }
  
  if (!isOnline) {
    console.log('📡 Offline - real-time updates will start when online');
    return;
  }
  
  const poll = async () => {
    if (!isOnline) return;
    
    try {
      const cached = getCachedData();
      if (!cached) {
        // No cache - fetch initial data
        console.log('📭 No cache - fetching initial data...');
        const freshData = await fetchAllDataFromSheets();
        if (onDataUpdateCallback) {
          onDataUpdateCallback(freshData);
        }
        return;
      }
      
      // Use background refresh for updates
      await fetchFreshDataInBackground();
      
      // Reset retry count on successful poll
      retryCount = 0;
    } catch (error) {
      console.warn(`⚠️ Polling error (attempt ${retryCount + 1}):`, error);
      retryCount++;
      
      // Implement exponential backoff for polling errors
      if (retryCount >= 3) {
        console.log('🛑 Too many polling errors - increasing interval');
        // Temporarily increase polling interval
        if (pollingInterval) {
          window.clearInterval(pollingInterval);
          pollingInterval = window.setInterval(poll, POLL_INTERVAL * 2);
        }
      }
    }
  };
  
  // Start polling
  pollingInterval = window.setInterval(poll, POLL_INTERVAL);
  
  console.log('✅ Enhanced real-time updates started');
};

// Stop real-time polling
export const stopRealTimeUpdates = (): void => {
  if (pollingInterval) {
    window.clearInterval(pollingInterval);
    pollingInterval = null;
  }
  onDataUpdateCallback = null;
  console.log('🛑 Real-time updates stopped');
};

/* -------------------- Normalization helpers -------------------- */
// Find a key on an object by trying multiple candidate names (case-insensitive).
const findKey = (obj: Record<string, any>, candidates: string[]): string | null => {
  const lowerKeys = Object.keys(obj).reduce<Record<string, string>>((acc, k) => {
    acc[k.toLowerCase()] = k;
    return acc;
  }, {});
  for (const c of candidates) {
    const hit = lowerKeys[c.toLowerCase()];
    if (hit) return hit;
  }
  return null;
};

// Normalize one product row object from server → Product
const normalizeProduct = (row: Record<string, any>): Product | null => {
  // Common header variants (TR/EN) - updated for actual Google Sheets headers
  const idKey = findKey(row, ['id', 'ıd', 'ID', 'ürün id', 'urun id', 'productid', 'product id']);
  const nameKey = findKey(row, ['name', 'ad', 'adı', 'urun', 'ürün', 'ürün adı', 'Ürün Adı', 'urun adı', 'product', 'product name']);
  const activeKey = findKey(row, ['active', 'aktif', 'Aktif']);
  const stoneTypeKey = findKey(row, ['stonetype', 'stone type', 'taş tipi', 'Taş tipi', 'tas tipi', 'stone_type']);
  const currencyKey = findKey(row, ['currency', 'para birimi', 'Para Birimi', 'para_birimi']);

  // Exclude inactive
  if (activeKey && String(row[activeKey]) === 'Hayır') return null;

  // If headers are unknown but the server preserved column order, fall back to column positions.
  if (!idKey || !nameKey) {
    const vals = Object.values(row);
    if (vals.length >= 2) {
      const productName = String(vals[1] ?? '').trim();
      let currency = vals[6] ? String(vals[6]).trim() : undefined;
      
      // Validate and clean currency code
      if (currency) {
        currency = currency.toUpperCase()
        if (!/^[A-Z]{3}$/.test(currency)) {
          console.warn(`Invalid currency code "${currency}" for product "${productName}", ignoring`)
          currency = undefined
        }
      }
      
      return {
        id: String(vals[0] ?? '').trim(),
        name: productName,
        category: categorizeStone(productName, vals[5] ? String(vals[5]).trim() : undefined), // Use both name and stoneType
        stoneType: vals[5] ? String(vals[5]).trim() : undefined, // Column F
        currency: currency, // Column G
      };
    }
    return null;
  }

  const productName = String(row[nameKey] ?? '').trim();
  const stoneType = stoneTypeKey ? String(row[stoneTypeKey] ?? '').trim() : undefined;
  let currency = currencyKey ? String(row[currencyKey] ?? '').trim() : undefined;
  
  // Validate and clean currency code
  if (currency) {
    currency = currency.toUpperCase()
    // Must be exactly 3 letters for valid ISO currency code
    if (!/^[A-Z]{3}$/.test(currency)) {
      console.warn(`Invalid currency code "${currency}" for product "${productName}", ignoring`)
      currency = undefined
    }
  }
  
  return {
    id: String(row[idKey] ?? '').trim(),
    name: productName,
    category: categorizeStone(productName, stoneType), // Use both name and stoneType for categorization
    stoneType: stoneType || undefined,
    currency: currency || undefined,
  };
};

// Normalize one color row object from server → Color
const normalizeColor = (row: Record<string, any>): Color | null => {
  // Updated for actual Google Sheets headers
  const idKey = findKey(row, ['id', 'ıd', 'ID', 'ID ', 'renk id', 'color id']);
  const nameKey = findKey(row, ['name', 'renk', 'renk adı', 'Renk Adı', 'color', 'color name']);
  const productIdKey = findKey(row, ['productid', 'product id', 'ürün id', 'Ürün ID', 'urun id', 'product']);
  const priceKey = findKey(row, ['price', 'fiyat', 'Fiyat']);
  const currencyKey = findKey(row, ['currency', 'para birimi', 'para_birimi']);
  const hexKey = findKey(row, ['hexcolor', 'hex', 'hex_color', 'renk kodu', 'Renk Kodu']);
  const imgKey = findKey(row, ['imageurl', 'image', 'image_url', 'resim', 'görsel']);
  const activeKey = findKey(row, ['active', 'aktif', 'Aktif']);

  if (activeKey && String(row[activeKey]) === 'Hayır') return null;

  // Fallback by position if headers are unknown
  const vals = Object.values(row);
  if (!idKey || !nameKey || !productIdKey) {
    if (vals.length >= 3) {
      return {
        id: String(vals[0] ?? '').trim(),
        name: String(vals[2] ?? '').trim(),     // in your sheet: C = color name
        productId: String(vals[1] ?? '').trim(),// B = productId
        price: String(vals[4] ?? vals[3] ?? '0').toString(), // E or D
      };
    }
    return null;
  }

  return {
    id: String(row[idKey] ?? '').trim().replace(/\s+$/, ''), // Remove trailing spaces
    name: String(row[nameKey] ?? '').trim(),
    productId: String(row[productIdKey] ?? '').trim(),
    price: String((row[priceKey!] ?? '0')).toString(),
    currency: currencyKey ? String(row[currencyKey]) : undefined,
    hexColor: hexKey ? String(row[hexKey]) : undefined,
    imageUrl: imgKey ? String(row[imgKey]) : undefined,
  };
};

// Enhanced generic GET JSON helper with retry and CORS-friendly requests
const getJson = async <T = any>(url: string): Promise<{ data: T; etag?: string }> => {
  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    try {
      // Use simple GET request to avoid CORS preflight
      // Google Apps Script works better with simple requests
      const res = await fetch(url, { 
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json() as T;
      
      retryCount = 0; // Reset on success
      return { data };
    } catch (error) {
      console.error(`❌ Fetch attempt ${attempt + 1} failed:`, error);
      
      if (attempt < RETRY_DELAYS.length - 1) {
        const delay = RETRY_DELAYS[attempt];
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
      } else {
        throw error;
      }
    }
  }
  throw new Error('All retry attempts failed');
};

/* -------------------- Public API (same as before) -------------------- */
// Enhanced instant data with true instant loading
export const getInstantData = (): { products: Product[]; colors: Color[] } => {
  const cached = getCachedData();
  if (cached) {
    console.log('⚡ Instant load from cache');
    
    // If cache is stale but still usable, trigger background refresh
    if (isCacheStale() && isOnline) {
      console.log('🔄 Triggering background refresh...');
      setTimeout(() => fetchFreshDataInBackground(), 0);
    }
    
    return { products: cached.products, colors: cached.colors };
  }
  
  console.log('📭 No cache available - returning empty data');
  return { products: [], colors: [] };
};

// Background refresh without blocking UI
async function fetchFreshDataInBackground(): Promise<void> {
  if (!isOnline || !API_BASE) return;
  
  try {
    console.log('🔄 Background refresh starting...');
    
    const [productsResponse, colorsResponse] = await Promise.all([
      getJson<Record<string, any>[]>(PRODUCTS_URL).catch(() => null),
      getJson<Record<string, any>[]>(COLORS_URL).catch(() => null)
    ]);

    // Handle the case where data hasn't changed
    if (!productsResponse && !colorsResponse) {
      console.log('💾 No updates needed - data unchanged');
      return;
    }

    const productsRaw = productsResponse?.data || [];
    const colorsRaw = colorsResponse?.data || [];

    // Process data
    const products = productsRaw
      .map(normalizeProduct)
      .filter((p: Product | null): p is Product => !!p);

    const colors = colorsRaw
      .map(normalizeColor)
      .filter((c: Color | null): c is Color => !!c);

    // Update cache
    setCachedData(products, colors);
    
    // Notify UI of fresh data
    if (onDataUpdateCallback) {
      console.log('🔄 Notifying UI of fresh data');
      onDataUpdateCallback({ products, colors });
    }
    
    console.log('✅ Background refresh completed');
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_MODIFIED') {
      console.log('💾 Data unchanged - no update needed');
      return;
    }
    console.error('❌ Background refresh failed:', error);
  }
}

export const fetchAllDataFromSheets = async (): Promise<{ products: Product[]; colors: Color[] }> => {
  // Use cache if valid (not stale)
  const cached = getCachedData();
  if (cached && !isCacheStale()) {
    console.log('✅ Using fresh cache');
    return { products: cached.products, colors: cached.colors };
  }

  if (!API_BASE) {
    console.error('Missing VITE_SHEETS_API_URL');
    return { products: [], colors: [] };
  }

  try {
    console.log('🔄 Fetching fresh data from Google Sheets...');
    
    // Fetch in parallel with enhanced retry mechanism
    const [productsResponse, colorsResponse] = await Promise.all([
      getJson<Record<string, any>[]>(PRODUCTS_URL),
      getJson<Record<string, any>[]>(COLORS_URL),
    ]);

    const productsRaw = productsResponse.data;
    const colorsRaw = colorsResponse.data;

    // Normalize + filter nulls
    const products = (productsRaw || [])
      .map(normalizeProduct)
      .filter((p: Product | null): p is Product => !!p);

    const colors = (colorsRaw || [])
      .map(normalizeColor)
      .filter((c: Color | null): c is Color => !!c);

    // Client-side safety filter for inactive ("Hayır") fields that slipped through
    const stripInactive = <T extends Record<string, any>>(rows: T[]): T[] =>
      rows.filter(r => {
        const k = findKey(r, ['active', 'aktif']);
        return !k || String((r as any)[k]) !== 'Hayır';
      });

    const finalProducts = stripInactive(products as any) as Product[];
    const finalColors = stripInactive(colors as any) as Color[];
    
    // Cache with simplified caching
    setCachedData(finalProducts, finalColors);
    
    console.log('✅ Fresh data fetched and cached');
    return { products: finalProducts, colors: finalColors };
  } catch (err) {
    console.error('Error fetching JSON data:', err);
    
    // Use any available cache (even stale) as fallback
    const fallback = getCachedData();
    if (fallback) {
      console.warn('⚠️ Using cached data as fallback');
      return { products: fallback.products, colors: fallback.colors };
    }
    
    return { products: [], colors: [] };
  }
};

export const fetchProductsFromSheets = async (): Promise<Product[]> => {
  const { products } = await fetchAllDataFromSheets();
  return products;
};

export const fetchAllColorsFromSheets = async (): Promise<Color[]> => {
  const { colors } = await fetchAllDataFromSheets();
  return colors;
};

// Same signature your App.tsx already uses
export const getColorsForProduct = (allColors: Color[], productId: string): Color[] => {
  return allColors.filter(c => c.productId === productId);
};

export const fetchColorsForProduct = async (productId: string): Promise<Color[]> => {
  const allColors = await fetchAllColorsFromSheets();
  return getColorsForProduct(allColors, productId);
};

// Export the main optimized function for App.tsx to use
export const getGoogleSheetsData = async (): Promise<{ products: Product[]; colors: Color[] }> => {
  // Strategy: Always return cached data instantly if available, 
  // then fetch fresh data in background
  const cached = getCachedData();
  
  if (cached) {
    console.log('⚡ Instant load from cache');
    
    // If cache is stale, fetch fresh data in background
    if (isCacheStale() && isOnline) {
      console.log('🔄 Background refresh triggered');
      setTimeout(() => fetchFreshDataInBackground(), 0);
    }
    
    return { products: cached.products, colors: cached.colors };
  }
  
  // No cache - must fetch fresh data (blocking call)
  console.log('📡 No cache available - fetching fresh data...');
  return await fetchAllDataFromSheets();
};

export const getColorById = (colors: Color[], colorId: string): Color | undefined => {
  return colors.find(c => c.id === colorId);
};
