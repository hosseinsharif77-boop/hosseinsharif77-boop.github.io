// js/app.js

// ==========================================================================
// 1. Imports
// ==========================================================================
import { updateHeaderHeight } from './utils.js';
import { 
    createProductStages, 
    startApp, 
    stages, 
    currentStage 
} from './product-manager.js';
import { 
    toggleSidebar, 
    setupCarouselSwipe, 
    setSubmitButtonState,
    openEmptyCartModal,
    closeEmptyCartModal,
    openSubmitOrderModal,
    closeSubmitOrderModal,
    openOrderErrorModal,
    closeOrderErrorModal
} from './ui-components.js';
import { 
    updateCartUI, 
    changeCount, 
    confirmDelete, 
    selectedItems 
} from './cart-manager.js';
import { submitOrder } from './order-manager.js';
import config from './config.js'; 

// ==========================================================================
// 2. Global Elements
// ==========================================================================
const elements = {
    floatingCartBtn: document.getElementById('floating-cart-btn'),
    sidebarCart: document.getElementById('sidebar-cart'),
    startButton: document.getElementById('start-button')
};

// ==========================================================================
// 3. App Initialization
// ==========================================================================
function initializeApp() {
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    createProductStages();
    setupEventListeners();
    setupKeyboardNavigation();
    setupSwipeGestures();
    setupCarouselSwipe();
    setupMainContentSwipe();

    updateCartUI();
    
    // Expose necessary functions to the global scope for other scripts
    window.app = {
        goToPreviousStage: () => window.product.goToPreviousStage(),
        goToNextStage: () => window.product.goToNextProduct(),
        config: config
    };
    
    window.appConfig = config;
}

// ==========================================================================
// 4. Event Listeners Setup
// ==========================================================================
function setupEventListeners() {
    if (elements.startButton) {
        elements.startButton.addEventListener('click', startApp);
    } else {
        console.error('❌ Start button not found');
    }

    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', toggleSidebar);
    }

    if (elements.floatingCartBtn) {
        elements.floatingCartBtn.addEventListener('click', toggleSidebar);
        elements.floatingCartBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSidebar();
            }
        });
    }

    const finalSubmitBtn = document.getElementById('final-submit-btn');
    if (finalSubmitBtn) {
        finalSubmitBtn.addEventListener('click', () => window.product.goToReviewStage());
    }

    const colorModalConfirmBtn = document.getElementById('color-modal-confirm-btn');
    if (colorModalConfirmBtn) {
        colorModalConfirmBtn.addEventListener('click', () => {
            window.ui.confirmSelection();
        });
    }

    const colorModalCancelBtn = document.getElementById('color-modal-cancel-btn');
    if (colorModalCancelBtn) {
        colorModalCancelBtn.addEventListener('click', window.ui.closeColorModal);
    }

    const deleteModalCancelBtn = document.getElementById('delete-modal-cancel-btn');
    if (deleteModalCancelBtn) {
        deleteModalCancelBtn.addEventListener('click', window.ui.closeDeleteModal);
    }

    const editQuantityModalConfirmBtn = document.getElementById('edit-quantity-modal-confirm-btn');
    if (editQuantityModalConfirmBtn) {
        editQuantityModalConfirmBtn.addEventListener('click', window.ui.closeEditQuantityModal);
    }

    const editQuantityModalCancelBtn = document.getElementById('edit-quantity-modal-cancel-btn');
    if (editQuantityModalCancelBtn) {
        editQuantityModalCancelBtn.addEventListener('click', window.ui.closeEditQuantityModal);
    }

    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            if (window.ui.itemToDelete) {
                window.ui.confirmDelete(window.ui.itemToDelete);
            }
        });
    }

    const navReviewPreviousBtn = document.getElementById('nav-review-previous-btn');
    if (navReviewPreviousBtn) {
        navReviewPreviousBtn.addEventListener('click', () => window.product.goToPreviousStage());
    }

    // --- رویدادهای مربوط به ارسال سفارش ---
    const navReviewSubmitBtn = document.getElementById('nav-review-submit-btn');
    if (navReviewSubmitBtn) {
        // رویداد کلیک اصلی برای شروع فرآیند
        navReviewSubmitBtn.addEventListener('click', handleInitialSubmitClick);
    }

    // رویداد کلیک برای دکمه تایید در مودال
    const confirmSubmitBtn = document.getElementById('confirm-submit-order-btn');
    if (confirmSubmitBtn) {
        confirmSubmitBtn.addEventListener('click', handleFinalSubmit);
    }

    // رویداد کلیک برای دکمه انصراف
    const cancelSubmitBtn = document.getElementById('cancel-submit-order-btn');
    if (cancelSubmitBtn) {
        cancelSubmitBtn.addEventListener('click', closeSubmitOrderModal);
    }

    // رویداد کلیک برای دکمه "باشه" در مودال سبد خالی
    const emptyCartOkBtn = document.getElementById('empty-cart-modal-ok-btn');
    if (emptyCartOkBtn) {
        emptyCartOkBtn.addEventListener('click', closeEmptyCartModal);
    }

    // رویداد کلیک برای دکمه "تلاش مجدد" در مودال خطا
    const retryOrderBtn = document.getElementById('retry-order-btn');
    if (retryOrderBtn) {
        retryOrderBtn.addEventListener('click', handleFinalSubmit);
    }
    // --- پایان رویدادهای ارسال سفارش ---

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (
            document.body.classList.contains('sidebar-open') &&
            !elements.sidebarCart.contains(e.target) &&
            !elements.floatingCartBtn.contains(e.target) &&
            !e.target.closest('.modal-overlay') &&
            !e.target.closest('.quantity-btn') &&
            !e.target.closest('.remove-item-btn')
        ) {
            toggleSidebar();
        }
    });
}

// ==========================================================================
// 5. Order Submission Handler Functions
// ==========================================================================

/**
 * مدیریت اولین کلیک روی دکمه ارسال سفارش.
 * بررسی می‌کند که آیا سبد خرید خالی است یا خیر و مودال مناسب را نمایش می‌دهد.
 */
function handleInitialSubmitClick() {
    const submitButton = document.getElementById('nav-review-submit-btn');
    if (!submitButton) return;

    // 1. محاسبه مجموع قیمت
    let totalPrice = 0;
    Object.values(selectedItems).forEach(item => {
        const priceNum = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
        totalPrice += priceNum * item.count;
    });

    // 2. بررسی خالی بودن سبد خرید
    if (totalPrice === 0) {
        openEmptyCartModal();
        return;
    }

    // 3. اگر سبد خالی نبود، مودال تایید را نمایش بده
    window.ui.openSubmitOrderModal(); // <-- اصلاح شده
}

/**
 * مدیریت نهایی ارسال سفارش پس از تایید کاربر در مودال.
 * وضعیت دکمه را مدیریت کرده و تابع ارسال از order-manager را فراخوانی می‌کند.
 */
function handleFinalSubmit() {
    const submitButton = document.getElementById('nav-review-submit-btn');
    if (!submitButton) return;

    // تعریف توابع callback برای موفقیت و خطا
    const onSuccess = () => {
        setSubmitButtonState(submitButton, 'success');
        closeSubmitOrderModal();
    };

    const onError = () => {
        setSubmitButtonState(submitButton, 'error');
        window.ui.closeSubmitOrderModal();
        window.ui.openOrderErrorModal();
    };

    // فراخوانی تابع submitOrder از order-manager.js
    submitOrder(submitButton, onSuccess, onError);
}

// ==========================================================================
// 6. Other Functions (Unchanged)
// ==========================================================================
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.ui.closeColorModal();
            window.ui.closeDeleteModal();
            window.ui.closeEditQuantityModal();
            if (document.body.classList.contains('sidebar-open')) {
                toggleSidebar();
            }
        }
    });
}

function setupMainContentSwipe() {
    let touchStartX = 0;
    const mainContent = document.getElementById('main-content');
    const swipeThreshold = 80;

    const handleTouchStart = (e) => {
        if (e.target === mainContent || mainContent.contains(e.target)) {
            touchStartX = e.changedTouches[0].screenX;
        }
    };

    const handleTouchEnd = (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const swipeDistance = touchEndX - touchStartX;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            const currentStageId = stages[currentStage];
            const isProductStage = currentStageId.startsWith('stage-') && !['stage-welcome', 'stage-review'].includes(currentStageId);

            if (isProductStage) {
                if (swipeDistance > 0) {
                    window.product.goToPreviousProduct();
                } else {
                    window.product.goToNextProduct();
                }
            }
        }
    };

    mainContent.addEventListener('touchstart', handleTouchStart, { passive: true });
    mainContent.addEventListener('touchend', handleTouchEnd, { passive: true });
}

function setupSwipeGestures() {
    if (!('ontouchstart' in window)) return;

    let touchStartX = 0;
    let isDragging = false;

    elements.sidebarCart.addEventListener('touchstart', handleTouchStart, { passive: false });
    elements.sidebarCart.addEventListener('touchmove', handleTouchMove, { passive: false });
    elements.sidebarCart.addEventListener('touchend', handleTouchEnd);
    elements.sidebarCart.addEventListener('touchcancel', handleTouchEnd);

    function handleTouchStart(e) {
        if (!document.body.classList.contains('sidebar-open')) return;
        if (e.target.closest('button, a, input, .summary-item-controls, .sidebar-footer')) return;

        isDragging = true;
        touchStartX = e.touches[0].clientX;
        elements.sidebarCart.classList.add('is-dragging');
    }

    function handleTouchMove(e) {
        if (!isDragging) return;

        const currentX = e.touches[0].clientX;
        const swipeDistance = currentX - touchStartX;

        if (swipeDistance > 0) {
            e.preventDefault();
            elements.sidebarCart.style.transform = `translateX(${swipeDistance}px)`;
        }
    }

    function handleTouchEnd() {
        if (!isDragging) return;
        isDragging = false;

        elements.sidebarCart.classList.remove('is-dragging');
        const finalSwipeDistance = parseInt(elements.sidebarCart.style.transform.replace('translateX(', '').replace('px)', '') || 0);
        const closeThreshold = 100;

        if (finalSwipeDistance > closeThreshold) {
            toggleSidebar();
        } else {
            elements.sidebarCart.style.transform = 'translateX(0)';
        }

        setTimeout(() => {
            if (!document.body.classList.contains('sidebar-open')) {
                elements.sidebarCart.style.transform = '';
            }
        }, 400);
    }
}

// Expose cart functions to global scope if needed elsewhere
window.cart = {
    changeCount,
    confirmDelete
};

// ==========================================================================
// 7. Start the application
// ==========================================================================
document.addEventListener('DOMContentLoaded', initializeApp);
