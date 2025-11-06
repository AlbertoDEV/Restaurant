// Restaurant application with language switching, order management, and staff functionality

// Global variables for order management
let tableOrders = {
    1: { rounds: [], currentOrder: { items: [], total: 0 }, total: 0, status: 'heard' },
    2: { rounds: [], currentOrder: { items: [], total: 0 }, total: 0, status: 'heard' },
    3: { rounds: [], currentOrder: { items: [], total: 0 }, total: 0, status: 'heard' },
    4: { rounds: [], currentOrder: { items: [], total: 0 }, total: 0, status: 'heard' }
};

// Staff credentials are now managed by the backend.

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
    } else if (currentPage === 'history.html') {
        // Ticket history functionality
        initializeHistoryPage();
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
    updateRoundsDisplay(tableNumber);

    // Add event listener for order round button
    const orderRoundBtn = document.getElementById('order-round-btn');
    if (orderRoundBtn) {
        orderRoundBtn.addEventListener('click', () => orderRound(tableNumber));
    }

    // Add event listener for request bill button
    const requestBillBtn = document.getElementById('request-bill-btn');
    if (requestBillBtn) {
        requestBillBtn.addEventListener('click', () => requestBill(tableNumber));
    }

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

    // Check for login error parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
        const errorElement = document.getElementById('login-error');
        if (errorElement) {
            errorElement.style.display = 'block';
        }
    }
}

// Initialize staff page functionality
function initializeStaffPage() {
    console.log('Initializing staff page...');

    // The user is authenticated by Spring Security at this point.
    // The old sessionStorage check is no longer needed.

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

    // Add event listeners to settle bill buttons
    const settleBillButtons = document.querySelectorAll('.settle-bill-btn');
    settleBillButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tableNumber = this.getAttribute('data-table');
            settleBill(tableNumber);
        });
    });
}

function settleBill(tableNumber) {
    // Generate ticket
    const ticket = {
        ticketNumber: Date.now(), // Simple unique ID
        date: new Date().toISOString(),
        tableNumber: tableNumber,
        total: tableOrders[tableNumber].total
    };

    // Save ticket to history
    let ticketHistory = JSON.parse(localStorage.getItem('ticketHistory')) || [];
    ticketHistory.push(ticket);
    localStorage.setItem('ticketHistory', JSON.stringify(ticketHistory));

    // Clear table order
    tableOrders[tableNumber] = { rounds: [], currentOrder: { items: [], total: 0 }, total: 0, status: 'heard' };
    saveOrdersToStorage();

    // Update display
    displayAllTableOrders();
}

// Add item to order
function addItemToOrder(tableNumber, itemId, itemName, price, quantity) {
    const currentOrder = tableOrders[tableNumber].currentOrder;

    // Check if item already exists in order
    const existingItemIndex = currentOrder.items.findIndex(item => item.id === itemId);

    if (existingItemIndex >= 0) {
        // Update existing item
        currentOrder.items[existingItemIndex].quantity += quantity;
    } else {
        // Add new item
        currentOrder.items.push({
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
    let currentOrderTotal = 0;
    tableOrders[tableNumber].currentOrder.items.forEach(item => {
        currentOrderTotal += item.price * item.quantity;
    });
    tableOrders[tableNumber].currentOrder.total = currentOrderTotal;

    let grandTotal = 0;
    tableOrders[tableNumber].rounds.forEach(round => {
        grandTotal += round.total;
    });
    grandTotal += currentOrderTotal;
    tableOrders[tableNumber].total = grandTotal;
}

// Update order display on table page
function updateOrderDisplay(tableNumber) {
    const totalPriceDisplay = document.getElementById('total-price-display');
    const orderItemsContainer = document.getElementById('order-items');

    if (totalPriceDisplay && orderItemsContainer) {
        const currentOrder = tableOrders[tableNumber].currentOrder;
        const grandTotal = tableOrders[tableNumber].total;
        const currentLang = document.documentElement.lang || 'en';

        // Update total price
        totalPriceDisplay.querySelector('h3').textContent = translations[currentLang].currentTotal.replace('{price}', grandTotal.toFixed(2));
        totalPriceDisplay.querySelector('h3').setAttribute('data-price', grandTotal.toFixed(2));

        // Clear current items
        orderItemsContainer.innerHTML = '';

        // Add items to display
        if (currentOrder.items.length === 0) {
            orderItemsContainer.innerHTML = `<p data-i18n="noItemsInOrder">${translations[currentLang].noItemsInOrder}</p>`;
        } else {
            currentOrder.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'order-item';
                itemElement.innerHTML = `
                    <span class="item-name">${translations[currentLang][item.name] || item.name}</span>
                    <span class="item-quantity">x${item.quantity}</span>
                    <span class="item-price">€${(item.price * item.quantity).toFixed(2)}</span>
                `;
                orderItemsContainer.appendChild(itemElement);
            });
        }
    }
}

// Order a round
function orderRound(tableNumber) {
    const currentOrder = tableOrders[tableNumber].currentOrder;
    if (currentOrder.items.length === 0) {
        const currentLang = document.documentElement.lang || 'en';
        alert(translations[currentLang].addItemsMessage);
        return;
    }

    // Add current order to rounds
    tableOrders[tableNumber].rounds.push({ ...currentOrder, roundNumber: tableOrders[tableNumber].rounds.length + 1 });

    // Reset current order
    tableOrders[tableNumber].currentOrder = { items: [], total: 0 };

    // Recalculate totals
    recalculateOrderTotal(tableNumber);

    // Update display
    updateOrderDisplay(tableNumber);
    updateRoundsDisplay(tableNumber);

    // Save to localStorage
    saveOrdersToStorage();
}

// Request the bill
function requestBill(tableNumber) {
    if (!tableOrders[tableNumber] || tableOrders[tableNumber].rounds.length === 0) {
        alert("You have no orders to pay for.");
        return;
    }

    // Set status to "paying"
    tableOrders[tableNumber].status = 'paying';

    // Save to localStorage
    saveOrdersToStorage();

    // Notify user
    const currentLang = document.documentElement.lang || 'en';
    alert(translations[currentLang].billRequested);

    // Optionally, disable buttons
    document.getElementById('order-round-btn').disabled = true;
    document.getElementById('request-bill-btn').disabled = true;
    document.querySelectorAll('.add-to-order-btn').forEach(btn => btn.disabled = true);
}


// Update rounds display on table page
function updateRoundsDisplay(tableNumber) {
    const roundsListContainer = document.getElementById('rounds-list');
    if (!roundsListContainer) return;

    roundsListContainer.innerHTML = '';
    const rounds = tableOrders[tableNumber].rounds;
    const currentLang = document.documentElement.lang || 'en';

    if (rounds.length > 0) {
        rounds.forEach(round => {
            const roundElement = document.createElement('div');
            roundElement.className = 'round-container';

            let itemsHtml = '';
            round.items.forEach(item => {
                itemsHtml += `
                    <div class="order-item">
                        <span class="item-name">${translations[currentLang][item.name] || item.name}</span>
                        <span class="item-quantity">x${item.quantity}</span>
                        <span class="item-price">€${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `;
            });

            roundElement.innerHTML = `
                <h4>Round ${round.roundNumber} - Total: €${round.total.toFixed(2)}</h4>
                ${itemsHtml}
            `;
            roundsListContainer.appendChild(roundElement);
        });
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
            if (!tableOrders[tableNumber] || (tableOrders[tableNumber].rounds.length === 0 && tableOrders[tableNumber].currentOrder.items.length === 0)) {
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
                    case 'paying':
                        statusText = translations[currentLang].orderPaying;
                        break;
                }

                statusElement.textContent = statusText;
                orderListElement.appendChild(statusElement);

                // Add rounds
                tableOrders[tableNumber].rounds.forEach(round => {
                    const roundElement = document.createElement('div');
                    roundElement.className = 'round-container';

                    let itemsHtml = '';
                    round.items.forEach(item => {
                        itemsHtml += `
                            <div class="order-item">
                                <span class="item-name">${translations[currentLang][item.name] || item.name}</span>
                                <span class="item-quantity">x${item.quantity}</span>
                                <span class="item-price">€${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `;
                    });

                    roundElement.innerHTML = `
                        <h4>Round ${round.roundNumber}</h4>
                        ${itemsHtml}
                    `;
                    orderListElement.appendChild(roundElement);
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

            const settleBillBtn = document.querySelector(`.settle-bill-btn[data-table="${tableNumber}"]`);
            if (settleBillBtn) {
                if (tableOrders[tableNumber]?.status === 'paying') {
                    settleBillBtn.classList.remove('hidden');
                } else {
                    settleBillBtn.classList.add('hidden');
                }
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
        let loadedOrders = JSON.parse(savedOrders);
        let needsMigration = false;

        // Check if migration is needed
        for (const tableNum in loadedOrders) {
            if (loadedOrders.hasOwnProperty(tableNum) && loadedOrders[tableNum].items) {
                needsMigration = true;
                break;
            }
        }

        if (needsMigration) {
            for (const tableNum in loadedOrders) {
                if (loadedOrders.hasOwnProperty(tableNum) && loadedOrders[tableNum].items) {
                    const oldOrder = loadedOrders[tableNum];
                    loadedOrders[tableNum] = {
                        rounds: [],
                        currentOrder: { items: [], total: 0 },
                        total: oldOrder.total || 0,
                        status: oldOrder.status || 'heard'
                    };
                    if (oldOrder.items && oldOrder.items.length > 0) {
                        loadedOrders[tableNum].rounds.push({
                            items: oldOrder.items,
                            total: oldOrder.total || 0,
                            roundNumber: 1
                        });
                    }
                }
            }
            // Save the migrated structure back to localStorage
            localStorage.setItem('tableOrders', JSON.stringify(loadedOrders));
        }

        tableOrders = loadedOrders;
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

// Function to initialize the history page
function initializeHistoryPage() {
    console.log('Initializing history page...');
    displayTicketHistory();

    const generatePdfBtn = document.getElementById('generate-pdf-btn');
    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', generateAndClearHistory);
    }
}

// Function to display ticket history
function displayTicketHistory() {
    const historyGrid = document.getElementById('history-grid');
    if (!historyGrid) return;

    // Clear existing history to avoid duplication
    // Keep the headers
    const headers = historyGrid.querySelectorAll('.grid-header');
    historyGrid.innerHTML = '';
    headers.forEach(header => historyGrid.appendChild(header));


    const ticketHistory = JSON.parse(localStorage.getItem('ticketHistory')) || [];

    if (ticketHistory.length === 0) {
        const noTicketsMessage = document.createElement('p');
        noTicketsMessage.textContent = 'No tickets in history yet.';
        noTicketsMessage.className = 'full-width-message'; // For styling
        historyGrid.appendChild(noTicketsMessage);
        return;
    }

    // Add headers for new columns
    if (headers.length === 2) { // Assuming only Date and Ticket Number are there initially
        const tableHeader = document.createElement('div');
        tableHeader.className = 'grid-header';
        tableHeader.dataset.i18n = 'table';
        tableHeader.textContent = 'Table';
        historyGrid.appendChild(tableHeader);

        const totalHeader = document.createElement('div');
        totalHeader.className = 'grid-header';
        totalHeader.dataset.i18n = 'total';
        totalHeader.textContent = 'Total';
        historyGrid.appendChild(totalHeader);
    }


    ticketHistory.forEach(ticket => {
        const dateCell = document.createElement('div');
        dateCell.textContent = new Date(ticket.date).toLocaleString();
        historyGrid.appendChild(dateCell);

        const ticketNumberCell = document.createElement('div');
        ticketNumberCell.textContent = ticket.ticketNumber;
        historyGrid.appendChild(ticketNumberCell);

        const tableNumberCell = document.createElement('div');
        tableNumberCell.textContent = ticket.tableNumber;
        historyGrid.appendChild(tableNumberCell);

        const totalCell = document.createElement('div');
        totalCell.textContent = `€${ticket.total.toFixed(2)}`;
        historyGrid.appendChild(totalCell);
    });
}

/**
 * Generates a PDF from the ticket history and clears it.
 * This function uses the html2canvas library to capture the history grid as an image,
 * and jsPDF to insert that image into a PDF document.
 * After generating the PDF, it clears the ticket history from localStorage.
 */
function generateAndClearHistory() {
    // Check if jsPDF and html2canvas are loaded
    if (typeof jspdf === 'undefined' || typeof html2canvas === 'undefined') {
        console.error('jsPDF or html2canvas not loaded!');
        alert('Could not generate PDF. Required libraries are missing.');
        return;
    }

    const { jsPDF } = jspdf;
    const historyGrid = document.getElementById('history-grid');

    // Check if there is anything to generate
    const ticketHistory = JSON.parse(localStorage.getItem('ticketHistory')) || [];
    if (ticketHistory.length === 0) {
        alert('No tickets in history to generate a PDF.');
        return;
    }

    // Use html2canvas to render the grid as an image
    html2canvas(historyGrid).then(canvas => {
        // 'canvas' is the image of the grid
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();

        // Add the image to the PDF
        // 'imgData' is the image data
        // 'PNG' is the format
        // 10, 10 are the x, y coordinates
        // 190 is the width (A4 is 210mm wide, we leave some margin)
        // The height is calculated automatically to maintain aspect ratio
        pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);

        // Create a formatted timestamp for the filename
        const now = new Date();
        const timestamp = now.getFullYear() +
                          '-' + String(now.getMonth() + 1).padStart(2, '0') +
                          '-' + String(now.getDate()).padStart(2, '0') +
                          '_' + String(now.getHours()).padStart(2, '0') +
                          '-' + String(now.getMinutes()).padStart(2, '0') +
                          '-' + String(now.getSeconds()).padStart(2, '0');

        const filename = `historial-tickets-${timestamp}.pdf`;

        // Save the PDF with the dynamic filename
        pdf.save(filename);

        // Clear the history from localStorage
        localStorage.removeItem('ticketHistory');

        // Update the display to show an empty history
        displayTicketHistory();

        // Notify the user
        alert('PDF generated and history cleared successfully!');
    }).catch(err => {
        console.error('Error generating PDF:', err);
        alert('An error occurred while generating the PDF.');
    });
}
