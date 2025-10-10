import { updateHeaderHeight } from './utils.js';
import { 
    createProductStages, 
    startApp, 
    stages, 
    currentStage 
} from './product-manager.js';
import { toggleSidebar, setupCarouselSwipe } from './ui-components.js'; 
import { updateCartUI, changeCount, confirmDelete } from './cart-manager.js';
import config from './config.js'; 

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
        goToNextStage: () => window.product.goToNextProduct(), // اصلاح: goToNextProduct
        config: config
    };
    
    window.appConfig = config;
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    if (elements.startButton) {
        elements.startButton.addEventListener('click', startApp);
    } else {
        console.error('❌ Start button not found');
    }

    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', window.ui.toggleSidebar);
    }

    if (elements.floatingCartBtn) {
        elements.floatingCartBtn.addEventListener('click', window.ui.toggleSidebar);
        elements.floatingCartBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.ui.toggleSidebar();
            }
        });
    }

    const finalSubmitBtn = document.getElementById('final-submit-btn');
    if (finalSubmitBtn) {
        finalSubmitBtn.addEventListener('click', () => window.product.goToReviewStage());
    }


    const colorModalConfirmBtn = document.getElementById('color-modal-confirm-btn');
    if (colorModalConfirmBtn) {
        // فراخوانی ساده و تمیز. دیگر نیازی به پاس دادن آرگومان نیست.
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

    // --- شروع کد اصلاح شده ---
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            if (window.ui.itemToDelete) {
                window.ui.confirmDelete(window.ui.itemToDelete);
            }
        });
    }
    // --- پایان کد اصلاح شده ---

    const navReviewPreviousBtn = document.getElementById('nav-review-previous-btn');
    if (navReviewPreviousBtn) {
        navReviewPreviousBtn.addEventListener('click', () => window.product.goToPreviousStage());
    }

    const navReviewSubmitBtn = document.getElementById('nav-review-submit-btn');
    if (navReviewSubmitBtn) {
        navReviewSubmitBtn.addEventListener('click', () => window.order.submitOrder());
    }

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

// --- Keyboard Navigation ---
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

// --- Swipe Navigation for Main Content ---
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

// Expose cart functions to global scope if needed elsewhere
window.cart = {
    changeCount,
    confirmDelete
};

// Start the application
document.addEventListener('DOMContentLoaded', initializeApp);
