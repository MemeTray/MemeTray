let files = [];
let fileIdCounter = 0;

// DOM 元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const startNumberInput = document.getElementById('startNumber');
const suffixInput = document.getElementById('suffix');
const preview = document.getElementById('preview');
const fileList = document.getElementById('fileList');
const fileItems = document.getElementById('fileItems');
const fileCount = document.getElementById('fileCount');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const batchActions = document.getElementById('batchActions');

// 初始化
function init() {
    setupEventListeners();
    updatePreview();
}

// 设置事件监听器
function setupEventListeners() {
    // 文件上传
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖拽上传
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // 配置更新
    startNumberInput.addEventListener('input', updatePreview);
    suffixInput.addEventListener('input', updatePreview);
    startNumberInput.addEventListener('input', updateFileList);
    suffixInput.addEventListener('input', updateFileList);
    
    // 按钮事件
    clearBtn.addEventListener('click', clearAll);
    downloadBtn.addEventListener('click', downloadFiles);
}

// 更新预览
function updatePreview() {
    const startNum = Math.max(1, Math.min(9999, parseInt(startNumberInput.value) || 1));
    const suffix = suffixInput.value.trim().replace(/[^a-zA-Z0-9-_]/g, '') || 'doro';
    
    // 更新输入框值（清理无效字符）
    if (startNumberInput.value !== String(startNum)) {
        startNumberInput.value = startNum;
    }
    if (suffixInput.value !== suffix) {
        suffixInput.value = suffix;
    }
    
    const paddedNum = String(startNum).padStart(4, '0');
    preview.textContent = `${paddedNum}_${suffix}.gif`;
}

// 处理文件选择
function handleFileSelect(e) {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
}

// 处理拖拽
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave() {
    uploadArea.classList.remove('dragover');
}

async function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const items = e.dataTransfer.items;
    const droppedFiles = [];
    
    // 处理拖拽的文件和文件夹
    for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry();
        if (item) {
            await traverseFileTree(item, droppedFiles);
        }
    }
    
    // 过滤 GIF 文件
    const gifFiles = droppedFiles.filter(file => file.type === 'image/gif');
    processFiles(gifFiles);
}

// 遍历文件树（处理文件夹）
async function traverseFileTree(item, files) {
    if (item.isFile) {
        return new Promise((resolve) => {
            item.file((file) => {
                files.push(file);
                resolve();
            });
        });
    } else if (item.isDirectory) {
        const dirReader = item.createReader();
        const entries = await readAllEntries(dirReader);
        
        for (const entry of entries) {
            await traverseFileTree(entry, files);
        }
    }
}

// 读取目录中的所有条目
function readAllEntries(dirReader) {
    return new Promise((resolve) => {
        const allEntries = [];
        
        function readBatch() {
            dirReader.readEntries((entries) => {
                if (entries.length > 0) {
                    allEntries.push(...entries);
                    readBatch();
                } else {
                    resolve(allEntries);
                }
            });
        }
        
        readBatch();
    });
}

// 处理文件
function processFiles(newFiles) {
    if (newFiles.length === 0) {
        alert('No GIF files found!');
        return;
    }
    
    console.log(`Processing ${newFiles.length} GIF files`);
    
    // 添加文件到列表
    newFiles.forEach(file => {
        // 检查是否已存在相同文件
        const exists = files.some(f => f.originalName === file.name && f.size === file.size);
        if (!exists) {
            const fileObj = {
                id: ++fileIdCounter,
                file: file,
                originalName: file.name,
                size: file.size
            };
            files.push(fileObj);
        }
    });
    
    updateFileList();
    updateUI();
    
    // 显示成功消息
    if (newFiles.length > 0) {
        console.log(`Added ${newFiles.length} files. Total: ${files.length} files`);
    }
}

// 更新文件列表显示
function updateFileList() {
    if (files.length === 0) {
        fileList.classList.add('hidden');
        return;
    }
    
    fileList.classList.remove('hidden');
    fileCount.textContent = files.length;
    
    const startNum = parseInt(startNumberInput.value) || 1;
    const suffix = suffixInput.value.trim() || 'doro';
    
    fileItems.innerHTML = '';
    
    files.forEach((fileObj, index) => {
        const newNumber = startNum + index;
        const paddedNum = String(newNumber).padStart(4, '0');
        const newName = `${paddedNum}_${suffix}.gif`;
        
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
            <div class="file-info">
                <span class="file-original">${fileObj.originalName}</span>
                <span class="arrow">→</span>
                <span class="file-renamed">${newName}</span>
            </div>
            <button class="remove-btn" onclick="removeFile(${fileObj.id})">Remove</button>
        `;
        
        fileItems.appendChild(item);
    });
}

// 移除文件
function removeFile(id) {
    files = files.filter(f => f.id !== id);
    updateFileList();
    updateUI();
}

// 清空所有文件
function clearAll() {
    files = [];
    fileIdCounter = 0;
    updateFileList();
    updateUI();
}

// 更新 UI 状态
function updateUI() {
    const hasFiles = files.length > 0;
    
    if (hasFiles) {
        batchActions.style.display = 'flex';
    } else {
        batchActions.style.display = 'none';
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// 下载重命名后的文件
async function downloadFiles() {
    if (files.length === 0) return;
    
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Processing...';
    
    try {
        // 动态加载 JSZip
        if (typeof JSZip === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            document.head.appendChild(script);
            
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
            });
        }
        
        const zip = new JSZip();
        const startNum = parseInt(startNumberInput.value) || 1;
        const suffix = suffixInput.value.trim() || 'doro';
        
        // 添加文件到 ZIP
        for (let i = 0; i < files.length; i++) {
            const fileObj = files[i];
            const newNumber = startNum + i;
            const paddedNum = String(newNumber).padStart(4, '0');
            const newName = `${paddedNum}_${suffix}.gif`;
            
            zip.file(newName, fileObj.file);
        }
        
        // 生成 ZIP 文件
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
        
        // 下载 ZIP 文件
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `renamed-gifs-${suffix}-${new Date().toISOString().slice(0, 10)}.zip`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
        
        console.log(`Successfully downloaded ${files.length} renamed files`);
        
    } catch (error) {
        console.error('Download failed:', error);
        alert('Download failed. Please try again.');
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'Download Renamed Files';
    }
}

// 初始化应用
init();
