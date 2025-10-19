let pyodide;
let processedFiles = [];
let folderName = null;
let fileIdCounter = 0;

async function initPyodide() {
    try {
        pyodide = await loadPyodide();
        await pyodide.loadPackage('Pillow');
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        
        setupEventListeners();
    } catch (error) {
        console.error('Failed to load Pyodide:', error);
        document.getElementById('loading').innerHTML = '<p style="color: red;">Failed to load, please refresh the page</p>';
    }
}

function setupEventListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const webpToggle = document.getElementById('webpToggle');
    const uploadText = document.getElementById('uploadText');
    
    webpToggle.addEventListener('change', () => {
        if (webpToggle.checked) {
            fileInput.setAttribute('accept', 'image/gif,image/webp');
            uploadText.textContent = 'Click to select or drag GIF/WebP files/folder';
        } else {
            fileInput.setAttribute('accept', 'image/gif');
            uploadText.textContent = 'Click to select or drag GIF files/folder';
        }
    });
    
    fileInput.addEventListener('change', handleFiles);
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const items = e.dataTransfer.items;
        const files = [];
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i].webkitGetAsEntry();
            if (item) {
                console.log('Processing item:', item.name, 'isDirectory:', item.isDirectory);
                await traverseFileTree(item, '', files);
            }
        }
        
        console.log('Total files found:', files.length);
        const webpEnabled = document.getElementById('webpToggle').checked;
        const validFiles = files.filter(f => {
            if (webpEnabled) {
                return f.file.type === 'image/gif' || f.file.type === 'image/webp';
            }
            return f.file.type === 'image/gif';
        });
        console.log('Valid files found:', validFiles.length);
        
        if (validFiles.length > 0) {
            processFiles(validFiles);
        } else {
            alert(webpEnabled ? 'No GIF or WebP files found' : 'No GIF files found');
        }
    });

    document.getElementById('downloadAllBtn').addEventListener('click', downloadAllAsZip);
    document.getElementById('clearAllBtn').addEventListener('click', clearAll);
}

async function traverseFileTree(item, path, files) {
    if (item.isFile) {
        return new Promise((resolve, reject) => {
            item.file((file) => {
                console.log('Found file:', path + file.name);
                files.push({ file, path: path + file.name });
                resolve();
            }, reject);
        });
    } else if (item.isDirectory) {
        if (!folderName) {
            folderName = item.name;
        }
        const dirReader = item.createReader();
        const newPath = path + item.name + '/';
        
        console.log('Reading directory:', newPath);
        
        // readEntries 需要多次调用才能读取所有文件
        const readAllEntries = () => {
            return new Promise((resolve, reject) => {
                const allEntries = [];
                
                const readBatch = () => {
                    dirReader.readEntries((entries) => {
                        if (entries.length > 0) {
                            console.log('Read batch of', entries.length, 'entries from', newPath);
                            allEntries.push(...entries);
                            readBatch();
                        } else {
                            console.log('Finished reading directory:', newPath, 'Total entries:', allEntries.length);
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

function handleFiles(e) {
    const files = Array.from(e.target.files);
    const fileObjects = files.map(file => ({
        file,
        path: file.webkitRelativePath || file.name
    }));
    
    if (files.length > 0 && files[0].webkitRelativePath) {
        folderName = files[0].webkitRelativePath.split('/')[0];
    }
    
    const webpEnabled = document.getElementById('webpToggle').checked;
    const validFiles = fileObjects.filter(f => {
        if (webpEnabled) {
            return f.file.type === 'image/gif' || f.file.type === 'image/webp';
        }
        return f.file.type === 'image/gif';
    });
    
    processFiles(validFiles);
}

async function processFiles(files) {
    const progressContainer = document.getElementById('progressContainer');
    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const progressFill = document.getElementById('progressFill');
    const batchActions = document.getElementById('batchActions');
    
    progressContainer.style.display = 'block';
    const totalFiles = files.length;
    let processedCount = 0;
    
    for (const fileObj of files) {
        const reader = new FileReader();
        await new Promise((resolve) => {
            reader.onload = async (e) => {
                await resizeGif(new Uint8Array(e.target.result), fileObj.file.name, fileObj.path);
                processedCount++;
                
                const percent = Math.round((processedCount / totalFiles) * 100);
                progressText.textContent = `Processing: ${processedCount} / ${totalFiles}`;
                progressPercent.textContent = `${percent}%`;
                progressFill.style.width = `${percent}%`;
                
                resolve();
            };
            reader.readAsArrayBuffer(fileObj.file);
        });
    }
    
    progressContainer.style.display = 'none';
    batchActions.style.display = 'flex';
    
    // 检测重复文件
    checkDuplicates();
}

// 计算文件内容的hash值
async function calculateHash(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function resizeGif(imageData, fileName, filePath) {
    try {
        const isWebP = fileName.toLowerCase().endsWith('.webp');
        const inputFile = isWebP ? '/input.webp' : '/input.gif';
        
        pyodide.FS.writeFile(inputFile, imageData);
        
        await pyodide.runPythonAsync(`
from PIL import Image

img = Image.open('${inputFile}')
frames = []
durations = []

# 处理每一帧
try:
    while True:
        frame = img.copy()
        
        # 保留透明通道，转换为RGBA
        if frame.mode != 'RGBA':
            frame = frame.convert('RGBA')
        
        # 缩放到128x128
        frame = frame.resize((128, 128), Image.Resampling.NEAREST)
        frames.append(frame)
        durations.append(frame.info.get('duration', img.info.get('duration', 100)))
        img.seek(img.tell() + 1)
except EOFError:
    pass

# 如果只有一帧，添加默认时长
if len(frames) == 1:
    durations = [100]

if frames:
    # 将RGBA帧转换为P模式（调色板模式），这样浏览器才能正确显示
    p_frames = []
    
    for frame in frames:
        # 使用quantize将RGBA转为P模式，保留透明度
        # 创建一个带alpha通道的调色板图像
        alpha = frame.split()[-1]  # 获取alpha通道
        
        # 将RGBA转换为RGB用于调色板生成
        rgb = Image.new('RGB', frame.size, (255, 255, 255))
        rgb.paste(frame, mask=alpha)
        
        # 转换为P模式
        p_frame = rgb.convert('P', palette=Image.ADAPTIVE, colors=255)
        
        # 设置透明色
        # 找出完全透明的像素，将它们设置为透明色索引
        threshold = 128
        alpha_data = alpha.getdata()
        p_data = list(p_frame.getdata())
        
        # 添加透明色到调色板（索引255）
        for i, a in enumerate(alpha_data):
            if a < threshold:
                p_data[i] = 255
        
        p_frame.putdata(p_data)
        p_frames.append(p_frame)
    
    # 保存为GIF，指定透明色索引
    p_frames[0].save(
        '/output.gif',
        save_all=True,
        append_images=p_frames[1:],
        duration=durations,
        loop=img.info.get('loop', 0),
        disposal=2,
        transparency=255,
        optimize=False
    )
        `);
        
        const outputData = pyodide.FS.readFile('/output.gif');
        const blob = new Blob([outputData], { type: 'image/gif' });
        const url = URL.createObjectURL(blob);
        
        // 如果是 WebP，修改文件名为 .gif，并添加标记避免与原生gif冲突
        let outputFileName, outputFilePath;
        if (isWebP) {
            // 将 1.webp 改为 1_from_webp.gif 避免和 1.gif 冲突
            outputFileName = fileName.replace(/\.webp$/i, '_from_webp.gif');
            outputFilePath = filePath.replace(/\.webp$/i, '_from_webp.gif');
        } else {
            outputFileName = fileName;
            outputFilePath = filePath;
        }
        
        // 计算hash值
        const hash = await calculateHash(blob);
        
        displayPreview(url, outputFileName, blob, outputFilePath, hash);
        
        pyodide.FS.unlink(inputFile);
        pyodide.FS.unlink('/output.gif');
        
    } catch (error) {
        console.error('Error processing image:', error);
        alert('Error processing image: ' + error.message);
    }
}

function displayPreview(url, fileName, blob, filePath, hash) {
    const preview = document.getElementById('preview');
    const previewItem = document.createElement('div');
    const fileId = fileIdCounter++;
    previewItem.className = 'preview-item';
    previewItem.dataset.fileId = fileId;
    
    const name = document.createElement('h3');
    name.textContent = filePath || fileName;
    
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    
    const img = document.createElement('img');
    img.src = url;
    img.alt = fileName;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '8px';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn';
    downloadBtn.textContent = 'Download';
    downloadBtn.onclick = () => downloadImage(url, fileName);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => deleteFile(fileId);
    
    buttonContainer.appendChild(downloadBtn);
    buttonContainer.appendChild(deleteBtn);
    
    const info = document.createElement('div');
    info.className = 'info';
    info.textContent = `128 × 128 px | ${(blob.size / 1024).toFixed(2)} KB`;
    
    const duplicateWarning = document.createElement('div');
    duplicateWarning.className = 'duplicate-warning';
    duplicateWarning.style.display = 'none';
    duplicateWarning.innerHTML = '⚠️ Duplicate file detected';
    
    imageContainer.appendChild(img);
    previewItem.appendChild(name);
    previewItem.appendChild(imageContainer);
    previewItem.appendChild(buttonContainer);
    previewItem.appendChild(info);
    previewItem.appendChild(duplicateWarning);
    
    preview.appendChild(previewItem);
    
    processedFiles.push({
        id: fileId,
        fileName: fileName,
        filePath: filePath || fileName,
        blob: blob,
        url: url,
        hash: hash,
        deleted: false
    });
}

function checkDuplicates() {
    const hashMap = new Map();
    let duplicateCount = 0;
    const duplicateIds = new Set();
    
    // 统计每个hash出现的次数
    processedFiles.forEach(file => {
        if (!file.deleted) {
            if (!hashMap.has(file.hash)) {
                hashMap.set(file.hash, []);
            }
            hashMap.get(file.hash).push(file.id);
        }
    });
    
    // 找出所有重复文件的ID
    hashMap.forEach((ids, hash) => {
        if (ids.length > 1) {
            duplicateCount += ids.length - 1;
            ids.forEach(id => duplicateIds.add(id));
        }
    });
    
    // 如果有重复文件，重新组织显示顺序
    if (duplicateIds.size > 0) {
        const preview = document.getElementById('preview');
        const allItems = Array.from(preview.children);
        
        // 分离重复文件和唯一文件
        const duplicateItems = [];
        const uniqueItems = [];
        
        allItems.forEach(item => {
            const fileId = parseInt(item.dataset.fileId);
            if (duplicateIds.has(fileId)) {
                duplicateItems.push(item);
                // 标记为重复文件
                const warning = item.querySelector('.duplicate-warning');
                if (warning) {
                    warning.style.display = 'block';
                }
            } else {
                uniqueItems.push(item);
            }
        });
        
        // 清空预览区域
        preview.innerHTML = '';
        
        // 添加重复文件区域标题
        if (duplicateItems.length > 0) {
            const duplicateSection = document.createElement('div');
            duplicateSection.className = 'section-header duplicate-section';
            duplicateSection.innerHTML = `
                <h2>🔴 Duplicate Files (${duplicateItems.length})</h2>
                <p>The following files have identical content, consider removing duplicates</p>
            `;
            preview.appendChild(duplicateSection);
            
            // 添加重复文件
            duplicateItems.forEach(item => preview.appendChild(item));
        }
        
        // 添加唯一文件区域标题
        if (uniqueItems.length > 0) {
            const uniqueSection = document.createElement('div');
            uniqueSection.className = 'section-header unique-section';
            uniqueSection.innerHTML = `
                <h2>✅ Unique Files (${uniqueItems.length})</h2>
            `;
            preview.appendChild(uniqueSection);
            
            // 添加唯一文件
            uniqueItems.forEach(item => preview.appendChild(item));
        }
        
        // 显示重复文件提示
        const existingAlert = document.getElementById('duplicateAlert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        const alert = document.createElement('div');
        alert.id = 'duplicateAlert';
        alert.className = 'duplicate-alert';
        alert.innerHTML = `
            <span>⚠️ Detected ${duplicateCount} duplicate files, moved to top</span>
            <button onclick="autoRemoveDuplicates()" class="auto-remove-btn">Auto Remove Duplicates</button>
        `;
        
        const batchActions = document.getElementById('batchActions');
        batchActions.parentNode.insertBefore(alert, batchActions);
    }
}

function deleteFile(fileId) {
    const file = processedFiles.find(f => f.id === fileId);
    if (file) {
        file.deleted = true;
        const previewItem = document.querySelector(`[data-file-id="${fileId}"]`);
        if (previewItem) {
            previewItem.style.opacity = '0.5';
            previewItem.style.filter = 'grayscale(100%)';
            const deleteBtn = previewItem.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.textContent = 'Deleted';
                deleteBtn.disabled = true;
                deleteBtn.style.background = '#999';
                deleteBtn.style.cursor = 'not-allowed';
            }
        }
        URL.revokeObjectURL(file.url);
        
        // 重新检查重复
        checkDuplicates();
    }
}

window.autoRemoveDuplicates = function() {
    const hashMap = new Map();
    
    // 找出所有重复的文件组
    processedFiles.forEach(file => {
        if (!file.deleted) {
            if (!hashMap.has(file.hash)) {
                hashMap.set(file.hash, []);
            }
            hashMap.get(file.hash).push(file);
        }
    });
    
    let removedCount = 0;
    // 对于每组重复文件，保留第一个，删除其余的
    hashMap.forEach((files, hash) => {
        if (files.length > 1) {
            for (let i = 1; i < files.length; i++) {
                deleteFile(files[i].id);
                removedCount++;
            }
        }
    });
    
    if (removedCount > 0) {
        const alert = document.getElementById('duplicateAlert');
        if (alert) {
            alert.remove();
        }
    }
}

function downloadImage(url, fileName) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/\.[^/.]+$/, '') + '_128x128.gif';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

async function downloadAllAsZip() {
    const activeFiles = processedFiles.filter(f => !f.deleted);
    
    if (activeFiles.length === 0) {
        alert('No files to download');
        return;
    }

    const zip = new JSZip();
    
    activeFiles.forEach(file => {
        let pathInZip = file.filePath;
        
        // 如果有文件夹名，去掉路径中的文件夹前缀
        if (folderName && pathInZip.startsWith(folderName + '/')) {
            pathInZip = pathInZip.substring(folderName.length + 1);
        }
        
        zip.file(pathInZip, file.blob);
    });
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    
    let zipName;
    if (folderName) {
        zipName = `${folderName}.zip`;
    } else {
        const now = new Date();
        const timestamp = now.getFullYear() + 
                         String(now.getMonth() + 1).padStart(2, '0') + 
                         String(now.getDate()).padStart(2, '0') + '_' +
                         String(now.getHours()).padStart(2, '0') + 
                         String(now.getMinutes()).padStart(2, '0') + 
                         String(now.getSeconds()).padStart(2, '0');
        zipName = `GIF_Compressed_128x128_${timestamp}.zip`;
    }
    
    a.download = zipName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function clearAll() {
    // 清理所有URL对象
    processedFiles.forEach(file => {
        if (file.url) {
            URL.revokeObjectURL(file.url);
        }
    });
    
    processedFiles = [];
    folderName = null;
    fileIdCounter = 0;
    document.getElementById('preview').innerHTML = '';
    document.getElementById('batchActions').style.display = 'none';
    document.getElementById('progressContainer').style.display = 'none';
    document.getElementById('fileInput').value = '';
    
    const duplicateAlert = document.getElementById('duplicateAlert');
    if (duplicateAlert) {
        duplicateAlert.remove();
    }
}

initPyodide();
