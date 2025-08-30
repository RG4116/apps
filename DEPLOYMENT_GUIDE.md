# Deployment Troubleshooting Guide

## 🔍 Diagnosing White Page Issues

### 1. Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for error messages (red text)
4. Common errors and solutions:

#### Error: "Failed to fetch module"
- **Cause**: Incorrect base path in vite.config.ts
- **Solution**: Update `base` property for your platform

#### Error: "VITE_PRODUCTS_CSV_URL is undefined"
- **Cause**: Missing environment variables
- **Solution**: Set environment variables on your hosting platform

#### Error: "TypeError: Cannot read property of undefined"
- **Cause**: App crashes during initialization
- **Solution**: Check the specific error line and fix the code

### 2. Check Network Tab
1. Go to Network tab in developer tools
2. Reload the page
3. Look for failed requests (red entries)
4. Common issues:
   - 404 errors on CSS/JS files = base path issue
   - CORS errors = environment variable/API issue

## 🚀 Platform-Specific Solutions

### GitHub Pages
1. **Configure vite.config.ts** (already done):
   ```typescript
   base: command === 'build' ? '/apps/' : '/',
   ```

2. **Enable GitHub Pages**:
   - Go to your GitHub repository
   - Settings → Pages
   - Source: GitHub Actions (recommended) or Deploy from branch
   - If using branch: select `gh-pages` branch

3. **Set Environment Variables**:
   - Go to Settings → Secrets and variables → Actions
   - Add secrets:
     - `VITE_PRODUCTS_CSV_URL`
     - `VITE_COLORS_CSV_URL`

4. **Deploy**:
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin main
   ```

### Netlify
1. **Configure for SPA** (already done):
   - `public/_redirects` file exists

2. **Environment Variables**:
   - Go to Site settings → Environment variables
   - Add:
     - `VITE_PRODUCTS_CSV_URL`
     - `VITE_COLORS_CSV_URL`

3. **Deploy**:
   - Drag & drop `dist` folder to Netlify
   - Or connect GitHub repository

### Vercel
1. **Environment Variables**:
   - Go to Project settings → Environment Variables
   - Add:
     - `VITE_PRODUCTS_CSV_URL`
     - `VITE_COLORS_CSV_URL`

2. **Deploy**:
   - Connect GitHub repository
   - Or use Vercel CLI: `vercel --prod`

### Your Own Server
1. **Configure Web Server**:
   ```nginx
   # Nginx configuration
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

2. **Upload Files**:
   - Upload entire `dist` folder contents
   - Ensure environment variables are set

## 🔧 Quick Fixes

### Fix 1: Reset to Simple Base Path
If you're not using GitHub Pages, revert the base path:

```typescript
// vite.config.ts
export default defineConfig({
  base: '/',  // Simple base path
  // ... rest of config
})
```

### Fix 2: Add Fallback Environment Variables
Create a `.env.production` file:

```bash
VITE_PRODUCTS_CSV_URL=https://docs.google.com/spreadsheets/d/e/2PACX-1vQKCEKXh6xCFX1lpKsReu_pAXuBvHj-dtEt0yb1m9w_jPVvbDI35e7QAxRntjRcZQ/pub?gid=1918908826&single=true&output=csv
VITE_COLORS_CSV_URL=https://docs.google.com/spreadsheets/d/e/2PACX-1vQKCEKXh6xCFX1lpKsReu_pAXuBvHj-dtEt0yb1m9w_jPVvbDI35e7QAxRntjRcZQ/pub?gid=407066559&single=true&output=csv
```

### Fix 3: Test Local Production Build
```bash
npm run build
npm run preview
```
Then open the URL shown to test if it works locally.

## 📝 Debugging Steps

1. **Test locally first**:
   ```bash
   npm run build
   npm run preview
   ```

2. **Check built files**:
   ```bash
   ls -la dist/
   ```

3. **Verify environment variables**:
   - Check browser console for debug logs
   - Ensure URLs are accessible

4. **Test with simple static server**:
   ```bash
   cd dist
   python -m http.server 8000
   # or
   npx serve .
   ```

## 🆘 Still Having Issues?

### Manual Debug Version
1. Use the debug version created: `index-debug.html`
2. Temporarily rename it to `index.html` in the `dist` folder
3. This will show detailed error messages

### Contact Information
- Check browser console for detailed error messages
- Verify your Google Sheets URLs are publicly accessible
- Ensure your hosting platform supports SPAs (Single Page Applications)

## ✅ Success Checklist

- [ ] App builds without errors (`npm run build`)
- [ ] Environment variables are set on hosting platform
- [ ] Base path is correct for your hosting platform
- [ ] Browser console shows no errors
- [ ] Google Sheets URLs are accessible
- [ ] SPA redirects are configured (if needed)
