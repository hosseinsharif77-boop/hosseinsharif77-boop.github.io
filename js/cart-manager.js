import { updateCartBadge, updateSidebarSummary, updateTotalCount, updateSubmitButton } from './ui-components.js';

// State of the cart
export let selectedItems = {};

export function updateCartUI() {
    updateCartBadge();
    updateSidebarSummary();
    updateTotalCount();
    updateSubmitButton();
}

export function changeCount(key, delta, event = null) {
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
            if (window.product && window.product.stages[window.product.currentStage] === 'stage-review') {
                window.ui.populateReviewTable();
            }
        }
    } else {
        console.error(`❌ Item with key ${key} not found in selectedItems`);
    }
}

export function requestDeleteItem(key) {
    window.ui.requestDeleteItem(key);
}

export function confirmDelete(key) {
    if (selectedItems[key]) {
        delete selectedItems[key];
        updateCartUI();
        if (window.product) {
            window.product.renderActiveStage();
            if (window.product.stages[window.product.currentStage] === 'stage-review') {
                window.ui.populateReviewTable();
            }
        }
    }
}
