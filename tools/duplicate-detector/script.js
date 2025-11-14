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
    
    // Configure the shared file input helper
    setupFileInput({
        fileInput,
        onFilesSelected: processFiles,
        acceptType: 'image/gif'
    });
    
    // Configure the shared drag-and-drop helper
    setupDragAndDrop({
        uploadArea,
        onFilesDropped: processFiles,
        acceptType: 'image/gif'
    });
    
    // Configure the shared paste helper
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
 * Calculate a hash based on GIF pixel content
 * Use Canvas to read the first frame and compute its hash
 */
async function calculatePixelHash(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = async () => {
            try {
                // Create a canvas to sample pixel data
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                
                // Draw the frame onto the canvas
                ctx.drawImage(img, 0, 0);
                
                // Retrieve the pixel data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixelData = imageData.data;
                
                // Hash the pixel data
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
            // Compute the content hash
            const hash = await calculatePixelHash(fileObj.file);
            
            // Create a preview URL
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
    
    // Reset the file input so the same folder can be selected again
    document.getElementById('fileInput').value = '';
    
    analyzeAndDisplay();
}

function analyzeAndDisplay() {
    const hashMap = new Map();
    
    // Group by hash
    allFiles.forEach(file => {
        if (!hashMap.has(file.hash)) {
            hashMap.set(file.hash, []);
        }
        hashMap.get(file.hash).push(file);
    });
    
    // Update stats
    const totalFiles = allFiles.length;
    const uniqueHashes = hashMap.size;
    let duplicateFiles = 0;
    let duplicateGroups = 0;
    
    const duplicateGroupsArray = [];
    
    // Count only real duplicates (≥ 2 identical files)
    hashMap.forEach((files, hash) => {
        if (files.length > 1) {
            duplicateFiles += files.length;
            duplicateGroups++;
            duplicateGroupsArray.push({ hash, files });
        }
    });
    
    // Refresh the statistics widgets
    document.getElementById('statTotal').textContent = totalFiles;
    document.getElementById('statUnique').textContent = uniqueHashes;
    document.getElementById('statDuplicate').textContent = duplicateFiles;
    document.getElementById('statGroups').textContent = duplicateGroups;
    
    // Render the results
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
    
    // Add a header for duplicate files
    const header = document.createElement('div');
    header.className = 'section-header duplicate-section';
    header.innerHTML = `
        <h2>🔴 Duplicate Files Detected</h2>
        <p>Found ${duplicateGroups.length} group(s) of duplicate files. Files in the same group have identical pixel content.</p>
    `;
    results.appendChild(header);
    
    // Display each duplicate group
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
    // Revoke every object URL
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

// Initialize the page
initRandomBackground();
setupEventListeners();
