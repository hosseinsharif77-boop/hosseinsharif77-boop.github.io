// js/order-manager.js

import { selectedItems } from './cart-manager.js';

const tg = window.Telegram?.WebApp || {};
if (tg.ready) {
    tg.ready();
    tg.expand();
}

/**
 * تابع اصلی برای ارسال سفارش به تلگرام
 * @param {HTMLButtonElement} button - دکمه ارسال سفارش برای تغییر وضعیت آن
 * @param {Function} onSuccess - تابعی که در صورت موفقیت اجرا می‌شود
 * @param {Function} onError - تابعی که در صورت خطا اجرا می‌شود
 */
export function submitOrder(button, onSuccess, onError) {
    // این تابع دیگر سبد خالی را چک نمی‌کند، چون قبل از فراخوانی آن چک شده است.

    // 1. تنظیم وضعیت دکمه به "در حال بارگذاری"
    setButtonState(button, 'loading');

    try {
        // ارسال داده‌ها به تلگرام
        tg.sendData(JSON.stringify(selectedItems));

        // از آنجایی که tg.sendData پاسخی برنمی‌گرداند، موفقیت را بلافاصله فرض می‌کنیم
        // و تابع onSuccess را فراخوانی می‌کنیم.
        onSuccess();

    } catch (error) {
        console.error('Error sending data to Telegram:', error);
        // در صورت بروز خطا، تابع onError را فراخوانی می‌کنیم
        onError();
    }
}

/**
 * تابع کمکی برای مدیریت وضعیت دکمه ارسال
 * @param {HTMLButtonElement} button 
 * @param {'loading' | 'success' | 'error' | 'reset'} state 
 */
function setButtonState(button, state) {
    if (!button) return;

    // حذف تمام کلاس‌های حالت قبلی
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
            // بستن اپلیکیشن تلگرام پس از موفقیت
            if (tg.close) {
                tg.close();
            }
            break;
        case 'error':
            button.textContent = 'خطا در ارسال';
            button.classList.add('btn-error');
            // بعد از ۳ ثانیه، دکمه به حالت اولیه برمی‌گردد تا کاربر بتواند دوباره تلاش کند
            setTimeout(() => setButtonState(button, 'reset'), 3000);
            break;
        case 'reset':
        default:
            button.textContent = 'ارسال سفارش';
            button.classList.add('btn-primary');
            break;
    }
}

// Expose order functions to global scope
window.order = {
    submitOrder
};
