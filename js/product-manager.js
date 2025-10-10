import config from './config.js';
import { createElementWithClass } from './utils.js';
import { renderProductGrid, populateReviewTable, renderActiveStage, updateNavItems, showSkeletons } from './ui-components.js';

// --- State for Product Flow ---
const productKeys = Object.keys(config.products);
export const stages = ['stage-welcome', ...productKeys.map(key => `stage-${key}`), 'stage-review'];
export let currentStage = 0;
export let previousStage = 0;

export function createProductStages() {
    console.log('🔧 Creating product stages for keys:', productKeys);
    const mainContent = document.getElementById('main-content');
    
    productKeys.forEach(key => {
        console.log(`📦 Creating stage for product: ${key}`);
        const stage = createElementWithClass('section', 'stage product-stage');
        stage.id = `stage-${key}`;
        stage.innerHTML = `
            <div class="stage-content">
                <h1>${config.products[key].name} خود را انتخاب کنید</h1>
                <p>روی مدل مورد نظر کلیک کرده و رنگ آن را انتخاب کنید</p>
                <div class="product-grid" id="${key}-options"></div>
                <p class="helper-text">برای انتخاب چندین محصول از یک نوع، کافیست دوباره روی مدل مورد نظر کلیک کنید.</p>
            </div>
        `;
        mainContent.insertBefore(stage, document.getElementById('stage-review'));
    });
    
    createNavigationElements();
}

export function createNavigationElements() {
    console.log('🔧 Creating all navigation elements in a fixed container');
    const navContainer = document.getElementById('navigation-container');
    if (!navContainer) {
        console.error('❌ Navigation container not found!');
        return;
    }
    navContainer.innerHTML = '';

    productKeys.forEach(key => {
        const navElement = createElementWithClass('div', 'stage-navigation');
        navElement.id = `nav-${key}`;
        navElement.innerHTML = `
            <button class="btn-nav btn-previous"><i class="fas fa-arrow-right"></i></button>
            <button class="btn-nav btn-review">بازبینی نهایی</button>
            <button class="btn-nav btn-next"><i class="fas fa-arrow-left"></i></button>
        `;
        navContainer.appendChild(navElement);

        const previousBtn = navElement.querySelector('.btn-previous');
        const reviewBtn = navElement.querySelector('.btn-review');
        const nextBtn = navElement.querySelector('.btn-next');

        if (previousBtn) previousBtn.addEventListener('click', () => window.product.goToPreviousProduct());
        if (reviewBtn) reviewBtn.addEventListener('click', () => window.product.goToReviewStage());
        if (nextBtn) nextBtn.addEventListener('click', () => window.product.goToNextProduct());
    });

    const reviewNav = document.getElementById('nav-review');
    if (reviewNav && reviewNav.parentNode !== navContainer) {
        navContainer.appendChild(reviewNav);
    }
}

export function startApp() {
    console.log('🚀 Starting app');
    document.getElementById('start-button').style.display = 'none';
    document.getElementById('stage-toolbar').style.display = 'block';
    
    window.Telegram.WebApp.onEvent('themeChanged', () => {
        const navElements = document.querySelectorAll('.stage-navigation');
        navElements.forEach(nav => {
            nav.style.backgroundColor = window.Telegram.WebApp.themeParams.bg_color || 'rgb(255 255 255 / 15%)';
        });
    });
    
    document.querySelectorAll('.stage-navigation').forEach(nav => {
        nav.classList.remove('active');
    });
    
    setTimeout(() => {
        goToStage(productKeys[0]);
    }, 200);
}

export function goToStage(productKey) {
    console.log(`➡️ [${new Date().toLocaleTimeString('fa-IR')}] Going to stage: ${productKey}`);
    
    const key = productKey.startsWith('stage-') ? productKey.substring(6) : productKey;
    const stageId = `stage-${key}`;
    const stageIndex = stages.indexOf(stageId);
    
    if (stageIndex === -1) {
        console.error(`❌ [${new Date().toLocaleTimeString('fa-IR')}] Stage not found: ${stageId}`);
        return;
    }
    
    previousStage = currentStage;
    currentStage = stageIndex;
    
    renderActiveStage(stageId, productKeys, config);
    updateNavItems(key, productKeys, config);

    const navContainer = document.getElementById('navigation-container');
    if (!navContainer) {
        console.error('❌ Navigation container not found!');
        return;
    }

    const allNavElements = navContainer.querySelectorAll('.stage-navigation');
    allNavElements.forEach(nav => nav.classList.remove('active'));

    let targetNavId;
    if (stageId === 'stage-welcome') {
        return;
    } else if (stageId === 'stage-review') {
        targetNavId = 'nav-review';
    } else {
        targetNavId = `nav-${key}`;
    }

    const targetNav = document.getElementById(targetNavId);
    if (targetNav) {
        setTimeout(() => {
            targetNav.classList.add('active');
        }, 20);
    } else {
        console.error(`❌ Navigation element not found: ${targetNavId}`);
    }

    const optionsDiv = document.getElementById(`${key}-options`);
    if (stageId !== 'stage-welcome' && stageId !== 'stage-review' && !optionsDiv?.dataset.loaded) {
        showSkeletons(key);
        renderProductGrid(key, config);
        if (optionsDiv) optionsDiv.dataset.loaded = 'true';
    }
    
    if (!window.preventScrollReset) {
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 0);
    } else {
        window.preventScrollReset = false;
    }
}

export function goToNextProduct() {
    console.log(`⏭️ [${new Date().toLocaleTimeString('fa-IR')}] Going to next product`);
    const currentProductKey = stages[currentStage].split('-')[1];
    const currentIndex = productKeys.indexOf(currentProductKey);
    const nextIndex = (currentIndex + 1) % productKeys.length;
    console.log(`Current: ${currentProductKey} (${currentIndex}), Next: ${productKeys[nextIndex]} (${nextIndex})`);
    
    window.preventScrollReset = false;
    goToStage(productKeys[nextIndex]);
}

export function goToPreviousProduct() {
    console.log(`⏮️ [${new Date().toLocaleTimeString('fa-IR')}] Going to previous product`);
    const currentProductKey = stages[currentStage].split('-')[1];
    const currentIndex = productKeys.indexOf(currentProductKey);
    const prevIndex = (currentIndex - 1 + productKeys.length) % productKeys.length;
    console.log(`Current: ${currentProductKey} (${currentIndex}), Previous: ${productKeys[prevIndex]} (${prevIndex})`);
    
    window.preventScrollReset = false;
    goToStage(productKeys[prevIndex]);
}

export function goToReviewStage() {
    console.log(`📋 [${new Date().toLocaleTimeString('fa-IR')}] Going to review stage`);
    
    if (document.body.classList.contains('sidebar-open')) {
        window.ui.toggleSidebar();
    }
    
    goToStage('stage-review');
}

// --- شروع کد اصلاح شده ---
export function goToPreviousStage() {
    console.log('⬅️ Going to previous stage, currentStage:', stages[currentStage], 'previousStage:', stages[previousStage]);
    
    if (stages[currentStage] === 'stage-review') {
        const previousStageId = stages[previousStage];
        if (previousStageId && previousStageId.startsWith('stage-') && previousStageId !== 'stage-welcome') {
            const productKey = previousStageId.split('-')[1];
            console.log(`✅ Navigating back to product stage: ${productKey}`);
            goToStage(productKey);
        } else {
            if (productKeys.length > 0) {
                console.log(`✅ Fallback: Navigating to first product stage: ${productKeys[0]}`);
                goToStage(productKeys[0]);
            } else {
                console.error('❌ No product keys found for fallback navigation.');
            }
        }
    } else {
        currentStage = previousStage;
        console.log(`✅ Navigating to stage: ${stages[currentStage]}`);
        renderActiveStage(stages[currentStage], productKeys, config);
        
        if (currentStage > 0 && currentStage < stages.length - 1) {
            const productKey = stages[currentStage].split('-')[1];
            console.log(`Returning to product stage: ${productKey}`);
            
            document.querySelectorAll('.stage-navigation').forEach(nav => {
                nav.classList.remove('active');
            });
            
            const currentNav = document.getElementById(`nav-${productKey}`);
            if (currentNav) {
                currentNav.classList.add('active');
                console.log(`✅ Showing navigation for: ${productKey}`);
            } else {
                console.error(`❌ Navigation not found for: ${productKey}`);
            }
        }
    }
}
// --- پایان کد اصلاح شده ---


export function editItem(key) {
    console.log(`✏️ Editing item: ${key}`);
    const [category, id, hex] = key.split('-');
    goToStage(category);
    setTimeout(() => {
        window.ui.openColorModal(category, parseInt(id), config);
    }, 300);
}

export function renderActiveStageWrapper() {
    console.log('🔄 Rendering active stage wrapper');
    renderActiveStage(stages[currentStage], productKeys, config);
    if (stages[currentStage] !== 'stage-welcome' && stages[currentStage] !== 'stage-review') {
        const productKey = stages[currentStage].split('-')[1];
        renderProductGrid(productKey, config);
    }
    
    if (!window.preventScrollReset) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        window.preventScrollReset = false;
    }
}

window.product = {
    goToStage,
    goToNextProduct,
    goToPreviousProduct,
    goToReviewStage,
    goToPreviousStage,
    editItem,
    renderActiveStage: renderActiveStageWrapper
};
