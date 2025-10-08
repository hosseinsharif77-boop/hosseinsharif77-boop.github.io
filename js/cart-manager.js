// js/cart-manager.js
import { updateCartBadge, updateSidebarSummary, updateTotalCount, updateSubmitButton } from './ui-components.js';

// State of the cart
export let selectedItems = {};

export function updateCartUI() {
    updateCartBadge();
    updateSidebarSummary();
    updateTotalCount();
    updateSubmitButton();
}

export function changeCount(key, delta, event) {
    if (event) event.stopPropagation();
    if (selectedItems[key]) {
        const newCount = selectedItems[key].count + delta;
        if (newCount < 1) {
            requestDeleteItem(key);
        } else if (newCount > 100) {
            alert("حداکثر تعداد مجاز ۱۰۰ است.");
        } else {
            selectedItems[key].count = newCount;
            updateCartUI();
        }
    }
}

export function requestDeleteItem(key) {
    // This function will be connected to the UI module
    window.ui.requestDeleteItem(key);
}

export function confirmDelete(key) {
    if (selectedItems[key]) {
        delete selectedItems[key];
        updateCartUI();
        // Re-render the active stage to reflect changes (e.g., remove 'selected' class)
        if(window.product) window.product.renderActiveStage();
    }
}
