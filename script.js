// Restaurant application with language switching, order management, and staff functionality

// Global variables for order management
let tableOrders = {
    1: { items: [], total: 0, status: 'heard' },
    2: { items: [], total: 0, status: 'heard' },
    3: { items: [], total: 0, status: 'heard' },
    4: { items: [], total: 0, status: 'heard' }
};

// Staff credentials (in a real app, this would be server-side)
const staffCredentials = {
    'waiter': 'password123',
    'cook': 'kitchen456'
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize language functionality
    initializeLanguage();

    // Load orders from localStorage if available
    loadOrdersFromStorage();

    // Check which page we're on and initialize appropriate functionality
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html' || currentPage === '') {
        // Main page functionality
        initializeMainPage();
    } else if (currentPage === 'table.html' || 
               currentPage === 'table1.html' || 
               currentPage === 'table2.html' || 
               currentPage === 'table3.html' || 
               currentPage === 'table4.html') {
        // Table order page functionality
        initializeTablePage();
    } else if (currentPage === 'login.html') {
        // Login page functionality
        initializeLoginPage();
    } else if (currentPage === 'staff.html') {
        // Staff dashboard functionality
        initializeStaffPage();
    }

    // Toggle allergies selector visibility if it exists
    const hasAllergiesCheckbox = document.getElementById('has-allergies');
    const allergiesSelector = document.getElementById('allergies-selector');

    if (hasAllergiesCheckbox && allergiesSelector) {
        hasAllergiesCheckbox.addEventListener('change', function() {
            allergiesSelector.style.display = this.checked ? 'block' : 'none';
        });
    }
});

// Initialize main page functionality
function initializeMainPage() {
    console.log('Initializing main page...');
    // Nothing specific needed for the main page yet
}

// Initialize table page functionality
function initializeTablePage() {
    console.log('Initializing table page...');

    // Get table number from the current page filename
    const currentPage = window.location.pathname.split('/').pop();
    let tableNumber = '1';

    if (currentPage === 'table1.html') {
        tableNumber = '1';
    } else if (currentPage === 'table2.html') {
        tableNumber = '2';
    } else if (currentPage === 'table3.html') {
        tableNumber = '3';
    } else if (currentPage === 'table4.html') {
        tableNumber = '4';
    } else if (currentPage === 'table.html') {
        // For backward compatibility with the old URL parameter approach
        const urlParams = new URLSearchParams(window.location.search);
        tableNumber = urlParams.get('table') || '1';
    }

    // Update table number in the header
    const tableNumberElement = document.getElementById('table-number');
    if (tableNumberElement) {
        const currentLang = document.documentElement.lang || 'en';
        tableNumberElement.textContent = translations[currentLang].tableNumber.replace('{number}', tableNumber);
        tableNumberElement.setAttribute('data-table-number', tableNumber);
    }

    // Display current order items and total
    updateOrderDisplay(tableNumber);

    // Add event listeners to "Add To Order" buttons
    const addToOrderButtons = document.querySelectorAll('.add-to-order-btn');
    addToOrderButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.getAttribute('data-item-id');
            const itemName = this.getAttribute('data-item-name');
            const price = parseFloat(this.getAttribute('data-price'));
            const quantityInput = this.parentElement.querySelector('.item-quantity');
            const quantity = parseInt(quantityInput.value) || 1;

            // Add item to order
            addItemToOrder(tableNumber, itemId, itemName, price, quantity);

            // Update order display
            updateOrderDisplay(tableNumber);

            // Show confirmation message
            const currentLang = document.documentElement.lang || 'en';
            alert(translations[currentLang].orderAdded);
        });
    });
}

// Initialize login page functionality
function initializeLoginPage() {
    console.log('Initializing login page...');

    const loginForm = document.getElementById('staff-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Check credentials
            if (staffCredentials[username] && staffCredentials[username] === password) {
                // Store login status in sessionStorage
                sessionStorage.setItem('staffLoggedIn', 'true');
                sessionStorage.setItem('staffUsername', username);

                // Redirect to staff dashboard
                window.location.href = 'staff.html';
            } else {
                // Show error message
                const errorElement = document.getElementById('login-error');
                if (errorElement) {
                    errorElement.style.display = 'block';
                }
            }
        });
    }
}

// Initialize staff page functionality
function initializeStaffPage() {
    console.log('Initializing staff page...');

    // Check if user is logged in
    const isLoggedIn = sessionStorage.getItem('staffLoggedIn') === 'true';
    if (!isLoggedIn) {
        // Redirect to login page if not logged in
        window.location.href = 'login.html';
        return;
    }

    // Add logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(event) {
            event.preventDefault();

            // Clear login status
            sessionStorage.removeItem('staffLoggedIn');
            sessionStorage.removeItem('staffUsername');

            // Redirect to login page
            window.location.href = 'login.html';
        });
    }

    // Display orders for each table
    displayAllTableOrders();

    // Add event listeners to update status buttons
    const updateStatusButtons = document.querySelectorAll('.update-status-btn');
    updateStatusButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tableNumber = this.getAttribute('data-table');
            const statusSelect = document.querySelector(`.status-select[data-table="${tableNumber}"]`);
            const newStatus = statusSelect.value;

            // Update order status
            updateOrderStatus(tableNumber, newStatus);

            // Update display
            displayAllTableOrders();
        });
    });
}

// Add item to order
function addItemToOrder(tableNumber, itemId, itemName, price, quantity) {
    // Initialize table order if it doesn't exist
    if (!tableOrders[tableNumber]) {
        tableOrders[tableNumber] = { items: [], total: 0, status: 'heard' };
    }

    // Check if item already exists in order
    const existingItemIndex = tableOrders[tableNumber].items.findIndex(item => item.id === itemId);

    if (existingItemIndex >= 0) {
        // Update existing item
        tableOrders[tableNumber].items[existingItemIndex].quantity += quantity;
    } else {
        // Add new item
        tableOrders[tableNumber].items.push({
            id: itemId,
            name: itemName,
            price: price,
            quantity: quantity
        });
    }

    // Update total
    recalculateOrderTotal(tableNumber);

    // Save to localStorage
    saveOrdersToStorage();
}

// Recalculate order total
function recalculateOrderTotal(tableNumber) {
    let total = 0;

    tableOrders[tableNumber].items.forEach(item => {
        total += item.price * item.quantity;
    });

    tableOrders[tableNumber].total = total;
}

// Update order display on table page
function updateOrderDisplay(tableNumber) {
    const totalPriceDisplay = document.getElementById('total-price-display');
    const orderItemsContainer = document.getElementById('order-items');

    if (totalPriceDisplay && orderItemsContainer) {
        // Update total price
        const currentLang = document.documentElement.lang || 'en';
        const totalPrice = tableOrders[tableNumber].total;
        totalPriceDisplay.querySelector('h3').textContent = translations[currentLang].currentTotal.replace('{price}', totalPrice.toFixed(2));
        totalPriceDisplay.querySelector('h3').setAttribute('data-price', totalPrice.toFixed(2));

        // Clear current items
        orderItemsContainer.innerHTML = '';

        // Add items to display
        if (tableOrders[tableNumber].items.length === 0) {
            orderItemsContainer.innerHTML = '<p>No items in order yet</p>';
        } else {
            tableOrders[tableNumber].items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'order-item';
                itemElement.innerHTML = `
                    <span class="item-name">${item.name}</span>
                    <span class="item-quantity">x${item.quantity}</span>
                    <span class="item-price">€${(item.price * item.quantity).toFixed(2)}</span>
                `;
                orderItemsContainer.appendChild(itemElement);
            });
        }
    }
}

// Display all table orders on staff page
function displayAllTableOrders() {
    for (let tableNumber = 1; tableNumber <= 4; tableNumber++) {
        const orderListElement = document.getElementById(`table${tableNumber}-orders`);

        if (orderListElement) {
            // Clear current items
            orderListElement.innerHTML = '';

            // Add items to display
            if (!tableOrders[tableNumber] || tableOrders[tableNumber].items.length === 0) {
                const noOrdersElement = document.createElement('p');
                noOrdersElement.className = 'no-orders';
                noOrdersElement.setAttribute('data-i18n', 'noOrders');

                const currentLang = document.documentElement.lang || 'en';
                noOrdersElement.textContent = translations[currentLang].noOrders;

                orderListElement.appendChild(noOrdersElement);
            } else {
                // Add status indicator
                const statusElement = document.createElement('div');
                statusElement.className = `status-indicator status-${tableOrders[tableNumber].status}`;

                const currentLang = document.documentElement.lang || 'en';
                let statusText = '';

                switch (tableOrders[tableNumber].status) {
                    case 'heard':
                        statusText = translations[currentLang].orderHeard;
                        break;
                    case 'preparing':
                        statusText = translations[currentLang].orderPreparing;
                        break;
                    case 'serving':
                        statusText = translations[currentLang].orderServing;
                        break;
                    case 'delivered':
                        statusText = translations[currentLang].orderDelivered;
                        break;
                }

                statusElement.textContent = statusText;
                orderListElement.appendChild(statusElement);

                // Add items
                tableOrders[tableNumber].items.forEach(item => {
                    const itemElement = document.createElement('div');
                    itemElement.className = 'order-item';
                    itemElement.innerHTML = `
                        <span class="item-name">${item.name}</span>
                        <span class="item-quantity">x${item.quantity}</span>
                        <span class="item-price">€${(item.price * item.quantity).toFixed(2)}</span>
                    `;
                    orderListElement.appendChild(itemElement);
                });

                // Add total
                const totalElement = document.createElement('div');
                totalElement.className = 'order-total';
                totalElement.innerHTML = `
                    <span class="total-label">${translations[currentLang].totalPrice.replace('{price}', tableOrders[tableNumber].total.toFixed(2))}</span>
                `;
                orderListElement.appendChild(totalElement);
            }

            // Update status select to match current status
            const statusSelect = document.querySelector(`.status-select[data-table="${tableNumber}"]`);
            if (statusSelect && tableOrders[tableNumber]) {
                statusSelect.value = tableOrders[tableNumber].status;
            }
        }
    }
}

// Update order status
function updateOrderStatus(tableNumber, newStatus) {
    if (tableOrders[tableNumber]) {
        tableOrders[tableNumber].status = newStatus;
        saveOrdersToStorage();
    }
}

// Save orders to localStorage
function saveOrdersToStorage() {
    localStorage.setItem('tableOrders', JSON.stringify(tableOrders));
}

// Load orders from localStorage
function loadOrdersFromStorage() {
    const savedOrders = localStorage.getItem('tableOrders');
    if (savedOrders) {
        tableOrders = JSON.parse(savedOrders);
    }
}

// Initialize language functionality
function initializeLanguage() {
    // Get language selector element
    const languageSelect = document.getElementById('language-select');

    // Set initial language (default to browser language or English)
    const browserLang = navigator.language.split('-')[0];
    const initialLang = (browserLang === 'es') ? 'es' : 'en';

    // Set the language in the selector
    languageSelect.value = initialLang;

    // Set the document language
    document.documentElement.lang = initialLang;

    // Apply initial translations
    applyTranslations(initialLang);

    // Add event listener for language change
    languageSelect.addEventListener('change', (event) => {
        const selectedLang = event.target.value;
        document.documentElement.lang = selectedLang;
        applyTranslations(selectedLang);
    });
}

// Apply translations based on selected language
function applyTranslations(lang) {
    // Get all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            // Special case for table number
            if (key === 'tableNumber' && element.hasAttribute('data-table-number')) {
                const tableNumber = element.getAttribute('data-table-number');
                element.textContent = translations[lang][key].replace('{number}', tableNumber);
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });

    // Handle elements with data-i18n-placeholder attribute (for textareas, inputs)
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });

    // Handle elements with data-i18n-value attribute (for buttons, inputs)
    const valueElements = document.querySelectorAll('[data-i18n-value]');
    valueElements.forEach(element => {
        const key = element.getAttribute('data-i18n-value');
        if (translations[lang][key]) {
            element.value = translations[lang][key];
        }
    });

    // Update current total price display if it exists
    const totalPriceDisplay = document.getElementById('total-price-display');
    if (totalPriceDisplay) {
        const priceElement = totalPriceDisplay.querySelector('[data-i18n="currentTotal"]');
        if (priceElement) {
            const price = priceElement.getAttribute('data-price') || '0.00';
            priceElement.textContent = translations[lang].currentTotal.replace('{price}', price);
        }
    }

    // Update page title
    document.title = translations[lang].restaurantName;

    // If on table page, update table number
    const tableNumberElement = document.getElementById('table-number');
    if (tableNumberElement) {
        const tableNumber = tableNumberElement.getAttribute('data-table-number') || '1';
        tableNumberElement.textContent = translations[lang].tableNumber.replace('{number}', tableNumber);
    }

    // If on staff page, update order status texts
    if (window.location.pathname.includes('staff.html')) {
        displayAllTableOrders();
    }
}
