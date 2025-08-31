// PWA Price List Application
import { getThicknessPriceMultiplier, getDepthPriceMultiplier, getCurrencyMultiplier, getCategoryMultiplier, calculateFinalBasePrice, getGroupMultipliers } from './priceCalculations.js';

class PriceListApp {
    constructor() {
        this.products = [];
        this.colors = [];
        this.filteredProducts = [];
        this.currentProduct = null; // Currently selected product
        this.selectedFilters = {
            search: '',
            category: '',
            stoneType: '',
            currency: ''
        };
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing Price List App...');
            
            this.setupEventListeners();
            await this.loadData();
            this.handleUrlRouting();
            this.updateStats();
            
            console.log('✅ Price List App initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showError('Uygulama başlatılırken hata oluştu. Sayfayı yenileyin.');
        }
    }

    setupEventListeners() {
        // Product selector
        document.getElementById('productSelector').addEventListener('change', (e) => {
            const productId = e.target.value;
            if (productId) {
                this.navigateToProduct(productId);
            } else {
                this.navigateToHome();
            }
        });

        // Search toggle
        document.getElementById('searchToggle').addEventListener('click', () => {
            this.toggleSearch();
        });

        // Filter toggle
        document.getElementById('filterToggle').addEventListener('click', () => {
            this.toggleFilter();
        });

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshData();
        });

        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.selectedFilters.search = e.target.value;
            this.applyFilters();
        });

        // Clear search
        document.getElementById('clearSearch').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            this.selectedFilters.search = '';
            this.applyFilters();
        });

        // Filter selects
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.selectedFilters.category = e.target.value;
            this.applyFilters();
        });

        document.getElementById('stoneTypeFilter').addEventListener('change', (e) => {
            this.selectedFilters.stoneType = e.target.value;
            this.applyFilters();
        });

        document.getElementById('currencyFilter').addEventListener('change', (e) => {
            this.selectedFilters.currency = e.target.value;
            this.applyFilters();
        });

        // Calculator button
        document.getElementById('calculatorBtn').addEventListener('click', () => {
            this.openCalculator();
        });

        // Modal close
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        document.getElementById('productModal').addEventListener('click', (e) => {
            if (e.target.id === 'productModal') {
                this.closeModal();
            }
        });

        // Handle browser back/forward buttons
        window.addEventListener('hashchange', () => {
            this.handleUrlRouting();
        });
    }

    async loadData() {
        try {
            console.log('📡 Loading data from Google Sheets...');
            
            // Since we're in a subdirectory, we need to access the parent's Google Sheets service
            // For now, we'll use a simulated data structure
            const response = await this.fetchGoogleSheetsData();
            
            if (response && response.products && response.colors) {
                this.products = response.products || [];
                this.colors = response.colors || [];
                this.filteredProducts = [...this.products];
                
                console.log('✅ Data loaded successfully:');
                console.log('   - Products:', this.products.length);
                console.log('   - Colors:', this.colors.length);
                
                // Populate filter options
                this.populateFilterOptions();
                this.populateProductSelector();
            } else {
                throw new Error('Invalid data structure received');
            }
        } catch (error) {
            console.error('❌ Error loading data:', error);
            console.log('🔄 Using fallback sample data...');
            
            // Use sample data as fallback
            const fallbackData = this.getSampleData();
            this.products = fallbackData.products;
            this.colors = fallbackData.colors;
            this.filteredProducts = [...this.products];
            
            this.populateFilterOptions();
            this.populateProductSelector();
            
            this.showToast('Demo verileri yüklendi. Gerçek veriler için sunucu bağlantısı gerekiyor.', 'info');
        }
    }

    async fetchGoogleSheetsData() {
        try {
            console.log('🔄 Attempting to load Google Sheets data...');
            
            // Try to fetch from the parent app's Google Sheets service
            // Since we're in price-list subdirectory, we need to go up one level
            const response = await fetch('../api/sheets-data').catch(() => null);
            
            if (response && response.ok) {
                const data = await response.json();
                console.log('📊 Real Google Sheets data loaded via API:', data);
                return data;
            }
            
            console.log('⚠️ API not available, falling back to sample data');
            return this.getSampleData();
        } catch (error) {
            console.error('❌ Failed to fetch Google Sheets data:', error);
            console.log('🔄 Using sample data instead');
            return this.getSampleData();
        }
    }

    getSampleData() {
        console.log('📋 Loading sample data for demo...');
        
        // Sample data structure matching the main app's Google Sheets format
        return {
            products: [
                {
                    id: 'PRODUCT001',
                    name: 'Çimstone Keto',
                    category: 'Quartz',
                    stoneType: 'Quartz',
                    currency: 'TRY'
                },
                {
                    id: 'PRODUCT002',
                    name: 'Dekton Aura',
                    category: 'Porcelain',
                    stoneType: 'Porcelain',
                    currency: 'EUR'
                },
                {
                    id: 'PRODUCT003',
                    name: 'Belenco Mystic White',
                    category: 'Quartz',
                    stoneType: 'Quartz',
                    currency: 'TRY'
                },
                {
                    id: 'PRODUCT004',
                    name: 'Lamar Emperador',
                    category: 'Quartz',
                    stoneType: 'Quartz',
                    currency: 'TRY'
                },
                {
                    id: 'PRODUCT005',
                    name: 'Coante Carrara',
                    category: 'Porcelain',
                    stoneType: 'Porcelain',
                    currency: 'USD'
                },
                {
                    id: 'PRODUCT006',
                    name: 'Neolith Arctic White',
                    category: 'Porcelain',
                    stoneType: 'Porcelain',
                    currency: 'EUR'
                },
                {
                    id: 'PRODUCT007',
                    name: 'Silestone Calacatta Gold',
                    category: 'Quartz',
                    stoneType: 'Quartz',
                    currency: 'TRY'
                }
            ],
            colors: [
                {
                    id: 'COLOR001',
                    name: 'Polar White',
                    productIds: ['PRODUCT001', 'PRODUCT003'],
                    price: '850.00'
                },
                {
                    id: 'COLOR002',
                    name: 'Storm Grey',
                    productIds: ['PRODUCT001', 'PRODUCT002'],
                    price: '920.00'
                },
                {
                    id: 'COLOR003',
                    name: 'Midnight Black',
                    productIds: ['PRODUCT002', 'PRODUCT003'],
                    price: '1150.00'
                },
                {
                    id: 'COLOR004',
                    name: 'Emperador Brown',
                    productIds: ['PRODUCT004'],
                    price: '780.00'
                },
                {
                    id: 'COLOR005',
                    name: 'Carrara Marble',
                    productIds: ['PRODUCT005'],
                    price: '95.00'
                },
                {
                    id: 'COLOR006',
                    name: 'Ice Blue',
                    productIds: ['PRODUCT001', 'PRODUCT005'],
                    price: '1050.00'
                },
                {
                    id: 'COLOR007',
                    name: 'Arctic White',
                    productIds: ['PRODUCT006'],
                    price: '125.00'
                },
                {
                    id: 'COLOR008',
                    name: 'Calacatta Gold',
                    productIds: ['PRODUCT007'],
                    price: '1200.00'
                },
                {
                    id: 'COLOR009',
                    name: 'Aura 15',
                    productIds: ['PRODUCT002'],
                    price: '135.00'
                }
            ]
        };
    }

    populateFilterOptions() {
        // Get unique values for filters
        const categories = [...new Set(this.products.map(p => p.category))].filter(Boolean);
        const stoneTypes = [...new Set(this.products.map(p => p.stoneType))].filter(Boolean);
        const currencies = [...new Set(this.products.map(p => p.currency))].filter(Boolean);

        // Populate category filter
        const categoryFilter = document.getElementById('categoryFilter');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        // Populate stone type filter
        const stoneTypeFilter = document.getElementById('stoneTypeFilter');
        stoneTypes.forEach(stoneType => {
            const option = document.createElement('option');
            option.value = stoneType;
            option.textContent = stoneType;
            stoneTypeFilter.appendChild(option);
        });

        // Populate currency filter
        const currencyFilter = document.getElementById('currencyFilter');
        currencies.forEach(currency => {
            const option = document.createElement('option');
            option.value = currency;
            option.textContent = currency;
            currencyFilter.appendChild(option);
        });
    }

    populateProductSelector() {
        const productSelector = document.getElementById('productSelector');
        
        // Clear existing options (except the first one)
        while (productSelector.children.length > 1) {
            productSelector.removeChild(productSelector.lastChild);
        }

        // Sort products alphabetically
        const sortedProducts = [...this.products].sort((a, b) => a.name.localeCompare(b.name, 'tr'));

        sortedProducts.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            productSelector.appendChild(option);
        });
    }

    handleUrlRouting() {
        const hash = window.location.hash.substring(1); // Remove the '#'
        
        if (hash) {
            // Check if it's a product ID
            const product = this.products.find(p => p.id === hash);
            if (product) {
                this.showProductPage(product.id);
                document.getElementById('productSelector').value = product.id;
                return;
            }
        }
        
        // No valid hash or product found, show all products
        this.showAllProducts();
        document.getElementById('productSelector').value = '';
    }

    navigateToProduct(productId) {
        window.location.hash = productId;
        this.showProductPage(productId);
    }

    navigateToHome() {
        window.location.hash = '';
        this.showAllProducts();
    }

    showProductPage(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        this.currentProduct = product;
        const colors = this.getProductColors(productId);

        // Hide all products grid and show single product page
        document.getElementById('productGrid').style.display = 'none';
        document.getElementById('productPageContainer').style.display = 'block';

        // Render single product page
        document.getElementById('productPageContainer').innerHTML = this.renderSingleProductPage(product, colors);

        // Setup listeners for this product page
        this.setupSingleProductListeners();

        // Update stats for single product
        this.updateStatsForSingleProduct(product, colors);
    }

    showAllProducts() {
        this.currentProduct = null;
        
        // Show all products grid and hide single product page
        document.getElementById('productGrid').style.display = 'grid';
        document.getElementById('productPageContainer').style.display = 'none';

        // Render all products
        this.renderProducts();
        this.updateStats();
    }

    renderSingleProductPage(product, colors) {
        // Create realistic price data based on product type - use the same calculation as main app
        const priceData = this.generatePriceDataWithMainAppLogic(product, colors);
        
        return `
            <div class="single-product-page">
                <div class="product-header">
                    <button class="back-btn" onclick="app.navigateToHome()">← Tüm Ürünler</button>
                    <h1 class="product-title">${product.name}</h1>
                    <p class="product-subtitle">PARLAK YÜZEY PARAKENDE FİYAT LİSTESİ</p>
                    <div class="product-meta-info">
                        ${product.category ? `<span class="meta-badge">${product.category}</span>` : ''}
                        ${product.stoneType ? `<span class="meta-badge">${product.stoneType}</span>` : ''}
                        ${product.currency ? `<span class="meta-badge">${product.currency}</span>` : ''}
                        <span class="meta-badge">${new Date().toLocaleDateString('tr-TR')}</span>
                    </div>
                    <button class="main-calculate-btn" data-product-id="${product.id}">
                        🧮 Bu Ürünle Hesaplama Yap
                    </button>
                </div>
                
                <div class="price-table-wrapper">
                    <table class="price-table">
                    <thead>
                        <tr>
                            <th>DERİNLİK</th>
                            <th>BİRİM</th>
                            <th>GROUP 01</th>
                            <th>GROUP 02</th>
                            <th>GROUP 03</th>
                            <th>GROUP 04</th>
                            <th>GROUP 05</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderDepthRows(priceData.depths)}
                        <tr class="section-header">
                            <td colspan="7">PANEL VE DİĞER HİZMETLER</td>
                        </tr>
                        ${this.renderServiceRows(priceData.services)}
                        <tr class="section-header">
                            <td colspan="7">TEZGAH ÖN KALINLIK (G:65 cm kadar geçerlidir)</td>
                        </tr>
                        ${this.renderThicknessRows(priceData.thickness)}
                        <tr class="section-header">
                            <td colspan="7">ÖZEL DETAYLAR</td>
                        </tr>
                        ${this.renderSpecialDetailRows(priceData.specialDetails)}
                        <tr class="section-header">
                            <td colspan="7">YÜKSEK SÜPÜRGELİK</td>
                        </tr>
                        ${this.renderSupurgelikRows(priceData.supurgelik)}
                        <tr class="section-header">
                            <td colspan="7">İŞÇİLİK HİZMETLERİ</td>
                        </tr>
                        ${this.renderLaborRows(priceData.labor)}
                    </tbody>
                    </table>
                </div>
                
                ${colors.length > 0 ? `
                    <div class="color-groups">
                        <h3>Mevcut Renkler</h3>
                        ${this.renderColorGroups(colors)}
                    </div>
                ` : ''}
                
                <div class="product-notes">
                    <h3>Önemli Notlar</h3>
                    <ul>
                        <li>*Fiyatlara KDV dahil değildir.</li>
                        <li>*Fiyatlar MTÜL / M² ve adet olarak TL bazındadır.</li>
                        <li>*Fiyatlara eviye ve ocak yerinin açılması, h:4CM süpürgelik ve İstanbul içi nakliye ve montaj dahildir.</li>
                        <li>*İmalat süresi kaşeli onaydan itibaren 7-10 gün arasındadır.</li>
                        <li>*Seçilen ürünün stok durumunu sorunuz. Satış yapıldığında proje gönderip stok ayırtınız.</li>
                        <li>*${product.name} ürünlerinde 15 yıl firma garantisi vardır.</li>
                    </ul>
                </div>
            </div>
        `;
    }

    generatePriceDataWithMainAppLogic(product, colors) {
        // This matches the exact calculation logic from the main app
        // Get base price from colors (average if multiple colors)
        let basePrice = 850; // Default price
        if (colors.length > 0) {
            const prices = colors.map(c => parseFloat(c.price) || 850);
            basePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        }

        // Calculate final base price with conversions (using shared utilities)
        const finalBasePrice = calculateFinalBasePrice(basePrice, product.currency, product.category);

        // Group multipliers (imported from shared utilities)
        const groups = getGroupMultipliers();

        // Calculate depth pricing with main app logic
        const depthPricing = {};
        ['065', '070', '080', '090', '100', '110', '120'].forEach(depth => {
            const depthMultiplier = getDepthPriceMultiplier(depth);
            const thicknessMultiplier = getThicknessPriceMultiplier('h:4'); // Base thickness
            depthPricing[depth] = finalBasePrice * depthMultiplier * thicknessMultiplier;
        });

        // Panel pricing calculation (same as main app - typically 1.25x base)
        const panelBasePrice = finalBasePrice * 1.25;

        return {
            depths: [
                { depth: 'g: 065 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(depthPricing['065'] * g.multiplier)) },
                { depth: 'g: 070 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(depthPricing['070'] * g.multiplier)) },
                { depth: 'g: 080 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(depthPricing['080'] * g.multiplier)) },
                { depth: 'g: 090 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(depthPricing['090'] * g.multiplier)) },
                { depth: 'g: 100 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(depthPricing['100'] * g.multiplier)) },
                { depth: 'g: 110 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(depthPricing['110'] * g.multiplier)) },
                { depth: 'g: 120 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(depthPricing['120'] * g.multiplier)) }
            ],
            services: [
                { service: 'PANEL', unit: 'M²', prices: groups.map(g => Math.round(panelBasePrice * g.multiplier)) }
            ],
            thickness: [
                { thickness: 'h:1,5 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(finalBasePrice * getThicknessPriceMultiplier('h:1.5') * g.multiplier)) },
                { thickness: 'h:5-6 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(finalBasePrice * getThicknessPriceMultiplier('h:5-6') * g.multiplier)) },
                { thickness: 'h:7-8 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(finalBasePrice * getThicknessPriceMultiplier('h:7-8') * g.multiplier)) },
                { thickness: 'h:9-10 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(finalBasePrice * getThicknessPriceMultiplier('h:9-10') * g.multiplier)) },
                { thickness: 'h:11-15 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(finalBasePrice * getThicknessPriceMultiplier('h:11-15') * g.multiplier)) },
                { thickness: 'h:16-20 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(finalBasePrice * getThicknessPriceMultiplier('h:16-20') * g.multiplier)) }
            ],
            specialDetails: [
                { detail: 'Profil', unit: 'MTÜL', price: Math.round(finalBasePrice * 0.646) },
                { detail: 'Hera', unit: 'MTÜL', price: Math.round(finalBasePrice * 0.646) },
                { detail: 'Hera Klasik', unit: 'MTÜL', price: Math.round(finalBasePrice * 0.904) },
                { detail: 'Trio', unit: 'MTÜL', price: Math.round(finalBasePrice * 0.775) },
                { detail: 'Country', unit: 'MTÜL', price: Math.round(finalBasePrice * 0.646) },
                { detail: 'Balık Sırtı', unit: 'MTÜL', price: Math.round(finalBasePrice * 0.478) },
                { detail: 'M 20', unit: 'MTÜL', price: Math.round(finalBasePrice * 1.098) },
                { detail: 'MQ 40', unit: 'MTÜL', price: Math.round(finalBasePrice * 1.098) },
                { detail: 'U 40', unit: 'MTÜL', price: Math.round(finalBasePrice * 1.098) }
            ],
            supurgelik: [
                { height: 'h:05-h:10', unit: 'MTÜL', prices: groups.map(g => Math.round(finalBasePrice * 0.15 * g.multiplier)) },
                { height: 'h:11-h:20', unit: 'MTÜL', prices: groups.map(g => Math.round(finalBasePrice * 0.3 * g.multiplier)) },
                { height: 'h:21-h:30', unit: 'MTÜL', prices: groups.map(g => Math.round(finalBasePrice * 0.45 * g.multiplier)) },
                { height: 'h:31 - (+)', unit: 'MTÜL', prices: groups.map(g => Math.round(finalBasePrice * 0.9 * g.multiplier)) }
            ],
            labor: [
                { service: 'ÜSTTEN EVİYE MONTAJ BEDELİ', price: Math.round(finalBasePrice * 0.15) },
                { service: 'TEZGAHA SIFIR EVİYE / OCAK İŞÇ.', price: Math.round(finalBasePrice * 1.0) },
                { service: 'ALTTAN EVİYE İŞÇİLİK', price: Math.round(finalBasePrice * 0.45) },
                { service: 'HİLTON ALTTAN LAVABO İŞÇİLİK', price: Math.round(finalBasePrice * 0.45) },
                { service: 'ÇEYREK DAİRE OVAL İŞÇİLİK', price: Math.round(finalBasePrice * 0.45) },
                { service: 'YARIM DAİRE OVAL İŞÇİLİK', price: Math.round(finalBasePrice * 0.68) },
                { service: 'SU DAMLALIĞI TAKIM FİYATI', price: Math.round(finalBasePrice * 3.0) }
            ]
        };
    }

    setupSingleProductListeners() {
        // Main calculate button
        document.querySelectorAll('.main-calculate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.productId;
                this.openCalculatorWithProduct(productId);
            });
        });

        // Price cell clicks
        document.querySelectorAll('.price-cell').forEach(cell => {
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openCalculatorWithProduct(this.currentProduct.id);
            });
        });
    }

    updateStatsForSingleProduct(product, colors) {
        document.getElementById('totalProducts').textContent = '1';
        document.getElementById('filteredProducts').textContent = '1';
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('tr-TR');
    }

    applyFilters() {
        let filtered = [...this.products];

        // Apply search filter
        if (this.selectedFilters.search) {
            const searchTerm = this.selectedFilters.search.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                this.getProductColors(product.id).some(color => 
                    color.name.toLowerCase().includes(searchTerm)
                )
            );
        }

        // Apply category filter
        if (this.selectedFilters.category) {
            filtered = filtered.filter(product => 
                product.category === this.selectedFilters.category
            );
        }

        // Apply stone type filter
        if (this.selectedFilters.stoneType) {
            filtered = filtered.filter(product => 
                product.stoneType === this.selectedFilters.stoneType
            );
        }

        // Apply currency filter
        if (this.selectedFilters.currency) {
            filtered = filtered.filter(product => 
                product.currency === this.selectedFilters.currency
            );
        }

        this.filteredProducts = filtered;
        this.renderProducts();
        this.updateStats();
    }

    getProductColors(productId) {
        return this.colors.filter(color => 
            color.productIds && color.productIds.includes(productId)
        );
    }

    renderProducts() {
        const productGrid = document.getElementById('productGrid');
        
        if (this.filteredProducts.length === 0) {
            productGrid.innerHTML = `
                <div class="empty-state">
                    <h3>Ürün bulunamadı</h3>
                    <p>Arama kriterlerinizi değiştirip tekrar deneyin.</p>
                </div>
            `;
            return;
        }

        productGrid.innerHTML = this.filteredProducts.map(product => {
            const colors = this.getProductColors(product.id);
            
            return this.renderProductCard(product, colors);
        }).join('');

        // Add click listeners
        this.setupProductCardListeners();
    }

    renderProductCard(product, colors) {
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-card-header">
                    <h3 class="product-card-title">${product.name}</h3>
                    <div class="product-meta-info">
                        ${product.category ? `<span class="meta-badge">${product.category}</span>` : ''}
                        ${product.stoneType ? `<span class="meta-badge">${product.stoneType}</span>` : ''}
                        ${product.currency ? `<span class="meta-badge">${product.currency}</span>` : ''}
                    </div>
                </div>
                <div class="product-card-content">
                    <p class="color-count">${colors.length} renk mevcut</p>
                    <div class="product-card-actions">
                        <button class="view-details-btn" data-product-id="${product.id}">
                            📋 Fiyat Listesini Görüntüle
                        </button>
                        <button class="calculate-btn" data-product-id="${product.id}">
                            🧮 Hesapla
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setupProductCardListeners() {
        // View details button clicks
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.productId;
                this.navigateToProduct(productId);
            });
        });

        // Calculate button clicks
        document.querySelectorAll('.calculate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.productId;
                this.openCalculatorWithProduct(productId);
            });
        });

        // Card clicks
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const productId = card.dataset.productId;
                this.navigateToProduct(productId);
            });
        });
    }

    renderProductTable(product, colors) {
        // Create realistic price data based on product type
        const priceData = this.generatePriceData(product);
        
        return `
            <div class="product-table-card" data-product-id="${product.id}">
                <div class="product-table-header">
                    <h2 class="product-table-title">${product.name}</h2>
                    <p class="product-table-subtitle">PARLAK YÜZEY PARAKENDE FİYAT LİSTESİ</p>
                    <div class="product-meta-info">
                        ${product.category ? `<span class="meta-badge">${product.category}</span>` : ''}
                        ${product.stoneType ? `<span class="meta-badge">${product.stoneType}</span>` : ''}
                        ${product.currency ? `<span class="meta-badge">${product.currency}</span>` : ''}
                        <span class="meta-badge">${new Date().toLocaleDateString('tr-TR')}</span>
                    </div>
                    <button class="table-calculate-btn" data-product-id="${product.id}">
                        🧮 Hesapla
                    </button>
                </div>
                
                <div class="price-table-wrapper">
                    <table class="price-table">
                    <thead>
                        <tr>
                            <th>DERİNLİK</th>
                            <th>BİRİM</th>
                            <th>GROUP 01</th>
                            <th>GROUP 02</th>
                            <th>GROUP 03</th>
                            <th>GROUP 04</th>
                            <th>GROUP 05</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderDepthRows(priceData.depths)}
                        <tr class="section-header">
                            <td colspan="7">PANEL VE DİĞER HİZMETLER</td>
                        </tr>
                        ${this.renderServiceRows(priceData.services)}
                        <tr class="section-header">
                            <td colspan="7">TEZGAH ÖN KALINLIK (G:65 cm kadar geçerlidir)</td>
                        </tr>
                        ${this.renderThicknessRows(priceData.thickness)}
                        <tr class="section-header">
                            <td colspan="7">ÖZEL DETAYLAR</td>
                        </tr>
                        ${this.renderSpecialDetailRows(priceData.specialDetails)}
                        <tr class="section-header">
                            <td colspan="7">YÜKSEK SÜPÜRGELİK</td>
                        </tr>
                        ${this.renderSupurgelikRows(priceData.supurgelik)}
                        <tr class="section-header">
                            <td colspan="7">İŞÇİLİK HİZMETLERİ</td>
                        </tr>
                        ${this.renderLaborRows(priceData.labor)}
                    </tbody>
                    </table>
                </div>
                
                ${colors.length > 0 ? `
                    <div class="color-groups">
                        ${this.renderColorGroups(colors)}
                    </div>
                ` : ''}
                
                <div class="product-notes">
                    <ul>
                        <li>*Fiyatlara KDV dahil değildir.</li>
                        <li>*Fiyatlar MTÜL / M² ve adet olarak TL bazındadır.</li>
                        <li>*Fiyatlara eviye ve ocak yerinin açılması, h:4CM süpürgelik ve İstanbul içi nakliye ve montaj dahildir.</li>
                        <li>*İmalat süresi kaşeli onaydan itibaren 7-10 gün arasındadır.</li>
                        <li>*Seçilen ürünün stok durumunu sorunuz. Satış yapıldığında proje gönderip stok ayırtınız.</li>
                        <li>*${product.name} ürünlerinde 15 yıl firma garantisi vardır.</li>
                    </ul>
                </div>
            </div>
        `;
    }

    generatePriceData(product) {
        // Use shared utilities for consistency
        const categoryMultiplier = getCategoryMultiplier(product.category);
        const currencyMultiplier = getCurrencyMultiplier(product.currency);
        const groups = getGroupMultipliers();

        return {
            depths: [
                { depth: 'g: 065 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(12000 * g.multiplier * categoryMultiplier * currencyMultiplier)) },
                { depth: 'g: 070 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(13980 * g.multiplier * categoryMultiplier * currencyMultiplier)) },
                { depth: 'g: 080 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(16020 * g.multiplier * categoryMultiplier * currencyMultiplier)) },
                { depth: 'g: 090 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(24000 * g.multiplier * categoryMultiplier * currencyMultiplier)) },
                { depth: 'g: 100 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(24000 * g.multiplier * categoryMultiplier * currencyMultiplier)) },
                { depth: 'g: 110 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(24000 * g.multiplier * categoryMultiplier * currencyMultiplier)) },
                { depth: 'g: 120 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(24000 * g.multiplier * categoryMultiplier * currencyMultiplier)) }
            ],
            services: [
                { service: 'PANEL', unit: 'M²', prices: groups.map(g => Math.round(15000 * g.multiplier * categoryMultiplier * currencyMultiplier)) }
            ],
            thickness: [
                { thickness: 'h:1,5 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(10800 * g.multiplier * categoryMultiplier * currencyMultiplier)) },
                { thickness: 'h:5-6 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(13200 * g.multiplier * categoryMultiplier * currencyMultiplier)) },
                { thickness: 'h:7-8 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(13800 * g.multiplier * categoryMultiplier * currencyMultiplier)) },
                { thickness: 'h:9-10 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(14400 * g.multiplier * categoryMultiplier * currencyMultiplier)) },
                { thickness: 'h:11-15 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(15600 * g.multiplier * categoryMultiplier * currencyMultiplier)) },
                { thickness: 'h:16-20 cm', unit: 'MTÜL', prices: groups.map(g => Math.round(17400 * g.multiplier * categoryMultiplier * currencyMultiplier)) }
            ],
            specialDetails: [
                { detail: 'Profil', unit: 'MTÜL', price: Math.round(7750 * categoryMultiplier * currencyMultiplier) },
                { detail: 'Hera', unit: 'MTÜL', price: Math.round(7750 * categoryMultiplier * currencyMultiplier) },
                { detail: 'Hera Klasik', unit: 'MTÜL', price: Math.round(10850 * categoryMultiplier * currencyMultiplier) },
                { detail: 'Trio', unit: 'MTÜL', price: Math.round(9300 * categoryMultiplier * currencyMultiplier) },
                { detail: 'Country', unit: 'MTÜL', price: Math.round(7750 * categoryMultiplier * currencyMultiplier) },
                { detail: 'Balık Sırtı', unit: 'MTÜL', price: Math.round(5735 * categoryMultiplier * currencyMultiplier) },
                { detail: 'M 20', unit: 'MTÜL', price: Math.round(13175 * categoryMultiplier * currencyMultiplier) },
                { detail: 'MQ 40', unit: 'MTÜL', price: Math.round(13175 * categoryMultiplier * currencyMultiplier) },
                { detail: 'U 40', unit: 'MTÜL', price: Math.round(13175 * categoryMultiplier * currencyMultiplier) }
            ],
            supurgelik: [
                { height: 'h:05-h:10', unit: 'MTÜL', prices: groups.map(g => Math.round(1800 * g.multiplier * baseMultiplier * currencyMultiplier)) },
                { height: 'h:11-h:20', unit: 'MTÜL', prices: groups.map(g => Math.round(3600 * g.multiplier * baseMultiplier * currencyMultiplier)) },
                { height: 'h:21-h:30', unit: 'MTÜL', prices: groups.map(g => Math.round(5400 * g.multiplier * baseMultiplier * currencyMultiplier)) },
                { height: 'h:31 - (+)', unit: 'MTÜL', prices: groups.map(g => Math.round(10800 * g.multiplier * baseMultiplier * currencyMultiplier)) }
            ],
            labor: [
                { service: 'ÜSTTEN EVİYE MONTAJ BEDELİ', price: Math.round(1800 * baseMultiplier * currencyMultiplier) },
                { service: 'TEZGAHA SIFIR EVİYE / OCAK İŞÇ.', price: Math.round(12000 * baseMultiplier * currencyMultiplier) },
                { service: 'ALTTAN EVİYE İŞÇİLİK', price: Math.round(5400 * baseMultiplier * currencyMultiplier) },
                { service: 'HİLTON ALTTAN LAVABO İŞÇİLİK', price: Math.round(5400 * baseMultiplier * currencyMultiplier) },
                { service: 'ÇEYREK DAİRE OVAL İŞÇİLİK', price: Math.round(5400 * baseMultiplier * currencyMultiplier) },
                { service: 'YARIM DAİRE OVAL İŞÇİLİK', price: Math.round(8160 * baseMultiplier * currencyMultiplier) },
                { service: 'SU DAMLALIĞI TAKIM FİYATI', price: Math.round(36000 * baseMultiplier * currencyMultiplier) }
            ]
        };
    }

    renderDepthRows(depths) {
        return depths.map(depth => `
            <tr>
                <td><strong>${depth.depth}</strong></td>
                <td>${depth.unit}</td>
                ${depth.prices.map(price => `<td class="price-cell">${this.formatTablePrice(price)}</td>`).join('')}
            </tr>
        `).join('');
    }

    renderServiceRows(services) {
        return services.map(service => `
            <tr>
                <td><strong>${service.service}</strong></td>
                <td>${service.unit}</td>
                ${service.prices.map(price => `<td class="price-cell">${this.formatTablePrice(price)}</td>`).join('')}
            </tr>
        `).join('');
    }

    renderThicknessRows(thickness) {
        return thickness.map(thick => `
            <tr>
                <td><strong>${thick.thickness}</strong></td>
                <td>${thick.unit}</td>
                ${thick.prices.map(price => `<td class="price-cell">${this.formatTablePrice(price)}</td>`).join('')}
            </tr>
        `).join('');
    }

    renderSpecialDetailRows(specialDetails) {
        return specialDetails.map(detail => `
            <tr>
                <td><strong>${detail.detail}</strong></td>
                <td>${detail.unit}</td>
                <td colspan="5" class="price-cell">${this.formatTablePrice(detail.price)}</td>
            </tr>
        `).join('');
    }

    renderSupurgelikRows(supurgelik) {
        return supurgelik.map(sup => `
            <tr>
                <td><strong>${sup.height}</strong></td>
                <td>${sup.unit}</td>
                ${sup.prices.map(price => `<td class="price-cell">${this.formatTablePrice(price)}</td>`).join('')}
            </tr>
        `).join('');
    }

    renderLaborRows(labor) {
        return labor.map(lab => `
            <tr>
                <td><strong>${lab.service}</strong></td>
                <td>-</td>
                <td colspan="5" class="price-cell">${this.formatTablePrice(lab.price)}</td>
            </tr>
        `).join('');
    }

    renderColorGroups(colors) {
        // Group colors into 5 groups for better presentation
        const groups = [
            { title: 'GROUP 01', colors: colors.slice(0, Math.ceil(colors.length / 5)) },
            { title: 'GROUP 02', colors: colors.slice(Math.ceil(colors.length / 5), Math.ceil(colors.length * 2 / 5)) },
            { title: 'GROUP 03', colors: colors.slice(Math.ceil(colors.length * 2 / 5), Math.ceil(colors.length * 3 / 5)) },
            { title: 'GROUP 04', colors: colors.slice(Math.ceil(colors.length * 3 / 5), Math.ceil(colors.length * 4 / 5)) },
            { title: 'GROUP 05', colors: colors.slice(Math.ceil(colors.length * 4 / 5)) }
        ];

        return groups.map(group => `
            <div class="color-group">
                <div class="color-group-title">${group.title}</div>
                <ul class="color-list">
                    ${group.colors.map(color => `<li>${color.name}</li>`).join('')}
                </ul>
            </div>
        `).join('');
    }

    formatTablePrice(price) {
        return `${price.toLocaleString('tr-TR')} TL`;
    }

    setupProductTableListeners() {
        // Table calculate button clicks
        document.querySelectorAll('.table-calculate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.productId;
                this.openCalculatorWithProduct(productId);
            });
        });

        // Price cell clicks
        document.querySelectorAll('.price-cell').forEach(cell => {
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                // Could add specific price selection logic here
                const productCard = cell.closest('.product-table-card');
                const productId = productCard.dataset.productId;
                this.openCalculatorWithProduct(productId);
            });
        });
    }

    formatPrice(price, currency = 'TRY') {
        const numPrice = parseFloat(price) || 0;
        
        switch (currency) {
            case 'EUR':
                return `€${numPrice.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;
            case 'USD':
                return `$${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            default:
                return `₺${numPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
        }
    }

    showProductDetails(productId) {
        const product = this.products.find(p => p.id === productId);
        const colors = this.getProductColors(productId);
        
        if (!product) return;

        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        const calculateBtn = document.getElementById('calculateWithProduct');

        modalTitle.textContent = product.name;
        
        modalContent.innerHTML = `
            <div class="product-details">
                <div class="detail-row">
                    <strong>Kategori:</strong> ${product.category || 'Belirtilmemiş'}
                </div>
                <div class="detail-row">
                    <strong>Taş Tipi:</strong> ${product.stoneType || 'Belirtilmemiş'}
                </div>
                <div class="detail-row">
                    <strong>Para Birimi:</strong> ${product.currency || 'TRY'}
                </div>
                <div class="detail-row">
                    <strong>Mevcut Renkler:</strong>
                    <div class="color-details">
                        ${colors.length > 0 ? colors.map(color => `
                            <div class="color-detail-item">
                                <span>${color.name}</span>
                                <span class="price">${this.formatPrice(color.price, product.currency)}</span>
                            </div>
                        `).join('') : '<p>Renk bilgisi bulunamadı</p>'}
                    </div>
                </div>
            </div>
        `;

        // Update calculate button
        calculateBtn.onclick = () => {
            this.openCalculatorWithProduct(productId);
        };

        this.showModal();
    }

    showModal() {
        document.getElementById('productModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('productModal').classList.add('hidden');
        document.body.style.overflow = '';
    }

    openCalculator() {
        // Open the main calculator app - adjust path based on deployment
        if (window.location.hostname === 'localhost') {
            // Local development - go up one directory
            window.location.href = '../index.html';
        } else {
            // Production - use relative path or full URL
            window.location.href = '/index.html';
        }
    }

    openCalculatorWithProduct(productId, colorId = null) {
        // Prepare URL with pre-selected product and color
        let baseUrl;
        
        if (window.location.hostname === 'localhost') {
            // Local development
            baseUrl = '../index.html';
        } else {
            // Production
            baseUrl = '/index.html';
        }
        
        const params = new URLSearchParams();
        params.append('product', productId);
        if (colorId) {
            params.append('color', colorId);
        }
        params.append('source', 'price-list');
        
        const finalUrl = baseUrl + '?' + params.toString();
        console.log('🧮 Opening calculator with URL:', finalUrl);
        window.location.href = finalUrl;
    }

    toggleSearch() {
        const container = document.getElementById('searchContainer');
        const button = document.getElementById('searchToggle');
        
        container.classList.toggle('hidden');
        button.classList.toggle('active');
        
        if (!container.classList.contains('hidden')) {
            document.getElementById('searchInput').focus();
        }
    }

    toggleFilter() {
        const container = document.getElementById('filterContainer');
        const button = document.getElementById('filterToggle');
        
        container.classList.toggle('hidden');
        button.classList.toggle('active');
    }

    async refreshData() {
        const button = document.getElementById('refreshBtn');
        button.style.animation = 'spin 1s linear infinite';
        
        try {
            await this.loadData();
            this.applyFilters();
            
            // Show success feedback
            this.showToast('Veriler başarıyla güncellendi', 'success');
        } catch (error) {
            this.showToast('Veri güncellenirken hata oluştu', 'error');
        } finally {
            button.style.animation = '';
        }
    }

    updateStats() {
        document.getElementById('totalProducts').textContent = this.products.length;
        document.getElementById('filteredProducts').textContent = this.filteredProducts.length;
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('tr-TR');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Style the toast
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            color: 'white',
            backgroundColor: type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6',
            zIndex: '1000',
            animation: 'slideUp 0.3s ease'
        });
        
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize app when DOM is loaded
let app;

// Global error handler
window.addEventListener('error', (event) => {
    console.error('🚨 Global JavaScript error:', event.error);
    console.error('   File:', event.filename);
    console.error('   Line:', event.lineno);
    console.error('   Column:', event.colno);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM Content Loaded - Starting Price List App');
    
    try {
        // Hide loading state and show main content
        const loadingState = document.getElementById('loadingState');
        const mainContent = document.getElementById('mainContent');
        
        if (loadingState) loadingState.classList.add('hidden');
        if (mainContent) mainContent.classList.remove('hidden');
        
        // Start the app
        app = new PriceListApp();
        console.log('✅ App instance created successfully');
    } catch (error) {
        console.error('❌ Failed to create app instance:', error);
        
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:red;color:white;padding:1rem;border-radius:0.5rem;z-index:9999;';
        errorDiv.textContent = 'Uygulama başlatılamadı. Sayfayı yenileyin.';
        document.body.appendChild(errorDiv);
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(100%); opacity: 0; }
    }
    
    .color-details {
        margin-top: 0.5rem;
    }
    
    .color-detail-item {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--border);
    }
    
    .color-detail-item:last-child {
        border-bottom: none;
    }
    
    .detail-row {
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--border);
    }
    
    .detail-row:last-child {
        border-bottom: none;
    }
`;
document.head.appendChild(style);
