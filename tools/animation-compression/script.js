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
        
        console.log(`开始处理拖拽，共 ${items.length} 个项目`);
        
        // Process every dropped item
        const promises = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i].webkitGetAsEntry();
            if (item) {
                console.log('Processing item:', item.name, 'isDirectory:', item.isDirectory);
                promises.push(traverseFileTree(item, '', files));
            }
        }
        
        // Wait for every file to finish processing
        await Promise.all(promises);
        
        console.log('Total files found:', files.length);
        const webpEnabled = document.getElementById('webpToggle').checked;
        const validFiles = files.filter(f => {
            const isValid = webpEnabled 
                ? (f.file.type === 'image/gif' || f.file.type === 'image/webp')
                : f.file.type === 'image/gif';
            if (!isValid) {
                console.log(`跳过文件: ${f.file.name} (类型: ${f.file.type})`);
            }
            return isValid;
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
                console.log(`找到文件: ${file.name} (${file.type}, ${file.size} bytes)`);
                files.push({ file, path: path + file.name });
                resolve();
            }, (error) => {
                console.warn(`读取文件失败: ${item.name}`, error);
                reject(error);
            });
        });
    } else if (item.isDirectory) {
        if (!folderName) {
            folderName = item.name;
        }
        const dirReader = item.createReader();
        const newPath = path + item.name + '/';
        
        console.log(`进入目录: ${item.name}`);
        
        // readEntries must be called multiple times to fetch all files
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
                    }, (error) => {
                        console.warn(`读取目录失败: ${item.name}`, error);
                        reject(error);
                    });
                };
                
                readBatch();
            });
        };
        
        try {
            const entries = await readAllEntries();
            console.log(`目录 ${item.name} 包含 ${entries.length} 个项目`);
            
            // Use Promise.all to handle entries concurrently
            const promises = entries.map(entry => traverseFileTree(entry, newPath, files));
            await Promise.all(promises);
        } catch (error) {
            console.warn(`处理目录 ${item.name} 时出错:`, error);
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
    
    // Detect duplicate files
    checkDuplicates();
}

// Calculate a hash for the file contents
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

# Process each frame
try:
    while True:
        frame = img.copy()
        
        # Preserve transparency by converting to RGBA
        if frame.mode != 'RGBA':
            frame = frame.convert('RGBA')
        
        # Scale to 128x128
        frame = frame.resize((128, 128), Image.Resampling.NEAREST)
        frames.append(frame)
        durations.append(frame.info.get('duration', img.info.get('duration', 100)))
        img.seek(img.tell() + 1)
except EOFError:
    pass

# Provide a default duration when only one frame exists
if len(frames) == 1:
    durations = [100]

if frames:
    # Convert RGBA frames to palette mode so browsers render them correctly
    p_frames = []
    
    for frame in frames:
        # Use quantize to convert RGBA to palette mode while keeping transparency
        # Create a palette image with an alpha channel
        alpha = frame.split()[-1]  # Extract the alpha channel
        
        # Convert RGBA to RGB for palette creation
        rgb = Image.new('RGB', frame.size, (255, 255, 255))
        rgb.paste(frame, mask=alpha)
        
        # Convert to palette mode
        p_frame = rgb.convert('P', palette=Image.ADAPTIVE, colors=255)
        
        # Set the transparent color
        # Map fully transparent pixels to the transparent color index
        threshold = 128
        alpha_data = alpha.getdata()
        p_data = list(p_frame.getdata())
        
        # Reserve palette index 255 for the transparent color
        for i, a in enumerate(alpha_data):
            if a < threshold:
                p_data[i] = 255
        
        p_frame.putdata(p_data)
        p_frames.append(p_frame)
    
    # Save the GIF while specifying the transparency index
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
        
        // Rename WebP files to .gif and mark them to avoid conflicts
        let outputFileName, outputFilePath;
        if (isWebP) {
            // Rename 1.webp to 1_from_webp.gif to prevent clashing with 1.gif
            outputFileName = fileName.replace(/\.webp$/i, '_from_webp.gif');
            outputFilePath = filePath.replace(/\.webp$/i, '_from_webp.gif');
        } else {
            outputFileName = fileName;
            outputFilePath = filePath;
        }
        
        // Calculate the hash value
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
    
    // Count the occurrences of each hash
    processedFiles.forEach(file => {
        if (!file.deleted) {
            if (!hashMap.has(file.hash)) {
                hashMap.set(file.hash, []);
            }
            hashMap.get(file.hash).push(file.id);
        }
    });
    
    // Identify all duplicate file IDs
    hashMap.forEach((ids, hash) => {
        if (ids.length > 1) {
            duplicateCount += ids.length - 1;
            ids.forEach(id => duplicateIds.add(id));
        }
    });
    
    // Reorder the display when duplicates exist
    if (duplicateIds.size > 0) {
        const preview = document.getElementById('preview');
        const allItems = Array.from(preview.children);
        
        // Split duplicate and unique files
        const duplicateItems = [];
        const uniqueItems = [];
        
        allItems.forEach(item => {
            const fileId = parseInt(item.dataset.fileId);
            if (duplicateIds.has(fileId)) {
                duplicateItems.push(item);
                // Mark as duplicate files
                const warning = item.querySelector('.duplicate-warning');
                if (warning) {
                    warning.style.display = 'block';
                }
            } else {
                uniqueItems.push(item);
            }
        });
        
        // Clear the preview area
        preview.innerHTML = '';
        
        // Add a heading for duplicate files
        if (duplicateItems.length > 0) {
            const duplicateSection = document.createElement('div');
            duplicateSection.className = 'section-header duplicate-section';
            duplicateSection.innerHTML = `
                <h2>🔴 Duplicate Files (${duplicateItems.length})</h2>
                <p>The following files have identical content, consider removing duplicates</p>
            `;
            preview.appendChild(duplicateSection);
            
            // Append duplicate files
            duplicateItems.forEach(item => preview.appendChild(item));
        }
        
        // Add a heading for unique files
        if (uniqueItems.length > 0) {
            const uniqueSection = document.createElement('div');
            uniqueSection.className = 'section-header unique-section';
            uniqueSection.innerHTML = `
                <h2>✅ Unique Files (${uniqueItems.length})</h2>
            `;
            preview.appendChild(uniqueSection);
            
            // Append unique files
            uniqueItems.forEach(item => preview.appendChild(item));
        }
        
        // Show a hint about duplicates
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
        
        // Re-check duplicates
        checkDuplicates();
    }
}

window.autoRemoveDuplicates = function() {
    const hashMap = new Map();
    
    // Find all duplicate file groups
    processedFiles.forEach(file => {
        if (!file.deleted) {
            if (!hashMap.has(file.hash)) {
                hashMap.set(file.hash, []);
            }
            hashMap.get(file.hash).push(file);
        }
    });
    
    let removedCount = 0;
    // Keep the first file in each duplicate group and remove the rest
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
        
        // Strip folder prefixes from the path when present
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
    // Revoke every object URL
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

// Initialize the random background
import { initRandomBackground } from '../common/backgroundConfig.js';
initRandomBackground();

initPyodide();
