import { 
    setupDragAndDrop, 
    setupPasteSupport, 
    setupFileInput,
    formatFileSize
} from '../common/fileUploadHelpers.js';
import { initRandomBackground } from '../common/backgroundConfig.js';

let allFiles = [];
let fileIdCounter = 0;

function setupEventListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const addMoreBtn = document.getElementById('addMoreBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    
    // 使用通用库设置文件输入
    setupFileInput({
        fileInput,
        onFilesSelected: processFiles,
        acceptType: 'image/gif'
    });
    
    // 使用通用库设置拖拽功能
    setupDragAndDrop({
        uploadArea,
        onFilesDropped: processFiles,
        acceptType: 'image/gif'
    });
    
    // 使用通用库设置粘贴功能
    setupPasteSupport({
        onFilesPasted: processFiles,
        acceptType: 'image/gif'
    });

    addMoreBtn.addEventListener('click', () => {
        fileInput.click();
    });

    clearAllBtn.addEventListener('click', clearAll);
}

/**
 * 基于 GIF 像素内容计算哈希值
 * 使用 Canvas 读取第一帧的像素数据来计算哈希
 */
async function calculatePixelHash(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = async () => {
            try {
                // 创建 Canvas 来读取像素数据
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                
                // 绘制图像到 Canvas
                ctx.drawImage(img, 0, 0);
                
                // 获取像素数据
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixelData = imageData.data;
                
                // 计算像素数据的哈希值
                const hashBuffer = await crypto.subtle.digest('SHA-256', pixelData);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                
                URL.revokeObjectURL(url);
                resolve(hash);
            } catch (error) {
                URL.revokeObjectURL(url);
                reject(error);
            }
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };
        
        img.src = url;
    });
}

async function processFiles(files) {
    const progressContainer = document.getElementById('progressContainer');
    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const progressFill = document.getElementById('progressFill');
    const batchActions = document.getElementById('batchActions');
    const statsContainer = document.getElementById('statsContainer');
    
    progressContainer.style.display = 'block';
    const totalFiles = files.length;
    let processedCount = 0;
    
    for (const fileObj of files) {
        try {
            // 计算基于像素内容的哈希
            const hash = await calculatePixelHash(fileObj.file);
            
            // 创建预览 URL
            const url = URL.createObjectURL(fileObj.file);
            
            allFiles.push({
                id: fileIdCounter++,
                name: fileObj.file.name,
                path: fileObj.path,
                size: fileObj.file.size,
                hash: hash,
                url: url,
                file: fileObj.file
            });
            
            processedCount++;
            const percent = Math.round((processedCount / totalFiles) * 100);
            progressText.textContent = `Analyzing: ${processedCount} / ${totalFiles}`;
            progressPercent.textContent = `${percent}%`;
            progressFill.style.width = `${percent}%`;
        } catch (error) {
            console.error('Error processing file:', fileObj.file.name, error);
            processedCount++;
        }
    }
    
    progressContainer.style.display = 'none';
    batchActions.style.display = 'flex';
    statsContainer.style.display = 'grid';
    
    // 重置文件输入，允许再次选择相同文件夹
    document.getElementById('fileInput').value = '';
    
    analyzeAndDisplay();
}

function analyzeAndDisplay() {
    const hashMap = new Map();
    
    // 按 hash 分组
    allFiles.forEach(file => {
        if (!hashMap.has(file.hash)) {
            hashMap.set(file.hash, []);
        }
        hashMap.get(file.hash).push(file);
    });
    
    // 统计
    const totalFiles = allFiles.length;
    const uniqueHashes = hashMap.size;
    let duplicateFiles = 0;
    let duplicateGroups = 0;
    
    const duplicateGroupsArray = [];
    
    // 只统计真正的重复（≥2个相同文件）
    hashMap.forEach((files, hash) => {
        if (files.length > 1) {
            duplicateFiles += files.length;
            duplicateGroups++;
            duplicateGroupsArray.push({ hash, files });
        }
    });
    
    // 更新统计
    document.getElementById('statTotal').textContent = totalFiles;
    document.getElementById('statUnique').textContent = uniqueHashes;
    document.getElementById('statDuplicate').textContent = duplicateFiles;
    document.getElementById('statGroups').textContent = duplicateGroups;
    
    // 显示结果
    displayResults(duplicateGroupsArray);
}

function displayResults(duplicateGroups) {
    const results = document.getElementById('results');
    results.innerHTML = '';
    
    if (duplicateGroups.length === 0) {
        const noduplicates = document.createElement('div');
        noduplicates.className = 'section-header';
        noduplicates.innerHTML = `
            <h2>✅ No Duplicates Found</h2>
            <p>All files are unique based on pixel content!</p>
        `;
        results.appendChild(noduplicates);
        return;
    }
    
    // 添加重复文件标题
    const header = document.createElement('div');
    header.className = 'section-header duplicate-section';
    header.innerHTML = `
        <h2>🔴 Duplicate Files Detected</h2>
        <p>Found ${duplicateGroups.length} group(s) of duplicate files. Files in the same group have identical pixel content.</p>
    `;
    results.appendChild(header);
    
    // 显示每个重复组
    duplicateGroups.forEach((group, index) => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'duplicate-group';
        
        const groupHeader = document.createElement('div');
        groupHeader.className = 'group-header';
        groupHeader.innerHTML = `
            <div class="group-title">Group ${index + 1}</div>
            <div class="group-count">${group.files.length} identical files</div>
        `;
        groupDiv.appendChild(groupHeader);
        
        const fileGrid = document.createElement('div');
        fileGrid.className = 'file-grid';
        
        group.files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const preview = document.createElement('div');
            preview.className = 'file-preview';
            const img = document.createElement('img');
            img.src = file.url;
            img.alt = file.name;
            preview.appendChild(img);
            
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            
            const filePath = document.createElement('div');
            filePath.className = 'file-path';
            filePath.textContent = file.path;
            
            const fileSize = document.createElement('div');
            fileSize.className = 'file-size';
            fileSize.textContent = formatFileSize(file.size);
            
            fileItem.appendChild(preview);
            fileItem.appendChild(fileName);
            fileItem.appendChild(filePath);
            fileItem.appendChild(fileSize);
            
            fileGrid.appendChild(fileItem);
        });
        
        groupDiv.appendChild(fileGrid);
        results.appendChild(groupDiv);
    });
}

function clearAll() {
    // 清理所有 URL 对象
    allFiles.forEach(file => {
        if (file.url) {
            URL.revokeObjectURL(file.url);
        }
    });
    
    allFiles = [];
    fileIdCounter = 0;
    
    document.getElementById('results').innerHTML = '';
    document.getElementById('batchActions').style.display = 'none';
    document.getElementById('statsContainer').style.display = 'none';
    document.getElementById('progressContainer').style.display = 'none';
    document.getElementById('fileInput').value = '';
}

// 初始化
initRandomBackground();
setupEventListeners();
