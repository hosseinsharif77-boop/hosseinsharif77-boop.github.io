// js/order-manager.js
import { selectedItems } from './cart-manager.js';

const tg = window.Telegram?.WebApp || {};
if (tg.ready) { tg.ready(); tg.expand(); }

export function submitOrder() {
    if (Object.keys(selectedItems).length === 0) {
        if (tg.showAlert) {
            tg.showAlert("سبد شما خالی است.");
        } else {
            alert("سبد شما خالی است.");
        }
        return;
    }
    try {
        tg.sendData(JSON.stringify(selectedItems));
        tg.close();
    } catch (error) {
        console.error('Error sending data to Telegram:', error);
        if (tg.showAlert) {
            tg.showAlert("خطایی در ارسال سفارش رخ داد. لطفاً دوباره تلاش کنید.");
        } else {
            alert("خطایی در ارسال سفارش رخ داد. لطفاً دوباره تلاش کنید.");
        }
    }
}

// Expose order functions to global scope
window.order = {
    submitOrder
};
