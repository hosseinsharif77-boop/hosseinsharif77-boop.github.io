// js/product-manager.js
import config from './config.js';
import { createElementWithClass } from './utils.js';
import { renderProductGrid, populateReviewTable, renderActiveStage, updateNavItems, showSkeletons } from './ui-components.js';

// --- State for Product Flow ---
const productKeys = Object.keys(config.products);
export const stages = ['stage-welcome', ...productKeys.map(key => `stage-${key}`), 'stage-review'];
export let currentStage = 0;
export let previousStage = 0;

export function createProductStages() {
    const mainContent = document.getElementById('main-content');
    productKeys.forEach(key => {
        const stage = createElementWithClass('section', 'stage product-stage');
        stage.id = `stage-${key}`;
        stage.innerHTML = `
            <h1>${config.products[key].name} خود را انتخاب کنید</h1>
            <p>روی مدل مورد نظر کلیک کرده و رنگ آن را انتخاب کنید</p>
            <div class="product-grid" id="${key}-options"></div>
            <p class="helper-text">برای انتخاب چندین محصول از یک نوع، کافیست دوباره روی مدل مورد نظر کلیک کنید.</p>
            <div class="stage-navigation">
                <button class="btn-nav" onclick="product.goToNextProduct()">محصول بعدی</button>
                <button class="btn-nav" onclick="product.goToReviewStage()">رفتن به بازبینی نهایی</button>
            </div>
        `;
        mainContent.insertBefore(stage, document.getElementById('stage-review'));
    });
}

export function startApp() {
    document.getElementById('start-button').style.display = 'none';
    document.getElementById('stage-toolbar').style.display = 'block';
    goToStage(productKeys[0]);
}

export function goToStage(productKey) {
    const stageId = `stage-${productKey}`;
    const stageIndex = stages.indexOf(stageId);
    if (stageIndex === -1) return;
    
    previousStage = currentStage;
    currentStage = stageIndex;
    
    renderActiveStage(stageId, productKeys, config);
    updateNavItems(productKey, productKeys, config);
    
    if (stageId !== 'stage-welcome' && stageId !== 'stage-review') {
        showSkeletons(productKey);
        setTimeout(() => renderProductGrid(productKey, config), 300);
    }
}

export function goToNextProduct() {
    const currentProductKey = stages[currentStage].split('-')[1];
    const currentIndex = productKeys.indexOf(currentProductKey);
    const nextIndex = (currentIndex + 1) % productKeys.length;
    goToStage(productKeys[nextIndex]);
}

// === این تابع جدید را اضافه کنید ===
export function goToPreviousProduct() {
    const currentProductKey = stages[currentStage].split('-')[1];
    const currentIndex = productKeys.indexOf(currentProductKey);
    // برای رفتن به عقب، از یک اندیس کمتر استفاده می‌کنیم
    const prevIndex = (currentIndex - 1 + productKeys.length) % productKeys.length;
    goToStage(productKeys[prevIndex]);
}

export function goToReviewStage() {
    // This check is now in the button's disabled state
    previousStage = currentStage;
    currentStage = stages.length - 1;
    populateReviewTable();
    renderActiveStage(stages[currentStage], productKeys, config);
}

export function goToPreviousStage() {
    currentStage = previousStage;
    renderActiveStage(stages[currentStage], productKeys, config);
}

export function editItem(key) {
    const [category] = key.split('-');
    goToStage(category);
}

// Helper to re-render active stage, used by cart-manager
export function renderActiveStageWrapper() {
    renderActiveStage(stages[currentStage], productKeys, config);
    if (stages[currentStage] !== 'stage-welcome' && stages[currentStage] !== 'stage-review') {
        const productKey = stages[currentStage].split('-')[1];
        renderProductGrid(productKey, config);
    }
}

// Expose product functions to global scope
window.product = {
    goToStage,
    goToNextProduct,
    goToPreviousProduct,
    goToReviewStage,
    goToPreviousStage,
    editItem,
    renderActiveStage: renderActiveStageWrapper
};
