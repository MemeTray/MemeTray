let files = [];
let fileIdCounter = 0;

// Cached DOM references
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

// Initialize the module
function init() {
    setupEventListeners();
    updatePreview();
}

// Register event listeners
function setupEventListeners() {
    // Handle file uploads
    fileInput.addEventListener('change', handleFileSelect);

    // Handle drag-and-drop uploads
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Respond to configuration changes
    startNumberInput.addEventListener('input', updatePreview);
    suffixInput.addEventListener('input', handleSuffixInput);
    startNumberInput.addEventListener('input', updateFileList);
    suffixInput.addEventListener('input', updateFileList);

    // Button interactions
    clearBtn.addEventListener('click', clearAll);
    downloadBtn.addEventListener('click', downloadFiles);
}

// Update the filename preview
function updatePreview() {
    const startNum = Math.max(1, Math.min(9999, parseInt(startNumberInput.value) || 1));
    const rawSuffix = suffixInput.value;
    const cleanedSuffix = rawSuffix.trim().replace(/[^a-zA-Z0-9-_]/g, '');
    const suffix = cleanedSuffix || 'doro';

    // Sanitize the suffix only when invalid characters are present
    if (rawSuffix !== cleanedSuffix && rawSuffix.trim() !== '') {
        suffixInput.value = cleanedSuffix;
    }

    const paddedNum = String(startNum).padStart(4, '0');
    preview.textContent = `${paddedNum}_${suffix}.gif`;
}

// Handle file selections
function handleFileSelect(e) {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
}

// Handle drag events
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
    
    // Process files and folders from drag-and-drop
    for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry();
        if (item) {
            await traverseFileTree(item, droppedFiles);
        }
    }
    
    // Filter out GIF files
    const gifFiles = droppedFiles.filter(file => file.type === 'image/gif');
    processFiles(gifFiles);
}

// Traverse the file tree for dropped folders
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

// Read every entry in the directory
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

// Process individual files
function processFiles(newFiles) {
    if (newFiles.length === 0) {
        alert('No GIF files found!');
        return;
    }
    
    console.log(`Processing ${newFiles.length} GIF files`);
    
    // Add the file to the list
    newFiles.forEach(file => {
        // Check for duplicates before adding
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
    
    // Show a success notification
    if (newFiles.length > 0) {
        console.log(`Added ${newFiles.length} files. Total: ${files.length} files`);
    }
}

// Handle suffix input
function handleSuffixInput() {
    const rawValue = suffixInput.value;
    const cleanedValue = rawValue.replace(/[^a-zA-Z0-9-_]/g, '');

    // Remove invalid characters immediately
    if (rawValue !== cleanedValue) {
        suffixInput.value = cleanedValue;
    }

    // Provide visual feedback when the input is cleared
    if (cleanedValue === '') {
        suffixInput.style.borderColor = 'var(--warning)';
        suffixInput.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';

        // Restore styles after three seconds
        setTimeout(() => {
            suffixInput.style.borderColor = '';
            suffixInput.style.backgroundColor = '';
        }, 3000);
    }

    updatePreview();
    updateFileList();
}

// Refresh the displayed file list
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

// Remove a file from the list
function removeFile(id) {
    files = files.filter(f => f.id !== id);
    updateFileList();
    updateUI();
}

// Clear all tracked files
function clearAll() {
    files = [];
    fileIdCounter = 0;
    updateFileList();
    updateUI();
}

// Update UI state
function updateUI() {
    const hasFiles = files.length > 0;
    
    if (hasFiles) {
        batchActions.style.display = 'flex';
    } else {
        batchActions.style.display = 'none';
    }
}

// Format file sizes
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Download the renamed files
async function downloadFiles() {
    if (files.length === 0) return;
    
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Processing...';
    
    try {
        // Dynamically load the JSZip library
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
        
        // Add files to the ZIP archive
        for (let i = 0; i < files.length; i++) {
            const fileObj = files[i];
            const newNumber = startNum + i;
            const paddedNum = String(newNumber).padStart(4, '0');
            const newName = `${paddedNum}_${suffix}.gif`;
            
            zip.file(newName, fileObj.file);
        }
        
        // Generate the ZIP archive
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
        
        // Trigger the ZIP download
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

// Initialize the application
init();
