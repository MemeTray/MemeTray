/**
 * MemeTray 背景壁纸配置
 * 集中管理所有随机壁纸 API 池
 */

/**
 * 随机壁纸 API 池
 */
export const WALLPAPER_API_POOL = [
    'https://t.alcy.cc/ycy',
    'https://t.alcy.cc/moez',
    'https://t.alcy.cc/ysz',
    'https://t.alcy.cc/pc',
    'https://t.alcy.cc/moe',
    'https://t.alcy.cc/fj',
    'https://t.alcy.cc/bd',
    'https://t.alcy.cc/ys',
    'https://t.alcy.cc/lai'
];

/**
 * 获取随机壁纸 API
 * @returns {string} 随机选择的壁纸 API URL
 */
export function getRandomWallpaper() {
    return WALLPAPER_API_POOL[Math.floor(Math.random() * WALLPAPER_API_POOL.length)];
}

/**
 * 初始化随机背景（支持非模块环境）
 * @param {string} selector - 背景元素选择器（默认 '.desktop'）
 */
export function initRandomBackground(selector = '.desktop') {
    try {
        const desktop = document.querySelector(selector);
        if (!desktop) return;
        
        const randomApi = getRandomWallpaper();
        desktop.style.backgroundImage = `url("${randomApi}")`;
    } catch (_) {}
}
