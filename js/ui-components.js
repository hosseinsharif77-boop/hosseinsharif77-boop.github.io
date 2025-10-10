import { createElementWithClass } from './utils.js';
import { selectedItems, updateCartUI, changeCount } from './cart-manager.js';
import config from './config.js';

// --- State for UI components ---
let pendingProduct = { category: null, id: null };
let itemToDelete = null;
let currentCarouselIndex = 0;
let selectedColors = [];
let currentModalColors = [];
let activeColorIndex = null;
let currentEditKey = null;

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
    carouselContainer: document.getElementById('carousel-container'),
    editQuantityModal: document.getElementById('edit-quantity-modal'),
    editItemInfo: document.getElementById('edit-item-info'),
    editQuantityValue: document.getElementById('edit-quantity-value'),
    decreaseQuantityBtn: document.getElementById('decrease-quantity'),
    increaseQuantityBtn: document.getElementById('increase-quantity'),
    deleteItemBtn: document.getElementById('delete-item-btn')
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
                <button class="start-shopping-btn">شروع به خرید</button>
            </div>
        `;
        const startBtn = elements.selectedItemsSummary.querySelector('.start-shopping-btn');
        startBtn.addEventListener('click', () => {
            window.ui.toggleSidebar();
            window.product.goToStage('tray');
        });
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
                    <div>${item.category} مدل ${item.description}</div>
                    <small style="color: #ccc;">${item.colorName}</small>
                </div>
            </div>
            <div class="summary-item-controls">
                <button class="quantity-btn increase">+</button>
                <span class="quantity-value">${item.count}</span>
                <button class="quantity-btn decrease">-</button>
                <div class="tooltip-wrapper" data-tooltip="حذف محصول">
                    <button class="remove-item-btn"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        const increaseBtn = itemDiv.querySelector('.increase');
        const decreaseBtn = itemDiv.querySelector('.decrease');
        const removeBtn = itemDiv.querySelector('.remove-item-btn');
        increaseBtn.addEventListener('click', (event) => window.cart.changeCount(key, 1, event));
        decreaseBtn.addEventListener('click', (event) => window.cart.changeCount(key, -1, event));
        removeBtn.addEventListener('click', () => window.ui.requestDeleteItem(key));
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
    const mainContentEl = document.querySelector('main');
    if (stageId === 'stage-welcome') {
        mainContentEl.classList.remove('main-content-with-bg');
    } else {
        mainContentEl.classList.add('main-content-with-bg');
    }
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
        li.id = `tab-${key}`;
        li.tabIndex = 0;
        li.setAttribute('aria-selected', key === activeKey ? 'true' : 'false');
        li.textContent = config.products[key].name;
        li.addEventListener('click', () => {
            window.preventScrollReset = false;
            window.product.goToStage(key);
            setTimeout(() => {
                const activeTab = li;
                activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center' });
            }, 0);
        });
        li.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.preventScrollReset = false;
                window.product.goToStage(key);
                setTimeout(() => {
                    const activeTab = li;
                    activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                }, 0);
            }
        });
        elements.navItemsWrapper.appendChild(li);
    });
    console.log(`🔍 Updated nav items: ${elements.navItemsWrapper.querySelectorAll('li').length} items created`);

    // اسکرول به وسط تب فعال بلافاصله پس از به‌روزرسانی
    setTimeout(() => {
        const activeTab = elements.navItemsWrapper.querySelector('.active');
        if (activeTab) {
            activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
    }, 0);
}

export function showSkeletons(productKey) {
    const grid = document.getElementById(`${productKey}-options`);
    grid.innerHTML = '';
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
                <img src="${item.imagesByColor[item.colors[0].hex] || 'https://picsum.photos/seed/fallback/300/300'}" alt="${item.description}" loading="lazy">
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

        const img = card.querySelector('img');
        img.onerror = function() {
            this.src = 'https://picsum.photos/seed/fallback/300/300';
            this.onerror = null;
        };

        // --- اصلاح شده: استفاده از addEventListener ---
        card.addEventListener('click', () => openColorModal(productKey, item.id, config));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openColorModal(productKey, item.id, config);
            }
        });
        
        optionsDiv.appendChild(card);
    });
}

// --- Modal Functions ---
export function openColorModal(category, id, config) {
    pendingProduct = { category, id };
    currentCarouselIndex = 0;
    activeColorIndex = null;

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

    // Setup colors without individual selectors
    colorOptionsDiv.innerHTML = '';
    currentModalColors.forEach((color, index) => {
        const swatchWrapper = createElementWithClass('div', 'color-swatch-wrapper');
        const swatch = createElementWithClass('div', 'color-swatch-option');
        swatch.style.backgroundColor = color.hex;
        swatch.title = color.name;
        swatch.dataset.index = index;

        // --- اصلاح شده: استفاده از addEventListener ---
        swatch.addEventListener('click', () => selectColor(index));

        swatchWrapper.appendChild(swatch);
        colorOptionsDiv.appendChild(swatchWrapper);
    });

    // Add universal selector if it doesn't exist
    const modalContent = elements.colorModal.querySelector('.modal-content');
    let universalSelector = document.getElementById('universal-selector');
    if (!universalSelector) {
        universalSelector = createElementWithClass('div', 'universal-selector');
        universalSelector.id = 'universal-selector';
        universalSelector.innerHTML = `
            <p>رنگ انتخاب شده: <span id="selected-color-name">-</span></p>
            <div class="quantity-controls">
                <button class="quantity-btn-universal" id="decrease-universal-btn">-</button>
                <span id="universal-quantity-value">0</span>
                <button class="quantity-btn-universal" id="increase-universal-btn">+</button>
            </div>
        `;
        modalContent.insertBefore(universalSelector, document.getElementById('color-info'));

        document.getElementById('decrease-universal-btn').addEventListener('click', () => adjustUniversalQuantity(-1));
        document.getElementById('increase-universal-btn').addEventListener('click', () => adjustUniversalQuantity(1));
    }

    elements.colorModal.style.display = 'block';
    updateUIForSelectedColor();
}

export function closeColorModal() {
    elements.colorModal.style.display = 'none';
}

function selectColor(index) {
    activeColorIndex = index;
    updateUIForSelectedColor();
}

export function adjustUniversalQuantity(delta) {
    if (activeColorIndex === null) return;

    const colorEntry = selectedColors[activeColorIndex];
    const newQuantity = Math.max(0, colorEntry.quantity + delta);
    colorEntry.quantity = newQuantity;
    
    updateUIForSelectedColor();
}

function updateUIForSelectedColor() {
    const universalQuantityValue = document.getElementById('universal-quantity-value');
    const selectedColorName = document.getElementById('selected-color-name');
    
    if (activeColorIndex !== null) {
        const color = currentModalColors[activeColorIndex];
        const quantity = selectedColors[activeColorIndex].quantity;
        
        universalQuantityValue.textContent = quantity;
        selectedColorName.textContent = color.name;
    } else {
        universalQuantityValue.textContent = '0';
        selectedColorName.textContent = '-';
    }

    document.querySelectorAll('.color-swatch-option').forEach((swatch, index) => {
        const quantity = selectedColors[index].quantity;
        let badge = swatch.querySelector('.color-badge');

        if (quantity > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'color-badge';
                swatch.appendChild(badge);
            }
            badge.textContent = quantity;
            swatch.classList.add('selected');
        } else {
            if (badge) {
                badge.remove();
            }
            swatch.classList.remove('selected');
        }

        if (index === activeColorIndex) {
            swatch.classList.add('active-view');
        } else {
            swatch.classList.remove('active-view');
        }
    });
}

export function confirmSelection(config) {
    if (!config) {
        config = window.appConfig;
    }
    
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
                        description: product.description,
                        color: hex,
                        colorName: color.name,
                        count: colorEntry.quantity,
                        price: product.price
                    };
                }
            }
        }
    });
    closeColorModal();
    updateCartUI();
    
    // --- شروع کد جدید ---
    // فعال کردن پرچم برای جلوگیری از ریست اسکرول پس از افزودن محصول
    window.preventScrollReset = true;
    // --- پایان کد جدید ---
    
    window.product.renderActiveStage();
}

export function changeCarouselSlide(delta) {
    currentCarouselIndex = (currentCarouselIndex + delta + currentModalColors.length) % currentModalColors.length;
    elements.carouselInner.style.transform = `translateX(-${currentCarouselIndex * 100}%)`;
    selectColor(currentCarouselIndex);
}

export function requestDeleteItem(key) {
    itemToDelete = key;
    // این بخش را حذف کنید
    // if (elements.editQuantityModal.style.display === 'block') {
    //     closeEditQuantityModal();
    // }
    elements.deleteModal.style.display = 'block';
}

export function closeDeleteModal(event) {
    if (event) event.stopPropagation();
    elements.deleteModal.style.display = 'none';
    itemToDelete = null;
}

export function confirmDelete(key) {
    // --- شروع کد اصلاح شده ---
    // بررسی دفاعی برای اطمینان از وجود کلید
    if (!key) {
        console.error('confirmDelete called without a valid key.');
        return;
    }
    // --- پایان کد اصلاح شده ---

    if (selectedItems[key]) {
        delete selectedItems[key];
        updateCartUI();
        if (window.product) {
            window.product.renderActiveStage();
            if (window.product.stages[window.product.currentStage] === 'stage-review') {
                window.ui.populateReviewTable();
            }
        }
    } else {
        console.warn(`Item with key "${key}" not found in selectedItems for deletion.`);
    }
}

export function populateReviewTable() {
    elements.reviewTbody.innerHTML = '';
    let totalPrice = 0;

    Object.keys(selectedItems).forEach(key => {
        const item = selectedItems[key];
        const priceNum = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
        const itemTotal = priceNum * item.count;
        totalPrice += itemTotal;

        const row = elements.reviewTbody.insertRow();
        
        // ایجاد سلول‌ها به روش استاندارد
        const cellProduct = row.insertCell();
        cellProduct.setAttribute('data-label', 'محصول');
        cellProduct.textContent = item.category;

        const cellModel = row.insertCell();
        cellModel.setAttribute('data-label', 'مدل');
        cellModel.textContent = item.description;

        const cellColor = row.insertCell();
        cellColor.setAttribute('data-label', 'رنگ');
        cellColor.className = 'color-cell';
        cellColor.innerHTML = `<span class="color-swatch" style="background-color: ${item.color}"></span> ${item.colorName}`;

        const cellCount = row.insertCell();
        cellCount.setAttribute('data-label', 'تعداد');
        cellCount.textContent = item.count;

        const cellAction = row.insertCell();
        cellAction.setAttribute('data-label', 'عملیات');
        cellAction.className = 'action-cell';

        // --- شروع کد اصلاح شده ---
        // ایجاد دکمه به صورت برنامه‌نویسی و اتصال رویداد به صورت امن
        const editButton = document.createElement('button');
        editButton.className = 'edit-btn';
        editButton.title = 'ویرایش';
        editButton.innerHTML = '<i class="fas fa-pencil-alt"></i>';
        
        // استفاده از addEventListener به جای onclick
        editButton.addEventListener('click', () => {
            window.ui.openEditQuantityModal(key);
        });
        
        cellAction.appendChild(editButton);
        // --- پایان کد اصلاح شده ---
    });

    document.getElementById('total-price').textContent = `${totalPrice.toLocaleString()} تومان`;
}

export function openEditQuantityModal(key) {
    currentEditKey = key;
    const item = selectedItems[key];
    if (!item) return;

    elements.editItemInfo.innerHTML = `ویرایش تعداد برای: ${item.category} - ${item.description} (${item.colorName})`;
    elements.editQuantityValue.textContent = item.count;

    elements.decreaseQuantityBtn.addEventListener('click', () => {
        window.cart.changeCount(currentEditKey, -1);
        if (selectedItems[currentEditKey]) {
            elements.editQuantityValue.textContent = selectedItems[currentEditKey].count;
            populateReviewTable();
        } else {
            closeEditQuantityModal();
        }
    });

    elements.increaseQuantityBtn.addEventListener('click', () => {
        window.cart.changeCount(currentEditKey, 1);
        if (selectedItems[currentEditKey]) {
            elements.editQuantityValue.textContent = selectedItems[currentEditKey].count;
            populateReviewTable();
        }
    });

    // --- اصلاح شده: استفاده از addEventListener ---
    elements.deleteItemBtn.addEventListener('click', () => {
        requestDeleteItem(key);
    });

    elements.editQuantityModal.style.display = 'block';
}

export function closeEditQuantityModal() {
    elements.editQuantityModal.style.display = 'none';
    currentEditKey = null;
}

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
    const swipeThreshold = 50;

    const handleTouchStart = (e) => {
        touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
    };

    const handleSwipeGesture = () => {
        const swipeDistance = touchEndX - touchStartX;
        if (swipeDistance > swipeThreshold) {
            changeCarouselSlide(-1);
        } else if (swipeDistance < -swipeThreshold) {
            changeCarouselSlide(1);
        }
    };

    elements.carouselContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    elements.carouselContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
}

function setupScrollTopBtn() {
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    if (!scrollTopBtn) {
        const btn = document.createElement('button');
        btn.id = 'scroll-top-btn';
        btn.className = 'scroll-top-btn';
        btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        btn.title = 'برگشت به بالا';
        document.body.appendChild(btn);
        // --- اصلاح شده: آپدیت متغیر ---
        scrollTopBtn = btn;
    }

    let isVisible = false;
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY > 200 && !isVisible) {
            scrollTopBtn.style.display = 'block';
            scrollTopBtn.classList.add('visible');
            isVisible = true;
        } else if (scrollY <= 200 && isVisible) {
            scrollTopBtn.classList.remove('visible');
            setTimeout(() => {
                scrollTopBtn.style.display = 'none';
            }, 300);
            isVisible = false;
        }
    });

    // --- اصلاح شده: استفاده از addEventListener ---
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

setupScrollTopBtn();

window.ui = {
    toggleSidebar,
    openColorModal,
    closeColorModal,
    adjustUniversalQuantity,
    confirmSelection,
    changeCarouselSlide,
    requestDeleteItem,
    closeDeleteModal,
    confirmDelete,
    openEditQuantityModal,
    closeEditQuantityModal
};
