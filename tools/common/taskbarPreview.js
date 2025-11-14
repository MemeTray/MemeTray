/**
 * MemeTray shared taskbar and preview panel module
 * Reproduces the original HTML structure and behavior
 */

/**
 * Initialize the taskbar
 * @param {Object} options - Configuration options
 * @returns {Object} Taskbar API
 */
export function initTaskbar(options = {}) {
  const {
    containerId = 'taskbar',
    showClock = true,
    showTrayIcon = true,
    showSystemIcons = true
  } = options

  let container = document.getElementById(containerId)

  // Create the container when it does not exist
  if (!container) {
    container = document.createElement('div')
    container.id = containerId
    document.body.appendChild(container)
  }

  // Resolve the icon path
  function getIconPath(filename) {
    const currentPath = window.location.pathname
    if (currentPath.includes('/tools/')) {
      return `../../docs/icons/${filename}`
    }
    return `./docs/icons/${filename}`
  }

  // Create the taskbar HTML (matching the original markup)
  container.className = 'taskbar taskbar--light'
  container.innerHTML = `
<div class="taskcont">
<div class="taskright">
${showTrayIcon ? `<div class="tray" id="tray">
<div class="tray-icon" id="trayIcon"></div>
</div>` : ''}
${showSystemIcons ? `<div class="prtclk handcr my-1 px-1 hvlight flex rounded">
<img class="taskIcon" width="16" height="16" src="${getIconPath('wifi.png')}" alt="wifi"/>
<img class="taskIcon" width="16" height="16" src="${getIconPath('audio.png')}" alt="audio"/>
<span class="uicon taskIcon"><span class="battery">
<div class="charger"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24"><path fill="#000" stroke="#f3f3f3" stroke-width="2" d="m8.294 14-1.767 7.068c-.187.746.736 1.256 1.269.701L19.79 9.27A.75.75 0 0 0 19.25 8h-4.46l1.672-5.013A.75.75 0 0 0 15.75 2h-7a.75.75 0 0 0-.721.544l-3 10.5A.75.75 0 0 0 5.75 14h2.544Z"/></svg></div>
<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" fill="none" viewBox="0 0 24 24"><path fill="#000" d="M17 6a3 3 0 0 1 3 3v1h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1v1a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h12Zm-.002 1.5H5a1.5 1.5 0 0 0-1.493 1.356L3.5 9v6a1.5 1.5 0 0 0 1.355 1.493L5 16.5h11.998a1.5 1.5 0 0 0 1.493-1.355l.007-.145V9a1.5 1.5 0 0 0-1.355-1.493l-.145-.007Z"/></svg>
<div class="btFull" style="width:100%"><svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" fill="none" viewBox="0 0 24 24"><path fill="#000" d="M17 6a3 3 0 0 1 3 3v1h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1v1a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h12Zm-.002 1.5H5a1.5 1.5 0 0 0-1.494 1.356L3.5 9v6a1.5 1.5 0 0 0 1.355 1.493L5 16.5h11.998a1.5 1.5 0 0 0 1.493-1.355l.007-.145V9a1.5 1.5 0 0 0-1.355-1.493l-.145-.007ZM6 9h10a1 1 0 0 1 .993.883L17 10v4a1 1 0 0 1-.883.993L16 15H6a1 1 0 0 1-.993-.883L5 14v-4a1 1 0 0 1 .883-.993L6 9h10H6Z"/></svg></div>
</span></span>
</div>` : ''}
${showClock ? `<div class="taskDate m-1 handcr prtclk rounded hvlight">
<div id="clock-time"></div>
<div id="clock-date"></div>
</div>` : ''}
<div class="graybd my-4"></div>
</div>
</div>
  `.trim()

  // Clock update logic
  let clockInterval = null
  if (showClock) {
    const clockTime = document.getElementById('clock-time')
    const clockDate = document.getElementById('clock-date')

    function formatDate(d) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}/${m}/${day}`
    }

    function updateClock() {
      const d = new Date()
      const hh = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      const ss = String(d.getSeconds()).padStart(2, '0')

      if (clockTime) clockTime.textContent = `${hh}:${mm}:${ss}`
      if (clockDate) clockDate.textContent = formatDate(d)
    }

    clockInterval = setInterval(updateClock, 1000)
    updateClock()
  }

  // Tray icon API
  const trayIcon = showTrayIcon ? document.getElementById('trayIcon') : null

  function setTrayIcon(src, sourceImg = null) {
    if (!trayIcon) return
    trayIcon.innerHTML = ''

    // Create a new image element that reuses the same src for sync
    const img = document.createElement('img')
    img.src = src
    img.alt = 'tray'
    img.style.width = '100%'
    img.style.height = '100%'
    img.style.objectFit = 'contain'
    trayIcon.appendChild(img)
  }

  function clearTrayIcon() {
    if (trayIcon) {
      trayIcon.innerHTML = ''
    }
  }

  // Return the API
  return {
    container,
    setTrayIcon,
    clearTrayIcon,
    destroy: () => {
      if (clockInterval) {
        clearInterval(clockInterval)
      }
      if (container && container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }
  }
}

/**
 * Initialize the preview panel
 * @param {Object} options - Configuration options
 * @returns {Object} Preview panel API
 */
export function initPreviewPanel(options = {}) {
  const {
    containerId = 'previewPanel',
    title = 'GIF Preview',
    dragHint = 'Drag & Drop GIF files here',
    pasteHint = 'or paste with Ctrl+V',
    downloadAllText = 'Download All as ZIP',
    clearAllText = 'Clear All',
    onTrayIconHover = null,
    onTrayIconLeave = null
  } = options

  let container = document.getElementById(containerId)

  // Create the container when it does not exist
  if (!container) {
    container = document.createElement('div')
    container.id = containerId
    document.body.appendChild(container)
  }

  // Create the preview panel HTML (matching the original markup)
  container.className = 'preview-panel'
  container.style.display = 'none'
  container.innerHTML = `
<div class="preview-header">
<div class="preview-header-left">
<h3 id="previewPanelTitle">${title}</h3>
<div class="preview-header-actions" id="previewActions" style="display: none;">
<button class="preview-header-btn" id="downloadAllBtn" title="${downloadAllText}">
<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
<polyline points="7 10 12 15 17 10"></polyline>
<line x1="12" y1="15" x2="12" y2="3"></line>
</svg>
</button>
<button class="preview-header-btn" id="clearAllBtn" title="${clearAllText}">
<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
<path d="M3 6h18"></path>
<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
</svg>
</button>
</div>
</div>
<button class="preview-close" id="previewClose" aria-label="Close Preview">×</button>
</div>
<div class="preview-upload-area" id="previewUploadArea">
<div class="upload-hint">
<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
<polyline points="17 8 12 3 7 8"></polyline>
<line x1="12" y1="3" x2="12" y2="15"></line>
</svg>
<p id="previewDragText">${dragHint}</p>
<p class="upload-hint-sub" id="previewPasteText">${pasteHint}</p>
</div>
</div>
<div class="preview-gallery" id="previewGallery"></div>
  `.trim()

  const closeBtn = document.getElementById('previewClose')
  const uploadArea = document.getElementById('previewUploadArea')
  const gallery = document.getElementById('previewGallery')
  const actionsDiv = document.getElementById('previewActions')
  const downloadAllBtn = document.getElementById('downloadAllBtn')
  const clearAllBtn = document.getElementById('clearAllBtn')

  let previewFiles = []
  let dragDropInitialized = false

  // Toggle visibility
  function toggle() {
    const isVisible = container.style.display !== 'none'
    container.style.display = isVisible ? 'none' : 'flex'

    // Initialize drag-and-drop support on first open
    if (!isVisible && !dragDropInitialized) {
      initDragDrop()
      dragDropInitialized = true
    }
  }

  function show() {
    container.style.display = 'flex'
    if (!dragDropInitialized) {
      initDragDrop()
      dragDropInitialized = true
    }
  }

  function hide() {
    container.style.display = 'none'
  }

  // Initialize drag-and-drop support
  async function initDragDrop() {
    try {
      const { setupDragAndDrop, setupPasteSupport } = await import('./fileUploadHelpers.js')

      setupDragAndDrop({
        uploadArea: uploadArea,
        onFilesDropped: handlePreviewFiles,
        acceptType: 'image/gif'
      })

      setupPasteSupport({
        onFilesPasted: handlePreviewFiles,
        acceptType: 'image/gif'
      })

    } catch (err) {
      console.warn('Failed to load file upload helpers:', err)
    }
  }

  // Handle preview files
  function handlePreviewFiles(files) {
    console.log(`处理 ${files.length} 个文件`)

    files.forEach((fileObj, index) => {
      const { file, path } = fileObj

      // Check the file type
      if (!file.type.startsWith('image/')) {
        console.warn(`跳过非图片文件: ${file.name} (${file.type})`)
        return
      }

      const url = URL.createObjectURL(file)

      const previewItem = {
        id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        path,
        url,
        name: file.name,
        size: file.size
      }

      previewFiles.push(previewItem)
      renderPreviewItem(previewItem)
      console.log(`添加文件: ${file.name}`)
    })

    // Hide the upload hint and show bulk actions
    if (previewFiles.length > 0) {
      uploadArea.style.display = 'none'
      if (actionsDiv) {
        actionsDiv.style.display = 'flex'
      }
    }

    console.log(`文件处理完成，当前预览文件总数: ${previewFiles.length}`)
  }

  // Render preview items
  function renderPreviewItem(item) {
    const div = document.createElement('div')
    div.className = 'preview-item'
    div.dataset.id = item.id

    const img = document.createElement('img')
    img.src = item.url
    img.alt = item.name
    img.loading = 'lazy'

    const info = document.createElement('div')
    info.className = 'preview-item-info'
    info.textContent = `${item.name} (${formatFileSize(item.size)})`

    const removeBtn = document.createElement('button')
    removeBtn.className = 'preview-item-remove'
    removeBtn.innerHTML = '×'
    removeBtn.title = 'Remove'
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      removePreviewItem(item.id)
    })

    // Show the preview on the tray icon when hovering
    div.addEventListener('mouseenter', () => {
      if (onTrayIconHover) {
        onTrayIconHover(item.url, img)
      }
    })

    div.addEventListener('mouseleave', () => {
      if (onTrayIconLeave) {
        onTrayIconLeave()
      }
    })

    div.appendChild(img)
    div.appendChild(info)
    div.appendChild(removeBtn)
    gallery.appendChild(div)
  }

  // Remove preview items
  function removePreviewItem(id) {
    const index = previewFiles.findIndex(item => item.id === id)
    if (index > -1) {
      const item = previewFiles[index]
      URL.revokeObjectURL(item.url)
      previewFiles.splice(index, 1)

      const element = gallery.querySelector(`[data-id="${id}"]`)
      if (element) {
        element.remove()
      }

      // If no files remain, show the upload hint and hide bulk actions
      if (previewFiles.length === 0) {
        uploadArea.style.display = 'block'
        if (actionsDiv) {
          actionsDiv.style.display = 'none'
        }
      }
    }
  }

  // Format the file size
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Batch download as ZIP
  async function downloadAllAsZip() {
    if (previewFiles.length === 0) return

    // Disable the download button and show loading state
    const originalTitle = downloadAllBtn ? downloadAllBtn.title : ''
    if (downloadAllBtn) {
      downloadAllBtn.disabled = true
      downloadAllBtn.style.opacity = '0.6'
      downloadAllBtn.title = 'Downloading...'
    }

    try {
      // Dynamically load the JSZip library
      let JSZip
      if (typeof window.JSZip === 'undefined') {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
        document.head.appendChild(script)

        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
        })

        JSZip = window.JSZip
      } else {
        JSZip = window.JSZip
      }

      if (!JSZip) {
        throw new Error('JSZip library failed to load')
      }

      const zip = new JSZip()

      // Add all files to the ZIP archive
      for (const item of previewFiles) {
        try {
          const response = await fetch(item.url)
          if (!response.ok) {
            throw new Error(`Failed to fetch ${item.name}`)
          }
          const blob = await response.blob()
          zip.file(item.name, blob)
        } catch (fileErr) {
          console.warn(`跳过文件 ${item.name}:`, fileErr)
        }
      }

      // Verify that at least one file was added
      if (Object.keys(zip.files).length === 0) {
        throw new Error('No files were successfully added to the ZIP')
      }

      // Generate the ZIP archive
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })

      // Trigger the ZIP download
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `MemeTray-Preview-${new Date().toISOString().slice(0, 10)}.zip`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)

      console.log(`成功下载 ${Object.keys(zip.files).length} 个文件`)

    } catch (err) {
      console.error('下载失败:', err)

      // Offer a fallback download option
      const fallbackDownload = confirm(`ZIP 打包下载失败: ${err.message}\n\n是否要逐个下载文件？`)
      if (fallbackDownload) {
        downloadFilesIndividually()
      }
    } finally {
      // Restore the download button state
      if (downloadAllBtn) {
        downloadAllBtn.disabled = false
        downloadAllBtn.style.opacity = '1'
        downloadAllBtn.title = originalTitle
      }
    }
  }

  // Fallback download strategy: download files one by one
  async function downloadFilesIndividually() {
    for (let i = 0; i < previewFiles.length; i++) {
      const item = previewFiles[i]
      try {
        const response = await fetch(item.url)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = item.name
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(url)

        // Add a delay to avoid browsers blocking multiple downloads
        if (i < previewFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (err) {
        console.warn(`下载文件 ${item.name} 失败:`, err)
      }
    }
  }

  // Clear every file entry
  function clearAllFiles() {
    if (previewFiles.length === 0) return

    // Revoke every blob URL
    previewFiles.forEach(item => {
      URL.revokeObjectURL(item.url)
    })

    // Reset arrays and UI elements
    previewFiles = []
    gallery.innerHTML = ''

    // Show the upload hint and hide bulk actions
    uploadArea.style.display = 'block'
    if (actionsDiv) {
      actionsDiv.style.display = 'none'
    }
  }

  // Event listeners
  closeBtn.addEventListener('click', hide)

  if (downloadAllBtn) {
    downloadAllBtn.addEventListener('click', downloadAllAsZip)
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllFiles)
  }

  // Close the panel when clicking outside
  document.addEventListener('click', (e) => {
    if (container.style.display !== 'none' &&
        !container.contains(e.target)) {
      // Check if the trigger button was clicked
      const triggerBtn = document.getElementById('previewToggle')
      if (triggerBtn && triggerBtn.contains(e.target)) {
        return
      }
      hide()
    }
  })

  // Return the API
  return {
    container,
    toggle,
    show,
    hide,
    addFiles: handlePreviewFiles,
    clearAll: clearAllFiles,
    getFiles: () => previewFiles,
    destroy: () => {
      // Revoke every blob URLs
      previewFiles.forEach(item => {
        URL.revokeObjectURL(item.url)
      })
      previewFiles = []

      if (container && container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }
  }
}

/**
 * Initialize both the taskbar and preview panel with integration
 * @param {Object} options - Configuration options
 * @returns {Object} Object containing both taskbar and preview APIs
 */
export function initMemeTrayUI(options = {}) {
  const {
    taskbar: taskbarOptions = {},
    preview: previewOptions = {}
  } = options

  // Initialize the taskbar
  const taskbar = initTaskbar(taskbarOptions)

  // Initialize the preview panel and integrate with the tray icon
  const preview = initPreviewPanel({
    ...previewOptions,
    onTrayIconHover: (url, img) => {
      taskbar.setTrayIcon(url, img)
    },
    onTrayIconLeave: () => {
      taskbar.clearTrayIcon()
    }
  })

  return {
    taskbar,
    preview
  }
}
