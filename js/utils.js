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
    const headerHeight = header.offsetHeight + 'px';
    const toolbarHeight = toolbar ? toolbar.offsetHeight + 'px' : '60px';
    document.documentElement.style.setProperty('--header-height', headerHeight);
    document.documentElement.style.setProperty('--toolbar-height', toolbarHeight);
}
