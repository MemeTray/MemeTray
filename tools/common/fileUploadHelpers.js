/**
 * Common utility library for MemeTray tools
 * Provides shared helpers for uploads, drag-and-drop, and paste handling
 */

/**
 * Traverse the file tree (for folder drag-and-drop)
 * @param {FileSystemEntry} item - File system entry
 * @param {string} path - Current path
 * @param {Array} files - Collected files list
 */
export async function traverseFileTree(item, path, files) {
    if (item.isFile) {
        return new Promise((resolve, reject) => {
            item.file((file) => {
                console.log(`Found file: ${file.name} (${file.type}, ${file.size} bytes)`);
                files.push({ file, path: path + file.name });
                resolve();
            }, (error) => {
                console.warn(`Failed to read file: ${item.name}`, error);
                reject(error);
            });
        });
    } else if (item.isDirectory) {
        const dirReader = item.createReader();
        const newPath = path + item.name + '/';
        
        console.log(`Entering directory: ${item.name}`);
        
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
                    }, (error) => {
                        console.warn(`Failed to read directory: ${item.name}`, error);
                        reject(error);
                    });
                };
                
                readBatch();
            });
        };
        
        try {
            const entries = await readAllEntries();
            console.log(`Directory ${item.name} contains ${entries.length} entries`);
            
            // Use Promise.all to process entries concurrently
            const promises = entries.map(entry => traverseFileTree(entry, newPath, files));
            await Promise.all(promises);
        } catch (error) {
            console.warn(`Error processing directory ${item.name}:`, error);
        }
    }
}

/**
 * Enable global drag-and-drop support
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.uploadArea - Upload area element
 * @param {Function} options.onFilesDropped - Callback after files are dropped
 * @param {string} options.acceptType - Accepted file type (e.g. 'image/gif')
 */
export function setupDragAndDrop(options) {
    const { uploadArea, onFilesDropped, acceptType = 'image/gif' } = options;
    
    // Dragging onto the upload area
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling to avoid duplicate handling
        uploadArea.classList.remove('dragover');
        await handleDrop(e, acceptType, onFilesDropped);
    });

    // Global drag support (dropping anywhere in the window)
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
        e.stopPropagation(); // Prevent the event from bubbling
        uploadArea.classList.remove('dragover');
        await handleDrop(e, acceptType, onFilesDropped);
    });
}

/**
 * Handle drag-and-drop events
 */
async function handleDrop(e, acceptType, callback) {
    const items = e.dataTransfer.items;
    const files = [];
    
    console.log(`Processing drag-and-drop with ${items.length} items`)
    
    // Process every dropped item
    const promises = [];
    for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry();
        if (item) {
            promises.push(traverseFileTree(item, '', files));
        }
    }
    
    // Wait for all files to finish processing
    await Promise.all(promises);
    
    console.log(`Traversal complete with ${files.length} files found`)
    
    // Filter valid files
    const validFiles = files.filter(f => {
        const isValid = f.file.type === acceptType || f.file.type.startsWith('image/');
        if (!isValid) {
            console.log(`Skipping file: ${f.file.name} (type: ${f.file.type})`);
        }
        return isValid;
    });
    
    console.log(`Valid files: ${validFiles.length}`)
    
    if (validFiles.length > 0) {
        callback(validFiles);
    } else {
        alert(`No ${acceptType} files found`);
    }
}

/**
 * Enable Ctrl+V paste support
 * @param {Object} options - Configuration options
 * @param {Function} options.onFilesPasted - Callback after paste completes
 * @param {string} options.acceptType - Accepted file type (e.g. 'image/gif')
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
 * Initialize a random background
 * @param {string} selector - Background selector (defaults to '.desktop')
 * @deprecated Use initRandomBackground from backgroundConfig.js instead
 */
export function initRandomBackground(selector = '.desktop') {
    // Retained for backwards compatibility; prefer importing from backgroundConfig.js
    import('./backgroundConfig.js').then(({ initRandomBackground: init }) => {
        init(selector);
    }).catch(() => {
        // Fallback: inline implementation if the module import fails
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
 * Format a file size value
 * @param {number} bytes - Number of bytes
 * @returns {string} Human-readable size string
 */
export function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Calculate the SHA-256 hash of a file
 * @param {ArrayBuffer} arrayBuffer - File ArrayBuffer
 * @returns {Promise<string>} Hex-encoded hash string
 */
export async function calculateFileHash(arrayBuffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Configure the file input change handler
 * @param {Object} options - Configuration options
 * @param {HTMLInputElement} options.fileInput - File input element
 * @param {Function} options.onFilesSelected - Selection callback
 * @param {string} options.acceptType - Accepted MIME type
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
