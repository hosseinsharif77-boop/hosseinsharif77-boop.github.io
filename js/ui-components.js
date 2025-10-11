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
    deleteItemBtn: document.getElementById('delete-item-btn'),
    emptyCartModal: document.getElementById('empty-cart-modal'),
    submitOrderModal: document.getElementById('submit-order-modal'),
    orderErrorModal: document.getElementById('order-error-modal'),
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
            setTimeout(() => {
                renderReviewCards();
            }, 0);
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
        // 1. متغیر itemKey باید در ابتدای حلقه تعریف شود
        const itemKey = `${productKey}-${item.id}`;

        const card = createElementWithClass('div', 'product-card');
        card.tabIndex = 0;

        // 2. از itemKey برای تنظیم ویژگی استفاده کنید
        card.setAttribute('data-product-key', itemKey);
        console.log(`[DEBUG] renderProductGrid: Setting data-product-key="${itemKey}" for card.`);

        // این بخش از کد نیز باید از itemKey استفاده کند
        const isSelected = Object.keys(selectedItems).some(key => key.startsWith(itemKey));
        if (isSelected) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }

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
    // این خط اضافه می‌شود تا اسلایدر حرکت کند
    elements.carouselInner.style.transform = `translateX(-${index * 100}%)`;
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

export function confirmSelection() {
    if (!config || !config.products) {
        console.error("Config object is missing or malformed in confirmSelection.", config);
        alert("خطا در پردازش سفارش. لطفاً دوباره تلاش کنید.");
        return;
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
                        // *** تغییر مهم: اضافه کردن categoryKey برای پیدا کردن صحیح در config ***
                        categoryKey: category, // کلید انگلیسی مثل 'tray'
                        category: config.products[category].name, // نام فارسی مثل 'سینی'
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
    
    window.preventScrollReset = true;
    window.product.renderActiveStage();
}


export function changeCarouselSlide(delta) {
    currentCarouselIndex = (currentCarouselIndex + delta + currentModalColors.length) % currentModalColors.length;
    elements.carouselInner.style.transform = `translateX(-${currentCarouselIndex * 100}%)`;
    selectColor(currentCarouselIndex);
}

export function requestDeleteItem(key) {
    // --- شروع تغییر ---
    // ذخیره کلید در شیء عمومی window.ui تا از همه جا قابل دسترسی باشد
    window.ui.itemToDelete = key; 
    // --- پایان تغییر ---
    elements.deleteModal.style.display = 'block';
}

export function closeDeleteModal(event) {
    if (event) event.stopPropagation();
    elements.deleteModal.style.display = 'none';
    // --- شروع تغییر ---
    // پاک کردن کلید پس از بستن مودال
    window.ui.itemToDelete = null; 
    // --- پایان تغییر ---
}


export function openEmptyCartModal() {
    elements.emptyCartModal.style.display = 'block';
}

export function closeEmptyCartModal() {
    elements.emptyCartModal.style.display = 'none';
}

// --- توابع مودال تایید سفارش ---
export function openSubmitOrderModal() {
    elements.submitOrderModal.style.display = 'block';
}

export function closeSubmitOrderModal() {
    elements.submitOrderModal.style.display = 'none';
}

// --- توابع مودال خطا ---
export function openOrderErrorModal() {
    elements.orderErrorModal.style.display = 'block';
}

export function closeOrderErrorModal() {
    elements.orderErrorModal.style.display = 'none';
}

// --- تابع مدیریت وضعیت دکمه ---
export function setSubmitButtonState(button, state) {
    if (!button) return;

    button.classList.remove('btn-primary', 'btn-success', 'btn-error');
    button.disabled = false;

    switch (state) {
        case 'loading':
            button.disabled = true;
            button.textContent = 'در حال ارسال...';
            button.classList.add('btn-primary');
            break;
        case 'success':
            button.textContent = 'ارسال شد';
            button.classList.add('btn-success');
            break;
        case 'error':
            button.textContent = 'خطا در ارسال';
            button.classList.add('btn-error');
            setTimeout(() => setSubmitButtonState(button, 'reset'), 3000);
            break;
        case 'reset':
        default:
            button.textContent = 'ارسال سفارش';
            button.classList.add('btn-primary');
            break;
    }
}

export function updateProductCardSelections() {
    console.log("[DEBUG] updateProductCardSelections: Updating all product cards.");

    // پیدا کردن تمام کارت‌های محصول در صفحه
    const allProductCards = document.querySelectorAll('.product-card');
    
    allProductCards.forEach(card => {
        // گرفتن کلید محصول از ویژگی data
        const productKey = card.getAttribute('data-product-key');
        if (!productKey) {
            console.warn("[DEBUG] updateProductCardSelections: Found a card without data-product-key.", card);
            return; // از این کارت عبور کن
        }

        // بررسی اینکه آیا آیتمی از این محصول در سبد وجود دارد
        const hasSelectedItem = Object.keys(selectedItems).some(key => key.startsWith(`${productKey}-`));
        
        console.log(`[DEBUG] updateProductCardSelections: Card for ${productKey} has selected item: ${hasSelectedItem}`);

        // اگر آیتمی وجود داشت، کلاس selected را اضافه کن، در غیر این صورت آن را حذف کن
        if (hasSelectedItem) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
}

export function confirmDelete(key) {
    console.log(`[DEBUG] confirmDelete called with key: ${key}`);

    if (!key) {
        console.error('confirmDelete called without a valid key.');
        return;
    }

    if (selectedItems[key]) {
        delete selectedItems[key];
        console.log(`[DEBUG] Item deleted from selectedItems.`);
        console.log(`[DEBUG] Remaining selectedItems keys:`, Object.keys(selectedItems));

        updateCartUI();

        updateProductCardSelections();


        // مدیریت مودال ویرایش و بازبینی (کدهای قبلی بدون تغییر باقی می‌ماند)
        const editModal = document.getElementById('edit-product-modal');
        if (editModal && editModal.style.display === 'block') {
            const cardToDelete = document.querySelector(`.edit-color-card .delete-btn[data-key="${key}"]`)?.closest('.edit-color-card');
            if (cardToDelete) {
                cardToDelete.remove();
            }
            const modalContent = document.getElementById('edit-product-content');
            if (modalContent && modalContent.children.length === 0) {
                closeEditProductModal();
            }
        }
        renderReviewCards();
    } else {
        console.warn(`Item with key "${key}" not found in selectedItems for deletion.`);
    }

    // بستن مودال تایید حذف
    elements.deleteModal.style.display = 'none';
    window.ui.itemToDelete = null;
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

        // اضافه کردن سلول قیمت تک محصول
        const cellPrice = row.insertCell();
        cellPrice.setAttribute('data-label', 'قیمت');
        cellPrice.className = 'price-cell';
        cellPrice.innerHTML = `${parseInt(item.price).toLocaleString()} تومان`;

        // اضافه کردن سلول مجموع قیمت
        const cellTotal = row.insertCell();
        cellTotal.setAttribute('data-label', 'مجموع');
        cellTotal.className = 'total-cell';
        cellTotal.innerHTML = `${itemTotal.toLocaleString()} تومان`;

        const cellAction = row.insertCell();
        cellAction.setAttribute('data-label', 'عملیات');
        cellAction.className = 'action-cell';

        // ایجاد دکمه ویرایش
        const editButton = document.createElement('button');
        editButton.className = 'edit-btn';
        editButton.title = 'ویرایش';
        editButton.innerHTML = '<i class="fas fa-pencil-alt"></i>';
        
        editButton.addEventListener('click', () => {
            window.ui.openEditQuantityModal(key);
        });
        
        cellAction.appendChild(editButton);
    });

    document.getElementById('total-price').textContent = `${totalPrice.toLocaleString()} تومان`;
}

export function renderReviewCards() {
    const reviewContainer = document.getElementById('review-cards-container');
    if (!reviewContainer) {
        console.error("Review container with id 'review-cards-container' not found!");
        return;
    }
    
    reviewContainer.innerHTML = '';
    let grandTotalPrice = 0;

    const groupedItems = {};
    Object.keys(selectedItems).forEach(key => {
        const item = selectedItems[key];
        const groupKey = `${item.categoryKey}-${item.description}`;
        
        if (!groupedItems[groupKey]) {
            groupedItems[groupKey] = {
                category: item.category,
                categoryKey: item.categoryKey,
                description: item.description,
                colors: [],
                totalCount: 0,
                groupTotalPrice: 0,
                modelId: item.model
            };
        }
        
        const priceNum = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
        const itemTotal = priceNum * item.count;
        
        groupedItems[groupKey].colors.push({
            hex: item.color,
            name: item.colorName,
            count: item.count,
            unitPrice: priceNum,
            key: key
        });
        
        groupedItems[groupKey].totalCount += item.count;
        groupedItems[groupKey].groupTotalPrice += itemTotal;
        grandTotalPrice += itemTotal;
    });

    Object.values(groupedItems).forEach(group => {
        const card = createElementWithClass('div', 'review-item-card');
        
        let colorsHtml = '';
        group.colors.forEach(color => {
            colorsHtml += `
                <div class="review-color-swatch" title="${color.name}">
                    <span class="color-dot" style="background-color: ${color.hex}"></span>
                    <span class="color-count">${color.count}</span>
                </div>
            `;
        });
        
        // --- شروع کد جدید: ساختار HTML جدولی و فشرده ---
        card.innerHTML = `
            <div class="item-main-info">
                <div class="item-details">
                    <h4>${group.description}</h4>
                    <p class="review-category">${group.category}</p>
                </div>
                <div class="review-item-colors">
                    ${colorsHtml}
                </div>
            </div>
            <div class="item-side-info">
                <span class="review-total-count">${group.totalCount} عدد</span>
                <span class="review-item-price">${group.groupTotalPrice.toLocaleString()} تومان</span>
                <button class="edit-btn" title="ویرایش این محصول">
                    <i class="fas fa-pencil-alt"></i>
                </button>
            </div>
        `;
        // --- پایان کد جدید ---
        
        const editBtn = card.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => {
            openEditProductModal(group);
        });
        
        reviewContainer.appendChild(card);
    });

    const totalPriceElement = document.getElementById('total-price');
    if (totalPriceElement) {
        totalPriceElement.textContent = `${grandTotalPrice.toLocaleString()} تومان`;
    }
}

// تابع جدید برای باز کردن مودال ویرایش محصول
export function openEditProductModal(group) {
    const editModal = document.getElementById('edit-product-modal');
    if (!editModal) return;
    
    const modalTitle = document.getElementById('edit-product-title');
    modalTitle.textContent = `ویرایش ${group.description}`;
    
    const modalBody = editModal.querySelector('.modal-body');
    const modalContent = document.getElementById('edit-product-content');
    
    modalContent.innerHTML = ''; // پاک کردن محتوای قبلی رنگ‌ها
    
    const product = config.products[group.categoryKey]?.items.find(item => item.id === group.modelId);

    group.colors.forEach(color => {
        const colorCard = createElementWithClass('div', 'edit-color-card');
        
        const colorImage = product?.imagesByColor[color.hex] || 'https://picsum.photos/seed/fallback/150/150';
        
        colorCard.innerHTML = `
            <div class="edit-color-image">
                <img src="${colorImage}" alt="${color.name}">
            </div>
            <div class="edit-color-info">
                <h5>${color.name}</h5>
                <div class="edit-color-controls">
                    <button class="quantity-btn decrease" data-key="${color.key}">-</button>
                    <span class="quantity-value">${color.count}</span>
                    <button class="quantity-btn increase" data-key="${color.key}">+</button>
                    <button class="delete-btn" data-key="${color.key}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        const decreaseBtn = colorCard.querySelector('.decrease');
        const increaseBtn = colorCard.querySelector('.increase');
        const deleteBtn = colorCard.querySelector('.delete-btn');
        const quantityValueSpan = colorCard.querySelector('.quantity-value');

        decreaseBtn.addEventListener('click', () => {
            const key = decreaseBtn.dataset.key;
            if (selectedItems[key] && selectedItems[key].count > 1) {
                changeCount(key, -1, null, false); 
                quantityValueSpan.textContent = selectedItems[key].count;
            } else {
                requestDeleteItem(key);
            }
        });
        
        increaseBtn.addEventListener('click', () => {
            const key = increaseBtn.dataset.key;
            changeCount(key, 1, null, false);
            quantityValueSpan.textContent = selectedItems[key].count;
        });
        
        deleteBtn.addEventListener('click', () => {
            const key = deleteBtn.dataset.key;
            requestDeleteItem(key);
        });
        
        modalContent.appendChild(colorCard);
    });

    // --- شروع کد جدید: اضافه کردن دکمه‌ها به انتهای modal-body ---
    
    // ابتدا هرگونه دکمه قدیمی را حذف می‌کنیم تا از تکرار جلوگیری شود
    const existingActions = modalBody.querySelector('.modal-actions');
    if (existingActions) {
        existingActions.remove();
    }

    // ایجاد کانتینر برای دکمه‌ها
    const actionsContainer = createElementWithClass('div', 'modal-actions');
    actionsContainer.innerHTML = `
        <button class="btn-secondary" id="edit-modal-cancel-btn">انصراف</button>
        <button class="btn-primary" id="edit-modal-save-btn">تایید تغییرات</button>
    `;
    
    // اضافه کردن کانتینر دکمه‌ها به انتهای modal-body
    modalBody.appendChild(actionsContainer);

    // اضافه کردن رویداد کلیک به دکمه تایید
    document.getElementById('edit-modal-save-btn').addEventListener('click', () => {
        closeEditProductModal();
    });

    // اضافه کردن رویداد کلیک به دکمه انصراف
    document.getElementById('edit-modal-cancel-btn').addEventListener('click', () => {
        closeEditProductModal();
    });
    
    // --- پایان کد جدید ---
    
    editModal.style.display = 'block';
}


export function closeEditProductModal() {
    const editModal = document.getElementById('edit-product-modal');
    if (editModal) {
        editModal.style.display = 'none';
    }
    renderReviewCards(); 
    updateCartUI();
    
    // --- شروع تغییر ---
    // پس از بستن مودال ویرایش، وضعیت کارت‌ها را آپدیت کن
    updateProductCardSelections();
    // --- پایان تغییر ---
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

document.addEventListener('DOMContentLoaded', () => {
    const closeEditProductModalBtn = document.getElementById('close-edit-product-modal-btn');
    if (closeEditProductModalBtn) {
        closeEditProductModalBtn.addEventListener('click', () => {
            window.ui.closeEditProductModal();
        });
    }
    
    // اضافه کردن رویداد کلیک به پس‌زمینه مودال برای بستن آن
    const editProductModal = document.getElementById('edit-product-modal');
    if (editProductModal) {
        editProductModal.addEventListener('click', (e) => {
            if (e.target === editProductModal) {
                window.ui.closeEditProductModal();
            }
        });
    }
});

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
    closeEditQuantityModal,
    openEditProductModal,
    closeEditProductModal,
    updateProductCardSelections,  // Add this line
    setSubmitButtonState, // <-- این را اضافه کنید


};
