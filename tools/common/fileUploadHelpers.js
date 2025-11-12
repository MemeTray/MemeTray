/**
 * MemeTray 工具通用函数库
 * 包含文件上传、拖拽、粘贴等通用功能
 */

/**
 * 遍历文件树（处理文件夹拖拽）
 * @param {FileSystemEntry} item - 文件系统条目
 * @param {string} path - 当前路径
 * @param {Array} files - 文件数组
 */
export async function traverseFileTree(item, path, files) {
    if (item.isFile) {
        return new Promise((resolve, reject) => {
            item.file((file) => {
                files.push({ file, path: path + file.name });
                resolve();
            }, reject);
        });
    } else if (item.isDirectory) {
        const dirReader = item.createReader();
        const newPath = path + item.name + '/';
        
        const readAllEntries = () => {
            return new Promise((resolve, reject) => {
                const allEntries = [];
                
                const readBatch = () => {
                    dirReader.readEntries((entries) => {
                        if (entries.length > 0) {
                            allEntries.push(...entries);
                            readBatch();
                        } else {
                            resolve(allEntries);
                        }
                    }, reject);
                };
                
                readBatch();
            });
        };
        
        const entries = await readAllEntries();
        for (const entry of entries) {
            await traverseFileTree(entry, newPath, files);
        }
    }
}

/**
 * 设置全局文件拖拽支持
 * @param {Object} options - 配置选项
 * @param {HTMLElement} options.uploadArea - 上传区域元素
 * @param {Function} options.onFilesDropped - 文件拖拽完成回调
 * @param {string} options.acceptType - 接受的文件类型 (例如: 'image/gif')
 */
export function setupDragAndDrop(options) {
    const { uploadArea, onFilesDropped, acceptType = 'image/gif' } = options;
    
    // 拖拽到上传区域
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation(); // 阻止事件冒泡，避免重复处理
        uploadArea.classList.remove('dragover');
        await handleDrop(e, acceptType, onFilesDropped);
    });

    // 全局拖拽支持（拖拽到窗口任意位置）
    document.body.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    document.body.addEventListener('dragleave', (e) => {
        if (e.target === document.body) {
            uploadArea.classList.remove('dragover');
        }
    });
    
    document.body.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation(); // 阻止事件冒泡
        uploadArea.classList.remove('dragover');
        await handleDrop(e, acceptType, onFilesDropped);
    });
}

/**
 * 处理文件拖拽事件
 */
async function handleDrop(e, acceptType, callback) {
    const items = e.dataTransfer.items;
    const files = [];
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry();
        if (item) {
            await traverseFileTree(item, '', files);
        }
    }
    
    const validFiles = files.filter(f => f.file.type === acceptType);
    
    if (validFiles.length > 0) {
        callback(validFiles);
    } else {
        alert(`No ${acceptType} files found`);
    }
}

/**
 * 设置 Ctrl+V 粘贴支持
 * @param {Object} options - 配置选项
 * @param {Function} options.onFilesPasted - 文件粘贴完成回调
 * @param {string} options.acceptType - 接受的文件类型 (例如: 'image/gif')
 */
export function setupPasteSupport(options) {
    const { onFilesPasted, acceptType = 'image/gif' } = options;
    
    document.addEventListener('paste', async (e) => {
        const items = e.clipboardData.items;
        const files = [];
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file' && item.type === acceptType) {
                const file = item.getAsFile();
                files.push({
                    file: file,
                    path: file.name
                });
            }
        }
        
        if (files.length > 0) {
            onFilesPasted(files);
        }
    });
}

/**
 * 初始化随机背景
 * @param {string} selector - 背景元素选择器（默认 '.desktop'）
 * @deprecated 请使用 backgroundConfig.js 中的 initRandomBackground
 */
export function initRandomBackground(selector = '.desktop') {
    // 为了向后兼容，保留此函数，但建议导入 backgroundConfig.js
    import('./backgroundConfig.js').then(({ initRandomBackground: init }) => {
        init(selector);
    }).catch(() => {
        // 降级处理：如果模块加载失败，使用内联实现
        try {
            const desktop = document.querySelector(selector);
            if (!desktop) return;
            const apiPool = [
                'https://t.alcy.cc/ycy', 'https://t.alcy.cc/moez', 'https://t.alcy.cc/ysz',
                'https://t.alcy.cc/pc', 'https://t.alcy.cc/moe', 'https://t.alcy.cc/fj',
                'https://t.alcy.cc/bd', 'https://t.alcy.cc/ys', 'https://t.alcy.cc/lai'
            ];
            desktop.style.backgroundImage = `url("${apiPool[Math.floor(Math.random() * apiPool.length)]}")`;
        } catch (_) {}
    });
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * 计算文件的 SHA-256 哈希值
 * @param {ArrayBuffer} arrayBuffer - 文件的 ArrayBuffer
 * @returns {Promise<string>} 哈希值的十六进制字符串
 */
export async function calculateFileHash(arrayBuffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 设置文件输入框变更事件
 * @param {Object} options - 配置选项
 * @param {HTMLInputElement} options.fileInput - 文件输入框元素
 * @param {Function} options.onFilesSelected - 文件选择回调
 * @param {string} options.acceptType - 接受的文件类型
 */
export function setupFileInput(options) {
    const { fileInput, onFilesSelected, acceptType = 'image/gif' } = options;
    
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        const fileObjects = files.map(file => ({
            file,
            path: file.webkitRelativePath || file.name
        }));
        
        const validFiles = fileObjects.filter(f => f.file.type === acceptType);
        
        if (validFiles.length > 0) {
            onFilesSelected(validFiles);
        } else {
            alert(`No ${acceptType} files found`);
        }
    });
}
