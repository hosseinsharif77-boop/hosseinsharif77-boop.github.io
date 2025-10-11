import { updateCartBadge, updateSidebarSummary, updateTotalCount, updateSubmitButton } from './ui-components.js';

// State of the cart
export let selectedItems = {};

export function updateCartUI() {
    updateCartBadge();
    updateSidebarSummary();
    updateTotalCount();
    updateSubmitButton();
}

export function changeCount(key, delta, event = null, shouldUpdateUI = true) {
    if (event) event.stopPropagation();
    if (selectedItems[key]) {
        const newCount = selectedItems[key].count + delta;
        if (newCount < 1) {
            requestDeleteItem(key);
            return;
        } else if (newCount > 100) {
            alert("حداکثر تعداد مجاز ۱۰۰ است.");
        } else {
            selectedItems[key].count = newCount;
            if (shouldUpdateUI) {
                updateCartUI();
                window.ui.updateProductCardSelections();

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
    console.log(`Item ${key} deletion confirmed by UI.`);

}
