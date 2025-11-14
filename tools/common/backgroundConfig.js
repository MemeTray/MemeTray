/**
 * MemeTray background wallpaper configuration
 * Centralizes every random wallpaper API pool
 */

/**
 * Pool of random wallpaper APIs
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
 * Retrieve a random wallpaper API URL
 * @returns {string} Randomly selected wallpaper API URL
 */
export function getRandomWallpaper() {
    return WALLPAPER_API_POOL[Math.floor(Math.random() * WALLPAPER_API_POOL.length)];
}

/**
 * Initialize the random background (works outside module environments)
 * @param {string} selector - Background element selector (defaults to '.desktop')
 */
export function initRandomBackground(selector = '.desktop') {
    try {
        const desktop = document.querySelector(selector);
        if (!desktop) return;
        
        const randomApi = getRandomWallpaper();
        desktop.style.backgroundImage = `url("${randomApi}")`;
    } catch (_) {}
}
