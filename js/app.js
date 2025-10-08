// js/app.js
import { updateHeaderHeight } from './utils.js';
import { 
    createProductStages, 
    startApp, 
    stages,          // <-- stages را وارد کنید
    currentStage     // <-- currentStage را وارد کنید
} from './product-manager.js';
import { toggleSidebar, setupCarouselSwipe } from './ui-components.js'; 

import { updateCartUI } from './cart-manager.js';

// --- Global Elements ---
const elements = {
    floatingCartBtn: document.getElementById('floating-cart-btn'),
    sidebarCart: document.getElementById('sidebar-cart'),
    startButton: document.getElementById('start-button')
};

// --- App Initialization ---
function initializeApp() {
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    elements.startButton.addEventListener('click', startApp);
    
    createProductStages();
    setupEventListeners();
    setupKeyboardNavigation();
    setupSwipeGestures();
    setupCarouselSwipe(); 
    setupMainContentSwipe(); // <-- این خط را اضافه کنید


    
    updateCartUI();
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    elements.floatingCartBtn.onclick = toggleSidebar;
    elements.floatingCartBtn.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleSidebar();
        }
    };

    document.getElementById('confirm-delete-btn').onclick = window.ui.confirmDelete;
    
    window.onclick = (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.style.display = 'none';
        }
    };

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

// --- Keyboard Navigation ---
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.ui.closeColorModal();
            window.ui.closeDeleteModal();
            if (document.body.classList.contains('sidebar-open')) {
                toggleSidebar();
            }
        }
    });
}

// --- Swipe Navigation for Main Content ---
function setupMainContentSwipe() {
    let touchStartX = 0;
    const mainContent = document.getElementById('main-content');
    const swipeThreshold = 80; // حداقل فاصله برای تشخیص swipe (پیکسل)

    const handleTouchStart = (e) => {
        // فقط اگر روی خود محتوای اصلی لمس شده باشد، شروع کن
        if (e.target === mainContent || mainContent.contains(e.target)) {
            touchStartX = e.changedTouches[0].screenX;
        }
    };

    const handleTouchEnd = (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const swipeDistance = touchEndX - touchStartX;

        // اگر فاصله کشیدن انگشت به اندازه کافی بود
        if (Math.abs(swipeDistance) > swipeThreshold) {
            // === این بخش را اصلاح و ساده کرده‌ایم ===
            const currentStageId = stages[currentStage];
            const isProductStage = currentStageId.startsWith('stage-') && !['stage-welcome', 'stage-review'].includes(currentStageId);

            if (isProductStage) {
                if (swipeDistance > 0) {
                    // کشیدن به راست -> رفتن به محصول قبلی
                    window.product.goToPreviousProduct();
                } else {
                    // کشیدن به چپ -> رفتن به محصول بعدی
                    window.product.goToNextProduct();
                }
            }
            // === پایان بخش اصلاح شده ===
        }
    };

    // اضافه کردن شنونده‌های رویداد تاچ
    mainContent.addEventListener('touchstart', handleTouchStart, { passive: true });
    mainContent.addEventListener('touchend', handleTouchEnd, { passive: true });
}

// --- Swipe Gestures for Sidebar ---
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

// Expose cart functions to global scope for inline handlers
window.cart = {
    changeCount: (key, delta, event) => import('./cart-manager.js').then(module => module.changeCount(key, delta, event))
};

// Start the application
initializeApp();
