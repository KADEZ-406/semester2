// Load SweetAlert2
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
document.head.appendChild(script);

// Cart state
let cart = [];

// DOM Elements
const cartButton = document.getElementById('cartButton');
const cartModal = document.getElementById('cartModal');
const closeCart = document.getElementById('closeCart');
const modalBackdrop = document.getElementById('modalBackdrop');
const cartContent = document.getElementById('cartContent');
const cartCount = document.getElementById('cartCount');

// Create notification element
const notificationEl = document.createElement('div');
notificationEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    display: none;
    animation: slideIn 0.3s ease-out;
`;
document.body.appendChild(notificationEl);

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Show notification function
function showNotification(message, type = 'success') {
    notificationEl.textContent = message;
    notificationEl.style.display = 'block';
    notificationEl.style.backgroundColor = type === 'success' ? '#4CAF50' : '#f44336';
    notificationEl.style.color = 'white';
    
    setTimeout(() => {
        notificationEl.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notificationEl.style.display = 'none';
            notificationEl.style.animation = 'slideIn 0.3s ease-out';
        }, 300);
    }, 2000);
}

// Function to check if user is logged in
function isUserLoggedIn() {
    const user = localStorage.getItem('user');
    return user !== null && user !== undefined && user !== '';
}

// Function to check if user is on home page
function isOnHomePage() {
    const path = window.location.pathname;
    return path.endsWith('home.html') || path.endsWith('detail.html');
}

// Function to redirect to login page
function redirectToLogin() {
    window.location.href = 'login.html';
}

// Function to add item to cart
function addToCart(product) {
    if (!isUserLoggedIn()) {
        Swal.fire({
            title: 'Login Diperlukan',
            text: 'Silakan login untuk menambahkan produk ke keranjang',
            icon: 'warning',
            confirmButtonText: 'Login',
            showCancelButton: true,
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                redirectToLogin();
            }
        });
        return;
    }

    // Coba tambahkan ke keranjang
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    // Simpan ke localStorage
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Jika berhasil disimpan, baru update UI dan tampilkan pesan sukses
        updateCartBadge();
        
        if (cartModal && cartModal.classList.contains('show')) {
            updateCartModal();
        }

        Swal.fire({
            title: 'Berhasil!',
            text: 'Produk berhasil ditambahkan ke keranjang',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    } catch (error) {
        console.error('Error saving to cart. This might be due to storage quota exceeding or other browser issues:', error);
        Swal.fire({
            title: 'Error',
            text: 'Terjadi kesalahan saat menyimpan ke keranjang. (Mungkin ruang penyimpanan browser penuh)',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Cart Functions
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartBadge();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    // Update cart modal immediately if it's open
    if (cartModal && cartModal.classList.contains('show')) {
        updateCartModal();
    }
}

function updateCartBadge() {
    const badge = document.getElementById('cartCount');
    if (badge) {
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function toggleCart(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const isVisible = cartModal.classList.contains('show');
    
    if (isVisible) {
        cartModal.classList.remove('show');
        modalBackdrop.classList.remove('show');
        document.body.classList.remove('modal-open');
    } else {
        cartModal.classList.add('show');
        modalBackdrop.classList.add('show');
        document.body.classList.add('modal-open');
        updateCartModal();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartBadge();
    updateCartModal();
}

function updateCartItemQuantity(index, change) {
    const item = cart[index];
    if (item) {
        const newQuantity = Math.max(1, (item.quantity || 1) + change);
        if (newQuantity !== item.quantity) {
            item.quantity = newQuantity;
            saveCart();
            updateCartBadge();
            updateCartModal();
        }
    }
}

function formatPrice(price) {
    return `Rp ${(price * 15000).toLocaleString('id-ID')}`;
}

function updateCartModal() {
    const cartContent = document.getElementById('cartContent');
    if (!cartContent) return;

    if (cart.length === 0) {
        cartContent.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8">
                <i class="ri-shopping-cart-line text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-500">Keranjang belanja kosong</p>
            </div>
        `;
        return;
    }

    // Group items by product ID
    const groupedItems = cart.reduce((acc, item, index) => {
        const existingItem = acc.find(i => i.id === item.id);
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + (item.quantity || 1);
            existingItem.indexes.push(index);
        } else {
            acc.push({
                ...item,
                quantity: item.quantity || 1,
                indexes: [index]
            });
        }
        return acc;
    }, []);

    // Calculate total price
    const totalPrice = groupedItems.reduce((total, item) => {
        return total + (item.price * item.quantity * 15000);
    }, 0);

    cartContent.innerHTML = `
        <div class="divide-y divide-gray-100">
            ${groupedItems.map((item, groupIndex) => `
                <div class="flex items-center gap-4 py-4">
                    <input type="checkbox" 
                           class="cart-item-checkbox w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                           data-indexes="${item.indexes.join(',')}"
                           ${item.indexes.every(idx => cart[idx].selected) ? 'checked' : ''}>
                    <img src="${item.image}" alt="${item.title}" class="w-16 h-16 object-contain rounded">
                    <div class="flex-1 min-w-0">
                        <h3 class="text-sm font-medium text-gray-900 truncate">${item.title}</h3>
                        <p class="text-sm text-gray-500">Rp ${(item.price * item.quantity * 15000).toLocaleString('id-ID')}</p>
                        <div class="flex items-center mt-2">
                            <button onclick="updateCartItemQuantity(${item.indexes[0]}, -1)" 
                                    class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-l-lg text-gray-600 hover:bg-gray-50">
                                <i class="ri-subtract-line"></i>
                            </button>
                            <div class="w-12 h-8 flex items-center justify-center border-t border-b border-gray-200 bg-white">
                                ${item.quantity}
                            </div>
                            <button onclick="updateCartItemQuantity(${item.indexes[0]}, 1)" 
                                    class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-r-lg text-gray-600 hover:bg-gray-50">
                                <i class="ri-add-line"></i>
                            </button>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-medium">Rp ${(item.price * item.quantity * 15000).toLocaleString('id-ID')}</p>
                        <button onclick="removeFromCart(${item.indexes[0]})" class="text-gray-400 hover:text-red-500 mt-2">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="border-t border-gray-100 mt-4 pt-4">
            <div class="flex items-center gap-2 mb-4">
                <input type="checkbox" 
                       id="selectAllItems"
                       class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                       ${cart.every(item => item.selected) ? 'checked' : ''}>
                <label for="selectAllItems" class="text-sm text-gray-600">Pilih Semua</label>
            </div>
            <div class="flex justify-between mb-4">
                <span class="font-medium">Total:</span>
                <span class="font-medium">Rp ${totalPrice.toLocaleString('id-ID')}</span>
            </div>
            <div class="flex gap-3">
                <button onclick="checkoutSelected()" 
                        class="flex-1 bg-primary text-white font-medium py-2 px-4 rounded-button hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed" 
                        ${cart.some(item => item.selected) ? '' : 'disabled'}>
                    Checkout
                </button>
            </div>
        </div>
    `;

    // Add event listeners for checkboxes
    const selectAllCheckbox = document.getElementById('selectAllItems');
    const itemCheckboxes = document.querySelectorAll('.cart-item-checkbox');

    selectAllCheckbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        itemCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        cart.forEach(item => item.selected = isChecked);
        saveCart();
        updateCartModal();
    });

    itemCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const indexes = e.target.dataset.indexes.split(',').map(Number);
            indexes.forEach(index => {
                cart[index].selected = e.target.checked;
            });
            selectAllCheckbox.checked = cart.every(item => item.selected);
            saveCart();
            updateCartModal();
        });
    });
}

function checkoutSelected() {
    if (!isUserLoggedIn()) {
        redirectToLogin();
        return;
    }

    const selectedItems = cart.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
        showNotification('Pilih minimal satu produk untuk checkout', 'error');
        return;
    }

    // Calculate total price
    const totalPrice = selectedItems.reduce((total, item) => {
        return total + (item.price * item.quantity * 15000);
    }, 0);

    // Save checkout data
    const checkoutData = {
        items: selectedItems,
        totalPrice: totalPrice,
        checkoutTime: new Date().toISOString()
    };
    
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    
    // Remove selected items from cart
    cart = cart.filter(item => !item.selected);
    saveCart();
    updateCartBadge();
    
    // Close cart modal if open
    if (cartModal && cartModal.classList.contains('show')) {
        toggleCart();
    }
    
    Swal.fire({
        title: 'Memproses Checkout',
        text: 'Mohon tunggu sebentar...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
        timer: 1500,
        timerProgressBar: true
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.timer || result.isConfirmed) {
            window.location.href = 'checkout.html';
        }
    });
}

// Function to handle direct checkout from product detail
function buyNow(product) {
    if (!isUserLoggedIn()) {
        Swal.fire({
            title: 'Login Diperlukan',
            text: 'Silakan login untuk membeli produk',
            icon: 'warning',
            confirmButtonText: 'Login',
            showCancelButton: true,
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                redirectToLogin();
            }
        });
        return;
    }
    
    // Create checkout data for single item
    const checkoutData = {
        items: [{
            ...product,
            quantity: 1
        }],
        totalPrice: product.price * 15000,
        checkoutTime: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
        Swal.fire({
            title: 'Memproses Checkout',
            text: 'Mohon tunggu sebentar...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            timer: 1500,
            timerProgressBar: true
        }).then((result) => {
            if (result.dismiss === Swal.DismissReason.timer || result.isConfirmed) {
                window.location.href = 'checkout.html';
            }
        });
    } catch (error) {
        console.error('Error saving checkout data:', error);
        Swal.fire({
            title: 'Error',
            text: 'Terjadi kesalahan saat menyimpan data checkout. (Mungkin ruang penyimpanan browser penuh)',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Product Functions
async function fetchProducts() {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        const productGrid = document.getElementById('productGrid');
        if (productGrid) {
            productGrid.innerHTML = `
                <div class="col-span-5 py-8 text-center text-gray-500">
                    <i class="ri-error-warning-line text-4xl mb-4 block"></i>
                    <p>Gagal memuat produk. Silakan coba lagi nanti.</p>
                </div>
            `;
        }
    }
}

function displayProducts(products) {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) return;

    const currentPath = window.location.pathname;
    const isHomePage = currentPath.endsWith('home.html');
    const isIndexPage = currentPath.endsWith('index.html') || currentPath.endsWith('/');
    
    productGrid.innerHTML = products.map(product => {
        if (isIndexPage) {
            // Simple card for index.html - only image, title, rating
            return `
                <div class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <a href="login.html" class="block">
                        <div class="p-2">
                            <img src="${product.image}" class="w-full h-48 object-contain object-center rounded" alt="${product.title}">
                        </div>
                        <div class="p-4">
                            <h3 class="font-medium text-sm mb-1">${product.title.substring(0, 20)}${product.title.length > 20 ? '...' : ''}</h3>
                            <div class="flex items-center">
                                <div class="flex text-yellow-400 text-xs mr-1">
                                    ${generateStarRating(product.rating.rate)}
                                </div>
                                <span class="text-xs text-gray-500">(${product.rating.count})</span>
                            </div>
                        </div>
                    </a>
                </div>
            `;
        } else {
            // Full card for home.html - all features
            return `
                <div class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <a href="detail.html?id=${product.id}" class="block">
                        <div class="p-2">
                            <img src="${product.image}" class="w-full h-48 object-contain object-center rounded" alt="${product.title}">
                        </div>
                        <div class="p-4">
                            <h3 class="font-medium text-sm mb-1">${product.title.substring(0, 20)}${product.title.length > 20 ? '...' : ''}</h3>
                            <p class="text-xs text-gray-500 mb-1">${product.category}</p>
                            <p class="font-bold text-sm mb-2">${formatPrice(product.price)}</p>
                            <div class="flex items-center">
                                <div class="flex text-yellow-400 text-xs mr-1">
                                    ${generateStarRating(product.rating.rate)}
                                </div>
                                <span class="text-xs text-gray-500">(${product.rating.count})</span>
                            </div>
                        </div>
                    </a>
                    <div class="px-4 pb-4 space-y-2">
                        <button onclick="addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})" 
                                class="w-full bg-primary text-white py-2 rounded-button font-medium hover:bg-primary/90">
                            + Keranjang
                        </button>
                        <button onclick="buyNow(${JSON.stringify(product).replace(/"/g, '&quot;')})" 
                                class="w-full border border-primary text-primary py-2 rounded-button font-medium hover:bg-primary/5">
                            Beli Sekarang
                        </button>
                    </div>
                </div>
            `;
        }
    }).join('');
}

function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars += '<i class="ri-star-fill"></i>';
        } else if (i === fullStars && hasHalfStar) {
            stars += '<i class="ri-star-half-fill"></i>';
        } else {
            stars += '<i class="ri-star-line"></i>';
        }
    }
    return stars;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize cart functionality
    if (cartButton && cartModal && closeCart && modalBackdrop) {
        cartButton.addEventListener('click', toggleCart);
        closeCart.addEventListener('click', toggleCart);
        modalBackdrop.addEventListener('click', toggleCart);

        // Close cart on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && cartModal.classList.contains('show')) {
                toggleCart();
            }
        });

        // Prevent click inside modal from closing it
        cartModal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Load cart data
    loadCart();

    // Set up interval to check for cart updates
    setInterval(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            const newCart = JSON.parse(savedCart);
            if (JSON.stringify(cart) !== JSON.stringify(newCart)) {
                cart = newCart;
                updateCartBadge();
                if (cartModal && cartModal.classList.contains('show')) {
                    updateCartModal();
                }
            }
        }
    }, 1000); // Check every second

    // Load products if we're on the home page
    const isHomePage = window.location.pathname.endsWith('index.html') || 
                      window.location.pathname.endsWith('/') ||
                      window.location.pathname.endsWith('home.html');
    
    if (isHomePage) {
        fetchProducts();

        // Initialize tab navigation
        const tabButtons = document.querySelectorAll('.border-b .text-gray-600');
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const activeTab = document.querySelector('.border-b .text-primary');
                if (activeTab) {
                    activeTab.classList.remove('text-primary', 'border-b-2', 'border-primary');
                    activeTab.classList.add('text-gray-600');
                }
                
                this.classList.remove('text-gray-600');
                this.classList.add('text-primary', 'border-b-2', 'border-primary');
            });
        });
    }

    // Initialize search
    initializeSearch();
});

// Search functionality
let allProducts = [];
let searchTimeout;
let searchResults = [];

// Fetch all products for search
async function fetchAllProducts() {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        allProducts = await response.json();
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Initialize search functionality
function initializeSearch() {
    const searchInput = document.querySelector('input[placeholder="Cari produk..."]');
    if (!searchInput) return;

    // Create search results container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container absolute top-full left-0 right-0 bg-white mt-2 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto hidden';
    searchInput.parentElement.appendChild(searchContainer);

    // Add loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator hidden p-4 text-center text-gray-500';
    loadingIndicator.innerHTML = '<i class="ri-loader-4-line animate-spin mr-2"></i>Mencari...';
    searchContainer.appendChild(loadingIndicator);

    // Add no results message
    const noResults = document.createElement('div');
    noResults.className = 'no-results hidden p-4 text-center text-gray-500';
    noResults.innerHTML = '<i class="ri-search-line mr-2"></i>Tidak ada hasil yang ditemukan';
    searchContainer.appendChild(noResults);

    // Add results container
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'results-container divide-y divide-gray-100';
    searchContainer.appendChild(resultsContainer);

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        
        // Clear previous timeout
        clearTimeout(searchTimeout);
        
        // Show loading state
        loadingIndicator.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
        noResults.classList.add('hidden');
        searchContainer.classList.remove('hidden');
        
        // Debounce search
        searchTimeout = setTimeout(() => {
            if (query.length > 0) {
                searchProducts(query);
            } else {
                hideSearchResults();
            }
        }, 300);
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target) && e.target !== searchInput) {
            hideSearchResults();
        }
    });

    // Handle keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideSearchResults();
        } else if (e.key === 'Enter' && searchResults.length > 0) {
            window.location.href = `detail.html?id=${searchResults[0].id}`;
        }
    });

    // Fetch products when page loads
    fetchAllProducts();
}

// Search products with improved logic
function searchProducts(query) {
    const searchContainer = document.querySelector('.search-container');
    const loadingIndicator = searchContainer.querySelector('.loading-indicator');
    const resultsContainer = searchContainer.querySelector('.results-container');
    const noResults = searchContainer.querySelector('.no-results');

    // Split query into words for better matching
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    searchResults = allProducts.filter(product => {
        const title = product.title.toLowerCase();
        const category = product.category.toLowerCase();
        const description = product.description.toLowerCase();
        
        // Check if all search terms are found in any of the fields
        return searchTerms.every(term => 
            title.includes(term) || 
            category.includes(term) || 
            description.includes(term)
        );
    });

    // Sort results by relevance
    searchResults.sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        
        // Exact matches first
        if (aTitle === query && bTitle !== query) return -1;
        if (bTitle === query && aTitle !== query) return 1;
        
        // Starts with query
        if (aTitle.startsWith(query) && !bTitle.startsWith(query)) return -1;
        if (bTitle.startsWith(query) && !aTitle.startsWith(query)) return 1;
        
        // Contains query
        if (aTitle.includes(query) && !bTitle.includes(query)) return -1;
        if (bTitle.includes(query) && !aTitle.includes(query)) return 1;
        
        return 0;
    });

    // Update UI
    loadingIndicator.classList.add('hidden');
    
    if (searchResults.length === 0) {
        noResults.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
    } else {
        noResults.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        
        resultsContainer.innerHTML = searchResults.slice(0, 5).map(product => `
            <a href="detail.html?id=${product.id}" class="flex items-center gap-4 p-4 hover:bg-gray-50">
                <img src="${product.image}" alt="${product.title}" class="w-12 h-12 object-contain">
                <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-medium text-gray-900 truncate">${product.title}</h3>
                    <p class="text-sm text-gray-500">${product.category}</p>
                    <p class="text-sm font-medium text-primary">Rp ${(product.price * 15000).toLocaleString('id-ID')}</p>
                </div>
            </a>
        `).join('');
    }
}

// Hide search results
function hideSearchResults() {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        searchContainer.classList.add('hidden');
    }
} 