// 随机背景初始化
import { initRandomBackground } from '../common/backgroundConfig.js';
initRandomBackground();

// 导入任务栏和预览面板模块
import { initMemeTrayUI } from '../common/taskbarPreview.js';

// Pyodide 实例
let pyodide = null;

// 全局状态管理
let state = {
    step: 1,
    originalFiles: [],
    compressedFiles: [],
    deduplicatedFiles: [],
    finalFiles: [],
    selectedFiles: new Set(),
    isProcessing: false,
    pyodideReady: false,
    settings: {
        webpSupport: true,
        autoRemoveDuplicates: true,
        autoRename: true,
        startNumber: 1,
        suffix: 'meme'
    }
};

// DOM 元素
const elements = {
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    webpToggle: document.getElementById('webpToggle'),
    autoRemoveDuplicates: document.getElementById('autoRemoveDuplicates'),
    autoRename: document.getElementById('autoRename'),
    startNumber: document.getElementById('startNumber'),
    suffix: document.getElementById('suffix'),
    preview: document.getElementById('preview'),
    configSection: document.getElementById('configSection'),
    optionsPanel: document.getElementById('optionsPanel'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    loadingProgressBar: document.getElementById('loadingProgressBar'),
    progressContainer: document.getElementById('progressContainer'),
    progressText: document.getElementById('progressText'),
    progressPercent: document.getElementById('progressPercent'),
    progressFill: document.getElementById('progressFill'),
    resultsArea: document.getElementById('resultsArea'),
    resultsGrid: document.getElementById('resultsGrid'),
    actionsArea: document.getElementById('actionsArea'),
    deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
    restartBtn: document.getElementById('restartBtn'),
    downloadBtn: document.getElementById('downloadBtn')
};

// 初始化
async function init() {
    // 初始化 Pyodide
    await initPyodide();

    setupEventListeners();
    updatePreview();
    updateStepIndicator();

    // 初始化任务栏和预览面板
    initMemeTrayComponents();

    console.log('✅ All-in-One tool initialized');
}

// 初始化 Pyodide
async function initPyodide() {
    try {
        elements.loadingIndicator.style.display = 'block';
        const loadingText = elements.loadingIndicator.querySelector('.loading-text');
        loadingText.textContent = 'Loading image processing library...';

        pyodide = await loadPyodide();
        await pyodide.loadPackage('Pillow');

        state.pyodideReady = true;
        elements.loadingIndicator.style.display = 'none';

        console.log('✅ Pyodide initialized with Pillow');
    } catch (error) {
        console.error('Failed to load Pyodide:', error);
        elements.loadingIndicator.style.display = 'none';
        alert('Failed to load image processing library. Please refresh the page.');
    }
}

// 初始化任务栏和预览面板（使用统一模块）
let memeTrayUI = null
function initMemeTrayComponents() {
    try {
        memeTrayUI = initMemeTrayUI({
            taskbar: {
                containerId: 'taskbar',
                showClock: true,
                showTrayIcon: true,
                showSystemIcons: true
            },
            preview: {
                containerId: 'previewPanel',
                title: 'GIF Preview',
                dragHint: 'Drag & Drop GIF files here',
                pasteHint: 'or paste with Ctrl+V',
                downloadAllText: 'Download All as ZIP',
                clearAllText: 'Clear All'
            }
        })

        console.log('MemeTray UI initialized successfully')
    } catch (err) {
        console.error('Failed to initialize MemeTray UI:', err)
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 文件上传
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);

    // 选项切换
    elements.webpToggle.addEventListener('change', (e) => {
        state.settings.webpSupport = e.target.checked;
    });
    elements.autoRemoveDuplicates.addEventListener('change', (e) => {
        state.settings.autoRemoveDuplicates = e.target.checked;
        if (!e.target.checked) {
            elements.autoRename.checked = false;
            state.settings.autoRename = false;
        }
    });
    elements.autoRename.addEventListener('change', (e) => {
        state.settings.autoRename = e.target.checked;
        if (e.target.checked) {
            elements.autoRemoveDuplicates.checked = true;
            state.settings.autoRemoveDuplicates = true;
        }
        toggleConfigSection();
    });

    // 配置更新
    elements.startNumber.addEventListener('input', updatePreview);
    elements.suffix.addEventListener('input', handleSuffixInput);

    // 操作按钮
    elements.deleteSelectedBtn.addEventListener('click', removeSelectedFiles);
    elements.restartBtn.addEventListener('click', restart);
    elements.downloadBtn.addEventListener('click', downloadFiles);
}

// 处理文件选择
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    console.log(`📂 File input selected ${files.length} files`);
    files.forEach((file, i) => {
        console.log(`  ${i + 1}. ${file.name} (${file.type})`);
    });
    processFiles(files);
}

// 处理拖拽
function handleDragOver(e) {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
}

function handleDragLeave() {
    elements.uploadArea.classList.remove('dragover');
}

async function handleDrop(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');

    console.log('🎯 Drop event triggered');
    console.log('DataTransfer:', e.dataTransfer);
    console.log('DataTransfer.items:', e.dataTransfer.items);
    console.log('DataTransfer.files:', e.dataTransfer.files);

    const items = e.dataTransfer.items;
    console.log(`📥 Dropped ${items.length} items`);

    // ⚠️ 重要：DataTransferItemList 只能在同步阶段访问
    // 必须先把所有 entries 收集到数组中，然后再进行异步操作
    const entries = [];
    for (let i = 0; i < items.length; i++) {
        console.log(`  Item ${i}: kind=${items[i].kind}, type=${items[i].type}`);
        const entry = items[i].webkitGetAsEntry();
        console.log(`  WebkitEntry ${i}:`, entry);
        if (entry) {
            entries.push(entry);
        } else {
            console.warn(`  ⚠️ Item ${i} has no webkitGetAsEntry`);
        }
    }

    console.log(`✅ Collected ${entries.length} entries, now processing asynchronously...`);

    // 现在可以安全地进行异步操作了
    const droppedFiles = [];
    for (let i = 0; i < entries.length; i++) {
        console.log(`🔄 Processing entry ${i + 1}/${entries.length}`);
        await traverseFileTree(entries[i], droppedFiles);
    }

    console.log(`📁 Found ${droppedFiles.length} total files`);
    droppedFiles.forEach((file, i) => {
        console.log(`  ${i + 1}. ${file.name} (${file.type}, ${file.size} bytes)`);
    });

    const gifFiles = droppedFiles.filter(file => file.type === 'image/gif');
    console.log(`🎬 Filtered to ${gifFiles.length} GIF files`);

    if (gifFiles.length === 0) {
        alert('No GIF files found in the dropped items!');
        return;
    }

    processFiles(gifFiles);
}

// 遍历文件树
async function traverseFileTree(item, files) {
    console.log(`🌲 Traversing: ${item.name}, isFile=${item.isFile}, isDirectory=${item.isDirectory}`);

    if (item.isFile) {
        return new Promise((resolve) => {
            item.file((file) => {
                console.log(`  ✅ Got file: ${file.name} (${file.type}, ${file.size} bytes)`);
                files.push(file);
                resolve();
            }, (error) => {
                console.error(`  ❌ Failed to get file: ${item.name}`, error);
                resolve();
            });
        });
    } else if (item.isDirectory) {
        console.log(`  📂 Entering directory: ${item.name}`);
        const dirReader = item.createReader();
        const entries = await readAllEntries(dirReader);
        console.log(`  📂 Directory ${item.name} contains ${entries.length} entries`);

        for (const entry of entries) {
            await traverseFileTree(entry, files);
        }
    }
}

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
async function processFiles(files) {
    if (files.length === 0) {
        alert('No GIF files found!');
        return;
    }

    console.log(`Processing ${files.length} GIF files`);
    state.originalFiles = files;

    // 如果 Pyodide 还没准备好，静默等待它加载完成
    if (!state.pyodideReady) {
        console.log('⏳ Waiting for Pyodide to load...');
        while (!state.pyodideReady) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log('✅ Pyodide ready, starting workflow...');
    }

    // 开始工作流程
    await startWorkflow();
}

// 开始工作流程
async function startWorkflow() {
    try {
        state.isProcessing = true;
        console.log('🚀 Starting workflow...');

        // 步骤 1: 压缩
        await setStep(2);
        showProgress('Compressing GIFs...', 0);
        state.compressedFiles = await compressGifs(state.originalFiles);
        console.log(`📦 Compressed files: ${state.compressedFiles.length}`);

        // 步骤 2: 去重
        await setStep(3);
        showProgress('Detecting duplicates...', 0);
        state.deduplicatedFiles = await deduplicateGifs(state.compressedFiles);
        console.log(`🔍 After deduplication: ${state.deduplicatedFiles.length}`);

        // 步骤 3: 重命名
        if (state.settings.autoRename) {
            await setStep(4);
            showProgress('Renaming files...', 0);
            state.finalFiles = await renameGifs(state.deduplicatedFiles);
            console.log(`✏️ After rename: ${state.finalFiles.length}`);
        } else {
            state.finalFiles = state.deduplicatedFiles;
            console.log(`📝 Skipped rename. Final files: ${state.finalFiles.length}`);
        }

        // 步骤 4: 显示结果
        await setStep(5);
        console.log(`🎬 Ready to display ${state.finalFiles.length} files`);
        displayResults();

    } catch (error) {
        console.error('❌ Workflow failed:', error);
        alert('Processing failed: ' + error.message);
        restart();
    } finally {
        state.isProcessing = false;
        hideProgress();
    }
}

// 设置当前步骤
async function setStep(step) {
    state.step = step;
    updateStepIndicator();

    // 显示/隐藏相关区域
    if (step >= 4) {
        elements.configSection.style.display = 'block';
    }
}

// 更新步骤指示器
function updateStepIndicator() {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < state.step) {
            step.classList.add('completed');
        } else if (index + 1 === state.step) {
            step.classList.add('active');
        }
    });
}

// 显示进度
function showProgress(text, percent) {
    elements.progressContainer.style.display = 'block';
    elements.progressText.textContent = text;
    elements.progressPercent.textContent = `${percent}%`;
    elements.progressFill.style.width = `${percent}%`;
}

// 隐藏进度
function hideProgress() {
    elements.progressContainer.style.display = 'none';
}

// 更新预览
function updatePreview() {
    const startNum = Math.max(1, Math.min(9999, parseInt(elements.startNumber.value) || 1));
    const rawSuffix = elements.suffix.value;
    const cleanedSuffix = rawSuffix.trim().replace(/[^a-zA-Z0-9-_]/g, '');
    const suffix = cleanedSuffix || 'meme';

    // 只在需要时清理输入（删除非法字符）
    if (rawSuffix !== cleanedSuffix && rawSuffix.trim() !== '') {
        elements.suffix.value = cleanedSuffix;
    }

    const paddedNum = String(startNum).padStart(4, '0');
    elements.preview.textContent = `${paddedNum}_${suffix}.gif`;

    // 如果已经有处理完成的文件，也更新它们的文件名
    if (state.finalFiles.length > 0 && state.settings.autoRename) {
        for (let i = 0; i < state.finalFiles.length; i++) {
            const file = state.finalFiles[i];
            const newNumber = startNum + i;
            const paddedNum = String(newNumber).padStart(4, '0');
            const newName = `${paddedNum}_${suffix}.gif`;

            state.finalFiles[i] = {
                ...file,
                renamedFile: new File([file.compressedFile], newName, { type: 'image/gif' }),
                newName: newName
            };
        }

        // 重新显示结果以更新文件名
        displayResults();
    }
}

// 使用 Pyodide + Pillow 压缩 GIF（保留动画）
async function compressGifs(files) {
    console.log(`🔄 Starting compression for ${files.length} files`);
    const compressedFiles = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📦 Compressing file ${i + 1}/${totalFiles}: ${file.name}`);
        showProgress(`Compressing GIFs... (${i + 1}/${totalFiles})`, Math.round((i + 1) / totalFiles * 100));

        try {
            const compressedFile = await compressSingleGifWithPyodide(file);
            compressedFiles.push({
                originalFile: file,
                compressedFile: compressedFile,
                originalSize: file.size,
                compressedSize: compressedFile.size,
                compressionRatio: ((file.size - compressedFile.size) / file.size * 100).toFixed(1)
            });
            console.log(`✅ Successfully compressed ${file.name}`);
        } catch (error) {
            console.error('❌ Compression failed for file:', file.name, error);
            // 如果压缩失败，使用原文件
            compressedFiles.push({
                originalFile: file,
                compressedFile: file,
                originalSize: file.size,
                compressedSize: file.size,
                compressionRatio: '0.0'
            });
        }

        // 每处理一个文件后让出控制权
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    console.log(`✅ Compression complete. ${compressedFiles.length} files compressed`);
    return compressedFiles;
}

// 使用 Pyodide 压缩单个 GIF
async function compressSingleGifWithPyodide(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const imageData = new Uint8Array(arrayBuffer);

        // 为每个文件生成唯一的临时文件名，避免冲突
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const uniqueId = `${timestamp}_${random}`;

        const isWebP = file.name.toLowerCase().endsWith('.webp');
        const inputFile = isWebP ? `/input_${uniqueId}.webp` : `/input_${uniqueId}.gif`;
        const outputFile = `/output_${uniqueId}.gif`;

        pyodide.FS.writeFile(inputFile, imageData);

        await pyodide.runPythonAsync(`
from PIL import Image

img = Image.open('${inputFile}')
frames = []
durations = []

# 计算缩放尺寸，保持宽高比
max_size = 128
original_width = img.width
original_height = img.height

# 计算缩放比例，保持宽高比
scale = min(max_size / original_width, max_size / original_height)
new_width = int(original_width * scale)
new_height = int(original_height * scale)

# 处理每一帧
try:
    while True:
        frame = img.copy()

        # 保留透明通道，转换为RGBA
        if frame.mode != 'RGBA':
            frame = frame.convert('RGBA')

        # 按比例缩放
        frame = frame.resize((new_width, new_height), Image.Resampling.NEAREST)
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
        p_frame = rgb.convert('P', palette=Image.Palette.ADAPTIVE, colors=255)

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
        '${outputFile}',
        save_all=True,
        append_images=p_frames[1:],
        duration=durations,
        loop=img.info.get('loop', 0),
        disposal=2,
        transparency=255,
        optimize=False
    )
        `);

        const outputData = pyodide.FS.readFile(outputFile);
        const blob = new Blob([outputData], { type: 'image/gif' });

        console.log(`✅ Compressed ${file.name}: ${file.size} → ${blob.size} bytes`);

        // 清理文件系统
        pyodide.FS.unlink(inputFile);
        pyodide.FS.unlink(outputFile);

        return new File([blob], file.name, { type: 'image/gif' });
    } catch (error) {
        console.error('Pyodide compression failed:', error);
        return file;
    }
}

function toggleConfigSection() {
    if (state.settings.autoRename) {
        elements.configSection.style.display = 'block';
    } else {
        elements.configSection.style.display = 'none';
    }
}

// GIF 去重功能
async function deduplicateGifs(compressedFiles) {
    console.log(`🔍 Starting deduplication for ${compressedFiles.length} files`);
    const hashMap = new Map();
    const duplicates = [];
    const uniqueFiles = [];

    for (let i = 0; i < compressedFiles.length; i++) {
        const file = compressedFiles[i].compressedFile;
        showProgress(`Analyzing duplicates... (${i + 1}/${compressedFiles.length})`, Math.round((i + 1) / compressedFiles.length * 100));

        const hash = await calculateImageHash(file);

        if (hashMap.has(hash)) {
            // 发现重复
            console.log(`🔁 Duplicate found: ${compressedFiles[i].originalFile.name}`);
            duplicates.push({
                file: compressedFiles[i],
                hash: hash,
                originalIndex: i
            });
        } else {
            hashMap.set(hash, {
                file: compressedFiles[i],
                hash: hash,
                originalIndex: i
            });
            uniqueFiles.push(compressedFiles[i]);
        }

        // 每处理一个文件后让出控制权
        if (i % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    console.log(`✅ Deduplication complete. Found ${duplicates.length} duplicates out of ${compressedFiles.length} files`);
    console.log(`📊 Unique files: ${uniqueFiles.length}`);

    if (state.settings.autoRemoveDuplicates && duplicates.length > 0) {
        console.log(`🗑️ Auto-removing duplicates. Returning ${uniqueFiles.length} unique files`);
        return uniqueFiles;
    }

    console.log(`📦 Returning all ${compressedFiles.length} files (duplicates not removed)`);
    return compressedFiles;
}

// 计算图像哈希
async function calculateImageHash(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 8;
                canvas.height = 8;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 8, 8);

                const imageData = ctx.getImageData(0, 0, 8, 8);
                const data = imageData.data;

                // 转换为灰度并计算哈希
                let hash = '';
                let prevGray = null;

                for (let i = 0; i < data.length; i += 4) {
                    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);

                    if (prevGray !== null) {
                        hash += gray > prevGray ? '1' : '0';
                    }

                    prevGray = gray;
                }

                resolve(hash);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// GIF 重命名功能
async function renameGifs(files) {
    const renamedFiles = [];
    const startNum = parseInt(elements.startNumber.value) || 1;
    const suffix = elements.suffix.value.trim() || 'meme';

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const newNumber = startNum + i;
        const paddedNum = String(newNumber).padStart(4, '0');
        const newName = `${paddedNum}_${suffix}.gif`;

        renamedFiles.push({
            ...file,
            renamedFile: new File([file.compressedFile], newName, { type: 'image/gif' }),
            newName: newName
        });

        showProgress(`Renaming files... (${i + 1}/${files.length})`, Math.round((i + 1) / files.length * 100));
    }

    return renamedFiles;
}

// 显示结果
function displayResults() {
    console.log(`📺 Displaying results for ${state.finalFiles.length} files`);
    elements.resultsArea.style.display = 'block';
    elements.actionsArea.style.display = 'flex';

    // 清理旧的 blob URLs
    const oldItems = elements.resultsGrid.querySelectorAll('.results-item');
    oldItems.forEach(item => {
        const blobUrl = item.dataset.blobUrl;
        if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
        }
    });

    // 清空并填充结果网格
    elements.resultsGrid.innerHTML = '';

    state.finalFiles.forEach((file, index) => {
        console.log(`➕ Adding result item ${index + 1}: ${file.newName || file.compressedFile.name || file.originalFile.name}`);
        const item = createResultItem(file, index);
        elements.resultsGrid.appendChild(item);
    });

    console.log(`✅ Display complete. ${state.finalFiles.length} items shown`);

    // 显示统计信息
    updateStatsSummary();

    // 在重命名步骤添加预览按钮
    if (state.step === 4) {
        addPreviewButtonToRenameStep();
    }
}

// 创建结果项
function createResultItem(file, index) {
    const item = document.createElement('div');
    item.className = 'results-item';
    item.dataset.index = index;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = state.selectedFiles.has(index);
    // 点击 checkbox 也能切换选中状态
    checkbox.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡到 item

        const isChecked = checkbox.checked;
        if (isChecked) {
            state.selectedFiles.add(index);
            item.classList.add('selected');
        } else {
            state.selectedFiles.delete(index);
            item.classList.remove('selected');
        }

        updateSelectionButtons();
    });

    if (state.selectedFiles.has(index)) {
        item.classList.add('selected');
    }

    const preview = document.createElement('div');
    preview.className = 'result-preview';

    const img = document.createElement('img');
    const url = URL.createObjectURL(file.compressedFile || file.file);
    img.src = url;
    // 不要立即清理 URL，保留给悬停预览使用
    // URL 会在页面卸载时自动清理，或者在移除结果项时清理
    preview.appendChild(img);

    // 保存 URL 引用以便后续清理
    item.dataset.blobUrl = url;

    const name = document.createElement('div');
    name.className = 'result-name';
    name.textContent = file.newName || file.compressedFile.name;

    const size = document.createElement('div');
    size.className = 'result-size';

    // 始终显示体积变化格式：原始大小 → 新大小 (百分比)
    if (file.originalSize && file.compressedSize) {
        const ratio = file.originalSize > 0
            ? ((file.originalSize - file.compressedSize) / file.originalSize * 100).toFixed(1)
            : '0.0';
        const savedSize = file.originalSize - file.compressedSize;

        if (savedSize > 0) {
            // 体积减小（压缩成功）
            size.innerHTML = `<span style="color: var(--muted);">${formatFileSize(file.originalSize)}</span> <span style="color: var(--muted);">→</span> ${formatFileSize(file.compressedSize)} <span style="color: var(--success); font-weight: 600;">(-${ratio}%)</span>`;
        } else if (savedSize < 0) {
            // 体积增大
            size.innerHTML = `<span style="color: var(--muted);">${formatFileSize(file.originalSize)}</span> <span style="color: var(--muted);">→</span> ${formatFileSize(file.compressedSize)} <span style="color: var(--warning); font-weight: 600;">(+${Math.abs(ratio)}%)</span>`;
        } else {
            // 大小相同，显示 0%
            size.innerHTML = `<span style="color: var(--muted);">${formatFileSize(file.originalSize)}</span> <span style="color: var(--muted);">→</span> ${formatFileSize(file.compressedSize)} <span style="color: var(--muted); font-weight: 600;">(0%)</span>`;
        }
    } else {
        // 回退：只显示文件大小
        size.textContent = formatFileSize(file.compressedSize || file.originalSize || file.size);
    }

    item.appendChild(checkbox);
    item.appendChild(preview);
    item.appendChild(name);
    item.appendChild(size);

    // 点击整个卡片来切换选中状态
    item.addEventListener('click', () => {
        const isSelected = state.selectedFiles.has(index);

        if (isSelected) {
            state.selectedFiles.delete(index);
            item.classList.remove('selected');
            checkbox.checked = false;
        } else {
            state.selectedFiles.add(index);
            item.classList.add('selected');
            checkbox.checked = true;
        }

        updateSelectionButtons();
    });

    // 添加悬停预览功能（使用统一模块的托盘图标）
    item.addEventListener('mouseenter', () => {
        if (memeTrayUI && memeTrayUI.taskbar) {
            // 直接使用结果项中已有的 img 元素和它的 src
            memeTrayUI.taskbar.setTrayIcon(img.src, img);
        }
    });

    item.addEventListener('mouseleave', () => {
        if (memeTrayUI && memeTrayUI.taskbar) {
            memeTrayUI.taskbar.clearTrayIcon();
        }
    });

    return item;
}

// 更新统计信息
function updateStatsSummary() {
    const total = state.finalFiles.length;
    const compressed = state.finalFiles.filter(f => f.compressionRatio && parseFloat(f.compressionRatio) > 0).length;
    const duplicates = state.finalFiles.filter(f => f.isDuplicate).length;
    const renamed = state.finalFiles.filter(f => f.newName).length;

    // 创建统计摘要元素
    const existingSummary = document.querySelector('.stats-summary');
    if (existingSummary) {
        existingSummary.remove();
    }

    const summary = document.createElement('div');
    summary.className = 'stats-summary';
    summary.innerHTML = `
        <div class="stat-item">
            <div class="stat-label">Total Files</div>
            <div class="stat-value">${total}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Compressed</div>
            <div class="stat-value">${compressed}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Duplicates</div>
            <div class="stat-value">${duplicates}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Renamed</div>
            <div class="stat-value">${renamed}</div>
        </div>
    `;

    elements.resultsArea.insertBefore(summary, elements.resultsGrid);
}

// 选择操作
function selectAllFiles() {
    state.selectedFiles = new Set();
    state.finalFiles.forEach((_, index) => {
        state.selectedFiles.add(index);
    });
    updateSelectionState();
}

function deselectAllFiles() {
    state.selectedFiles.clear();
    updateSelectionState();
}

async function removeSelectedFiles() {
    if (state.selectedFiles.size === 0) {
        return;
    }

    const selectedArray = Array.from(state.selectedFiles).sort((a, b) => b - a);
    selectedArray.forEach(index => {
        state.finalFiles.splice(index, 1);
    });

    state.selectedFiles.clear();

    // 如果启用了自动重命名，重新编号剩余文件
    if (state.settings.autoRename && state.finalFiles.length > 0) {
        showProgress('Renumbering files...', 0);
        const startNum = parseInt(elements.startNumber.value) || 1;
        const suffix = elements.suffix.value.trim() || 'meme';

        for (let i = 0; i < state.finalFiles.length; i++) {
            const file = state.finalFiles[i];
            const newNumber = startNum + i;
            const paddedNum = String(newNumber).padStart(4, '0');
            const newName = `${paddedNum}_${suffix}.gif`;

            state.finalFiles[i] = {
                ...file,
                renamedFile: new File([file.compressedFile], newName, { type: 'image/gif' }),
                newName: newName
            };
        }

        hideProgress();
    }

    displayResults();
}

function updateSelectionState() {
    const items = document.querySelectorAll('.results-item');
    items.forEach((item, index) => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (state.selectedFiles.has(index)) {
            item.classList.add('selected');
            checkbox.checked = true;
        } else {
            item.classList.remove('selected');
            checkbox.checked = false;
        }
    });
    updateSelectionButtons();
}

function updateSelectionButtons() {
    const hasSelection = state.selectedFiles.size > 0;
    elements.deleteSelectedBtn.disabled = !hasSelection;
}

// 重新开始
function restart() {
    // 清理所有 blob URLs
    const oldItems = elements.resultsGrid.querySelectorAll('.results-item');
    oldItems.forEach(item => {
        const blobUrl = item.dataset.blobUrl;
        if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
        }
    });

    state = {
        step: 1,
        originalFiles: [],
        compressedFiles: [],
        deduplicatedFiles: [],
        finalFiles: [],
        selectedFiles: new Set(),
        isProcessing: false,
        settings: {
            webpSupport: elements.webpToggle.checked,
            autoRemoveDuplicates: elements.autoRemoveDuplicates.checked,
            autoRename: elements.autoRename.checked,
            startNumber: parseInt(elements.startNumber.value) || 1,
            suffix: elements.suffix.value.trim() || 'meme'
        }
    };

    // 重置UI
    elements.uploadArea.style.display = 'block';
    elements.configSection.style.display = 'none';
    elements.progressContainer.style.display = 'none';
    elements.resultsArea.style.display = 'none';
    elements.actionsArea.style.display = 'none';
    elements.fileInput.value = '';

    updateStepIndicator();
    updateSelectionButtons();
}

// 下载文件
async function downloadFiles() {
    if (state.finalFiles.length === 0) {
        alert('No files to download');
        return;
    }

    elements.downloadBtn.disabled = true;

    try {
        const filesToDownload = state.selectedFiles.size > 0
            ? Array.from(state.selectedFiles).map(i => state.finalFiles[i])
            : state.finalFiles;

        // 如果只有一个文件，直接下载，不使用 ZIP
        if (filesToDownload.length === 1) {
            elements.downloadBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Downloading...';

            const file = filesToDownload[0];
            const fileToDownload = file.renamedFile || file.compressedFile || file.file || file;

            const url = URL.createObjectURL(fileToDownload);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileToDownload.name;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);

            console.log(`Successfully downloaded 1 file: ${fileToDownload.name}`);
        } else {
            // 多个文件时使用 ZIP 压缩
            elements.downloadBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Preparing ZIP...';

            const zip = new JSZip();

            for (let i = 0; i < filesToDownload.length; i++) {
                const file = filesToDownload[i];
                const fileToAdd = file.renamedFile || file.compressedFile || file.file || file;
                zip.file(fileToAdd.name, fileToAdd);

                if (i % 10 === 0) {
                    elements.downloadBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Adding ${i + 1}/${filesToDownload.length}...`;
                }
            }

            elements.downloadBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Creating ZIP...';

            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `processed-gifs-${state.settings.suffix}-${new Date().toISOString().slice(0, 10)}.zip`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);

            console.log(`Successfully downloaded ${filesToDownload.length} files`);
        }

    } catch (error) {
        console.error('Download failed:', error);
        alert('Download failed. Please try again.');
    } finally {
        elements.downloadBtn.disabled = false;
        elements.downloadBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download All';
    }
}

// 处理suffix输入
function handleSuffixInput() {
    const rawValue = elements.suffix.value;
    const cleanedValue = rawValue.replace(/[^a-zA-Z0-9-_]/g, '');

    // 如果用户输入了非法字符，实时清理
    if (rawValue !== cleanedValue) {
        elements.suffix.value = cleanedValue;
    }

    // 如果清空输入框，提供视觉反馈
    if (cleanedValue === '') {
        elements.suffix.style.borderColor = 'var(--warning)';
        elements.suffix.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';

        // 3秒后恢复正常样式
        setTimeout(() => {
            elements.suffix.style.borderColor = '';
            elements.suffix.style.backgroundColor = '';
        }, 3000);
    }

    updatePreview();
}

// 添加预览切换按钮到重命名步骤
function addPreviewButtonToRenameStep() {
    // 检查是否已经添加了预览按钮
    const existingPreviewBtn = document.getElementById('previewToggleBtn');
    if (existingPreviewBtn) {
        return;
    }

    // 创建预览按钮
    const previewBtn = document.createElement('button');
    previewBtn.id = 'previewToggleBtn';
    previewBtn.className = 'btn btn-secondary';
    previewBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
        Preview GIFs
    `;
    previewBtn.addEventListener('click', () => {
        if (memeTrayUI && memeTrayUI.preview) {
            memeTrayUI.preview.toggle();
        }
    });

    // 添加到操作按钮区域
    const actionGroup = document.querySelector('.action-group');
    if (actionGroup) {
        actionGroup.insertBefore(previewBtn, actionGroup.firstChild);
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// 初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}