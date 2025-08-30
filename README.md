# Modern Form PWA

A beautiful, responsive Progressive Web App (PWA) built with React, TypeScript, and Vite featuring modern CSS techniques and a sleek form interface.

![Modern Design](https://img.shields.io/badge/Design-Modern-blue)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-green)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![Responsive](https://img.shields.io/badge/Design-Responsive-orange)

## ✨ Features

### 🎨 Modern Design
- **Glass Morphism** - Beautiful translucent glass-like effects
- **Gradient Animations** - Smooth, animated background gradients
- **Modern Typography** - Inter font with proper weight hierarchy
- **Smooth Animations** - CSS cubic-bezier animations for premium feel

### 📱 Progressive Web App
- **Service Worker** - Automatic caching and offline support
- **Web App Manifest** - Installable on mobile and desktop
- **Responsive Design** - Works perfectly on all screen sizes
- **Fast Loading** - Optimized with Vite for instant loading

### 🎯 User Experience
- **Accessible** - Full keyboard navigation and screen reader support
- **Form Validation** - Real-time validation with visual feedback
- **Dark Mode** - Automatic dark/light mode based on system preference
- **Reduced Motion** - Respects user's motion preferences
- **Dynamic Dropdowns** - Product-dependent color selection
- **Google Sheets Integration** - Live data from Google Sheets

### 🛠 Modern CSS Techniques
- **CSS Custom Properties** - Themeable design system
- **Container Queries** - Element-based responsive design
- **CSS Grid & Flexbox** - Modern layout techniques
- **Backdrop Filters** - Hardware-accelerated glass effects
- **Modern Viewport Units** - Uses `dvh` for better mobile support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## 📱 PWA Features

### Installation
- Visit the app in a modern browser
- Look for the "Install" prompt or add to home screen
- Enjoy the native app-like experience

### Offline Support
- The app works offline after first visit
- Form data is preserved during network issues
- Automatic updates when connection is restored

## 📊 Google Sheets Integration

### Data Structure
The form fetches product and color data from Google Sheets:
- **Products Sheet**: Contains product IDs and names
- **Colors Sheet**: Contains colors linked to specific products

### Setup
1. See `GOOGLE_SHEETS_SETUP.md` for detailed setup instructions
2. Configure your `.env.local` file with Google Sheets credentials
3. The form automatically loads products and filters colors based on selection

### Features
- **Dynamic Loading**: Products and colors load from Google Sheets
- **Dependent Dropdowns**: Color options change based on selected product
- **Real-time Updates**: Changes in Google Sheets reflect in the form
- **Error Handling**: Graceful fallbacks when data loading fails

## 🎨 Customization

### Theming
All colors and spacing are defined using CSS custom properties in `src/index.css`:

```css
:root {
  --primary-color: #6366f1;
  --accent-color: #f59e0b;
  --space-md: 1rem;
  /* ... more variables */
}
```

### Adding New Form Fields
Extend the `FormData` interface in `src/App.tsx`:

```typescript
interface FormData {
  firmaBayi: string
  musteri: string
  mimar: string
  tarih: string
  // Add new fields here
  email?: string
}
```

## 🏗 Project Structure

```
src/
├── App.tsx          # Main application component
├── App.css          # Component-specific styles
├── index.css        # Global styles and CSS variables
├── main.tsx         # Application entry point
public/
├── manifest.json    # PWA manifest
├── icon-192x192.png # PWA icon (placeholder)
└── icon-512x512.png # PWA icon (placeholder)
```

## 🧰 Tech Stack

- **React 18** - UI library with modern hooks
- **TypeScript** - Type safety and better DX
- **Vite** - Fast build tool and dev server
- **Vite PWA Plugin** - PWA functionality
- **Modern CSS** - No external CSS frameworks

## 🎯 Browser Support

- Chrome/Edge 88+
- Firefox 87+
- Safari 14+
- Mobile browsers with PWA support

## 📝 License

MIT License - feel free to use this project as a starting point for your own applications.

---

Made with ❤️ using modern web technologies
# apps
