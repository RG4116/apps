x# Google Sheets Real-Time Integration Setup

This application integrates with Google Sheets using Apps Script JSON endpoints for dynamic product and color data with real-time updates.

## Setup Instructions

### 1. Create Google Sheets with Active Column

Create two Google Sheets with the following structure:

#### Products Sheet
| A (id) | B (name) | C (active) |
|--------|----------|-----------|
| 1      | Product A | Evet     |
| 2      | Product B | Evet     |

#### Colors Sheet  
| A (id) | B (name) | C (productId) | D (price) | E (active) |
|--------|----------|---------------|-----------|-----------|
| 1      | Red      | 1             | 100       | Evet      |
| 2      | Blue     | 1             | 120       | Evet      |
| 3      | Green    | 2             | 150       | Hayır     |

### 2. Deploy Apps Script Web App

1. Create a new Apps Script project
2. Add the provided doGet() function code
3. Deploy as web app with "Anyone with the link" access
4. Copy the web app URL

### 3. Configure Environment Variables

Create a `.env` file with your Apps Script URL:

```env
VITE_SHEETS_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 4. Real-Time Features

The application now provides:

**Instant Loading:** 
- Uses cached data for immediate display (< 100ms)
- Fetches fresh data in background
- No loading spinners for returning users

**Real-Time Updates:**
- Polls for changes every 10 seconds
- Automatically updates UI when data changes
- Removes deleted items immediately
- No refresh button needed

**Smart Caching:**
- 30-second cache for balance of speed and freshness
- Survives browser refresh
- Graceful fallback to expired cache on network errors

### 5. Data Structure

The application expects:

**Products:** `id`, `name`, and `active` columns  
**Colors:** `id`, `name`, `productId` (foreign key), `price`, and `active` columns

**Active Status:** Set to "Evet" (Yes) or "Hayır" (No) to show/hide items

### 6. Performance Benefits

- **Sub-second initial load** with cached data
- **Real-time updates** without user intervention  
- **Automatic cleanup** of deleted items
- **Network resilience** with smart fallback
- **Zero maintenance** - works automatically

## Benefits vs CSV Approach

✅ **Real-time updates** (10-second polling)  
✅ **Instant initial load** (cache-first)  
✅ **Active/inactive filtering** built-in  
✅ **Better error handling** and fallbacks  
✅ **No manual refresh** required  
✅ **Scalable architecture** ready for webhooks
