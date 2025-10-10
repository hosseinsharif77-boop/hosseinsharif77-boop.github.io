// js/utils.js
export function createElementWithClass(tag, className, innerHTML = '') {
    const el = document.createElement(tag);
    el.className = className;
    el.innerHTML = innerHTML;
    return el;
}

export function updateHeaderHeight() {
    const header = document.querySelector('.fixed-header');
    const toolbar = document.getElementById('stage-toolbar');
    
    if (header && toolbar) {
        const headerHeight = header.offsetHeight + 'px';
        const toolbarHeight = toolbar.offsetHeight + 'px';
        
        document.documentElement.style.setProperty('--header-height', headerHeight);
        document.documentElement.style.setProperty('--toolbar-height', toolbarHeight);
        
        // اطمینان از اینکه main به درستی تنظیم شده است
        const main = document.getElementById('main-content');
        if (main) {
            // این خط را تغییر دهید: + 20px را به + 10px کاهش دهید
            main.style.paddingTop = `calc(${headerHeight} + ${toolbarHeight} + 10px)`;
        }
    }
}
