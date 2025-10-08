// js/ui-components.js
import { createElementWithClass } from './utils.js';
import { selectedItems, updateCartUI } from './cart-manager.js';

// --- State for UI components ---
let pendingProduct = { category: null, id: null };
let itemToDelete = null;
let currentCarouselIndex = 0;
let selectedColors = [];
let currentModalColors = [];

// --- DOM Elements Cache ---
const elements = {
    mainContent: document.getElementById('main-content'),
    floatingCartBtn: document.getElementById('floating-cart-btn'),
    cartBadge: document.getElementById('cart-badge'),
    selectedItemsSummary: document.getElementById('selected-items-summary'),
    totalItemsCount: document.getElementById('total-items-count'),
    finalSubmitBtn: document.getElementById('final-submit-btn'),
    reviewTbody: document.getElementById('review-tbody'),
    colorModal: document.getElementById('color-modal'),
    deleteModal: document.getElementById('delete-modal'),
    sidebarCart: document.getElementById('sidebar-cart'),
    startButton: document.getElementById('start-button'),
    stageToolbar: document.getElementById('stage-toolbar'),
    navItemsWrapper: document.getElementById('nav-items-wrapper'),
    modalProductName: document.getElementById('modal-product-name'),
    carouselInner: document.getElementById('carousel-inner'),
    carouselContainer: document.getElementById('carousel-container')
};

// --- Cart UI Functions ---
export function updateCartBadge() {
    const totalCount = Object.values(selectedItems).reduce((sum, item) => sum + item.count, 0);
    elements.cartBadge.textContent = totalCount;
    elements.cartBadge.classList.toggle('visible', totalCount > 0);
    elements.cartBadge.classList.toggle('pop', totalCount > 0);
    setTimeout(() => elements.cartBadge.classList.remove('pop'), 300);
    elements.floatingCartBtn.setAttribute('aria-label', `باز کردن سبد خرید با ${totalCount} محصول`);
}

export function updateSidebarSummary() {
    const itemKeys = Object.keys(selectedItems);
    if (itemKeys.length === 0) {
        elements.selectedItemsSummary.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-basket"></i>
                <p>سبد خرید شما خالی است!</p>
                <button onclick="product.goToStage('tray')">شروع به خرید</button>
            </div>
        `;
        return;
    }

    elements.selectedItemsSummary.innerHTML = '';
    itemKeys.forEach(key => {
        const item = selectedItems[key];
        const itemDiv = createElementWithClass('div', 'summary-item');
        itemDiv.innerHTML = `
            <div class="summary-item-info">
                <span class="item-color-swatch" style="background-color: ${item.color};" title="${item.colorName}"></span>
                <div>
                    <div>${item.category} مدل ${item.model}</div>
                    <small style="color: #ccc;">${item.colorName}</small>
                </div>
            </div>
            <div class="summary-item-controls">
                <button class="quantity-btn" onclick="cart.changeCount('${key}', 1, event)">+</button>
                <span class="quantity-value">${item.count}</span>
                <button class="quantity-btn" onclick="cart.changeCount('${key}', -1, event)">-</button>
                <div class="tooltip-wrapper" data-tooltip="حذف محصول">
                    <button class="remove-item-btn" onclick="ui.requestDeleteItem('${key}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        elements.selectedItemsSummary.appendChild(itemDiv);
    });
}

export function updateTotalCount() {
    const totalCount = Object.values(selectedItems).reduce((sum, item) => sum + item.count, 0);
    elements.totalItemsCount.textContent = totalCount;
}

export function updateSubmitButton() {
    elements.finalSubmitBtn.disabled = (Object.keys(selectedItems).length === 0);
}

// --- Stage & Product Grid UI ---
export function renderActiveStage(stageId, productKeys, config) {
    const stages = ['stage-welcome', ...productKeys.map(key => `stage-${key}`), 'stage-review'];
    stages.forEach((id, index) => {
        const stageEl = document.getElementById(id);
        if (stageEl) {
            stageEl.classList.toggle('active', id === stageId);
        }
    });

    if (stageId === 'stage-welcome' || stageId === 'stage-review') {
        elements.stageToolbar.style.display = stageId === 'stage-welcome' ? 'none' : 'block';
        if (stageId === 'stage-review') {
            populateReviewTable();
        }
    } else {
        elements.stageToolbar.style.display = 'block';
    }
}

export function updateNavItems(activeKey, productKeys, config) {
    elements.navItemsWrapper.innerHTML = '';
    productKeys.forEach(key => {
        const li = createElementWithClass('li', key === activeKey ? 'active' : '');
        li.id = `nav-${key}`;
        li.tabIndex = 0;
        li.setAttribute('aria-selected', key === activeKey ? 'true' : 'false');
        li.textContent = config.products[key].name;
        li.onclick = () => window.product.goToStage(key);
        li.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.product.goToStage(key);
            }
        };
        elements.navItemsWrapper.appendChild(li);
    });
}

export function showSkeletons(productKey) {
    const grid = document.getElementById(`${productKey}-options`);
    grid.innerHTML = '';
    // You can make this more dynamic if needed
    for (let i = 0; i < 4; i++) {
        grid.innerHTML += '<div class="skeleton-card"></div>';
    }
}

export function renderProductGrid(productKey, config) {
    const optionsDiv = document.getElementById(`${productKey}-options`);
    optionsDiv.innerHTML = '';

    config.products[productKey].items.forEach(item => {
        const card = createElementWithClass('div', 'product-card');
        card.tabIndex = 0;

        const itemKey = `${productKey}-${item.id}`;
        const isSelected = Object.keys(selectedItems).some(key => key.startsWith(itemKey));
        if (isSelected) card.classList.add('selected');

        let colorSwatchesHtml = '';
        if (item.colors && item.colors.length > 0) {
            colorSwatchesHtml = '<div class="product-colors">';
            item.colors.forEach(color => {
                colorSwatchesHtml += `<span class="color-dot" style="background-color: ${color.hex};" title="${color.name}"></span>`;
            });
            colorSwatchesHtml += '</div>';
        }

        card.innerHTML = `
            <div class="product-image">
                <img src="${item.imagesByColor[item.colors[0].hex] || 'https://picsum.photos/seed/fallback/300/300'}" alt="${item.description}" loading="lazy" onerror="this.src='https://picsum.photos/seed/fallback/300/300'; this.onerror=null;">
            </div>
            <div class="product-info">
                <div class="product-specs">
                    <ul>
                        <li><span>توضیح:</span><span>${item.description}</span></li>
                        <li><span>ارتفاع:</span><span>${item.height || 'N/A'}</span></li>
                        <li><span>عرض:</span><span>${item.width || 'N/A'}</span></li>
                        <li><span>قطر دهانه:</span><span>${item.openingDiameter || 'N/A'}</span></li>
                        <li><span>قیمت:</span><span>${item.price || 'N/A'}</span></li>
                    </ul>
                </div>
                ${colorSwatchesHtml}
            </div>
        `;

        card.onclick = () => openColorModal(productKey, item.id, config);
        card.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openColorModal(productKey, item.id, config);
            }
        };
        optionsDiv.appendChild(card);
    });
}

// --- Modal Functions ---
export function openColorModal(category, id, config) {
    pendingProduct = { category, id };
    currentCarouselIndex = 0;

    const modalTitle = elements.modalProductName;
    const colorOptionsDiv = document.getElementById('color-options');
    const product = config.products[category].items.find(item => item.id === id);

    modalTitle.textContent = product.description;
    currentModalColors = product.colors || [];
    selectedColors = currentModalColors.map(color => ({ hex: color.hex, quantity: 0 }));

    // Setup carousel
    elements.carouselInner.innerHTML = '';
    elements.carouselInner.style.transform = `translateX(0%)`;

    currentModalColors.forEach((color, index) => {
        const carouselItem = createElementWithClass('div', 'carousel-item');
        const colorImage = product.imagesByColor[color.hex] || 'https://picsum.photos/seed/fallback/300/300';
        const img = document.createElement('img');
        img.src = colorImage;
        img.alt = `پیش‌نمایش محصول با رنگ ${color.name}`;
        img.loading = 'lazy';
        img.onerror = () => { img.src = 'https://picsum.photos/seed/fallback/300/300'; img.onerror = null; };
        carouselItem.appendChild(img);
        elements.carouselInner.appendChild(carouselItem);
    });

    // Setup colors with quantity selectors
    colorOptionsDiv.innerHTML = '';
    currentModalColors.forEach((color, index) => {
        const swatchWrapper = createElementWithClass('div', 'color-swatch-wrapper');
        const swatch = createElementWithClass('div', 'color-swatch-option');
        swatch.style.backgroundColor = color.hex;
        swatch.title = color.name;
        swatch.dataset.index = index;

        swatch.onclick = (e) => {
            e.stopPropagation();
            currentCarouselIndex = index;
            elements.carouselInner.style.transform = `translateX(-${currentCarouselIndex * 100}%)`;
            updateActiveViewIndicator();
        };
        swatchWrapper.appendChild(swatch);

        const quantitySelector = createElementWithClass('div', 'quantity-selector');
        quantitySelector.innerHTML = `
            <button class="quantity-btn" onclick="event.stopPropagation(); ui.changeColorQuantity(${index}, -1)">-</button>
            <span class="quantity-value">0</span>
            <button class="quantity-btn" onclick="event.stopPropagation(); ui.changeColorQuantity(${index}, 1)">+</button>
        `;
        swatchWrapper.appendChild(quantitySelector);
        colorOptionsDiv.appendChild(swatchWrapper);
    });

    elements.colorModal.style.display = 'block';
    updateActiveViewIndicator();
}

export function closeColorModal() {
    elements.colorModal.style.display = 'none';
}

export function changeColorQuantity(index, delta) {
    const colorEntry = selectedColors[index];
    const newQuantity = Math.max(0, colorEntry.quantity + delta);

    colorEntry.quantity = newQuantity;
    document.querySelectorAll('.quantity-value')[index].textContent = newQuantity;

    const swatch = document.querySelectorAll('.color-swatch-option')[index];
    if (newQuantity > 0) {
        swatch.classList.add('selected');
    } else {
        swatch.classList.remove('selected');
    }
}

export function confirmSelection(config) {
    const { category, id } = pendingProduct;
    const product = config.products[category].items.find(item => item.id === id);

    selectedColors.forEach(colorEntry => {
        if (colorEntry.quantity > 0) {
            const hex = colorEntry.hex;
            const color = currentModalColors.find(c => c.hex === hex);
            if (color) {
                const key = `${category}-${id}-${hex}`;
                if (selectedItems[key]) {
                    selectedItems[key].count += colorEntry.quantity;
                } else {
                    selectedItems[key] = {
                        category: config.products[category].name,
                        model: id,
                        color: hex,
                        colorName: color.name,
                        count: colorEntry.quantity
                    };
                }
            }
        }
    });
    closeColorModal();
    updateCartUI();
    window.product.renderActiveStage(); // Re-render to update 'selected' class
}

export function changeCarouselSlide(delta) {
    currentCarouselIndex = (currentCarouselIndex + delta + currentModalColors.length) % currentModalColors.length;
    elements.carouselInner.style.transform = `translateX(-${currentCarouselIndex * 100}%)`;
    updateActiveViewIndicator();
}

function updateActiveViewIndicator() {
    document.querySelectorAll('.color-swatch-option').forEach((swatch, index) => {
        if (index === currentCarouselIndex) {
            swatch.classList.add('active-view');
        } else {
            swatch.classList.remove('active-view');
        }
    });
}

// --- Delete Modal ---
export function requestDeleteItem(key) {
    itemToDelete = key;
    elements.deleteModal.style.display = 'block';
}

export function closeDeleteModal(event) {
    if (event) event.stopPropagation();
    elements.deleteModal.style.display = 'none';
    itemToDelete = null;
}

export function confirmDelete(event) {
    if (event) event.stopPropagation();
    if (itemToDelete) {
        window.cart.confirmDelete(itemToDelete);
    }
    closeDeleteModal();
}

// --- Review Table ---
export function populateReviewTable() {
    elements.reviewTbody.innerHTML = '';
    Object.keys(selectedItems).forEach(key => {
        const item = selectedItems[key];
        const row = elements.reviewTbody.insertRow();
        row.innerHTML = `
            <td>${item.category}</td>
            <td>مدل ${item.model}</td>
            <td class="color-cell"><span class="color-swatch" style="background-color: ${item.color}"></span> ${item.colorName}</td>
            <td>${item.count}</td>
            <td class="action-cell">
                <button class="btn-secondary btn-small" onclick="product.editItem('${key}')">ویرایش</button>
                <button class="btn-danger btn-small" onclick="ui.requestDeleteItem('${key}')">حذف</button>
            </td>
        `;
    });
}

// --- Sidebar ---
export function toggleSidebar() {
    const body = document.body;
    body.classList.toggle('sidebar-open');
    if (!body.classList.contains('sidebar-open')) {
        elements.sidebarCart.style.transform = '';
    }
}


export function setupCarouselSwipe() {
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50; // حداقل فاصله برای تشخیص swipe

    const handleTouchStart = (e) => {
        // موقعیت شروع لمس را ذخیره کن
        touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e) => {
        // موقعیت پایان لمس را ذخیره کن
        touchEndX = e.changedTouches[0].screenX;
        // و سپس ژستور را بررسی کن
        handleSwipeGesture();
    };

    const handleSwipeGesture = () => {
        const swipeDistance = touchEndX - touchStartX;
        if (swipeDistance > swipeThreshold) {
            // اگر انگشت به راست کشیده شد، به تصویر قبلی برو
            changeCarouselSlide(-1);
        } else if (swipeDistance < -swipeThreshold) {
            // اگر انگشت به چپ کشیده شد، به تصویر بعدی برو
            changeCarouselSlide(1);
        }
    };

    // شنونده‌های رویداد تاچ را به کانتینر کاروسل اضافه کن
    // این کار فقط یک بار انجام می‌شود
    elements.carouselContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    elements.carouselContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
}

// Expose ui functions to global scope for inline onclick handlers
window.ui = {
    toggleSidebar,
    openColorModal,
    closeColorModal,
    changeColorQuantity,
    confirmSelection,
    changeCarouselSlide,
    requestDeleteItem,
    closeDeleteModal,
    confirmDelete
};
