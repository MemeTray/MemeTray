// Import the shared taskbar and preview modules
import { initMemeTrayUI } from '../tools/common/taskbarPreview.js'

let sections=window.MEMETRAY_SECTIONS||[]
const GIF_BASE=location.pathname.includes('/docs/')?'../gifs/':'./gifs/'
const container=document.getElementById("container")
const sectionTiles=document.getElementById("sectionTiles")
const sidebar=document.getElementById('sidebar')
const mainPane=document.getElementById('mainPane')
const desktop=document.getElementById('desktop')
const explorer=document.getElementById('explorer')
const explorerTitlebar=document.getElementById('explorerTitlebar')
const explorerContent=document.getElementById('explorerContent')
const btnBack=document.getElementById('btnBack')
const windowTitle=document.getElementById('windowTitle')
const breadcrumbs=document.getElementById('breadcrumbs')
// Remove the copy-path button
const resizeHandles=[...document.querySelectorAll('#explorer .resize-handle')]
const sectionSelect={value:'all'}
const infiniteLoader=document.getElementById('infiniteLoader')

const ITEMS_PER_PAGE = 50
let currentPage = {} // { [sectionKey]: pageNumber }
let navState={view:'root',currentKey:null}
const WINDOWS_ROOT='此电脑'
const CATIME_PATH='%LOCALAPPDATA%\\Catime\\animations'

// Multi-language support
let currentLang = localStorage.getItem('memetray.lang') || 'en'
const translations = {
  zh: {
    loading: '加载中...',
    backBtn: '返回',
    backBtnTitle: '返回',
    backTop: '返回顶部',
    sidebarTitle: '分组',
    sidebarCollapse: '折叠侧边栏',
    sidebarExpand: '展开侧边栏',
    legalCompact: '法律 / 免责声明',
    legalFull: '<strong>版权声明</strong>：本网站展示的 GIF 资源均来源于公开互联网，版权归原作者或权利人所有；本站仅用于学习、研究与技术交流，严禁任何商业或非法用途。如您认为内容侵权，请联系我们，我们将在核实后立即移除。<div class="legal-links"><a href="https://github.com/MemeTray/MemeTray/issues" target="_blank" rel="noopener">提交 Issue</a><span>·</span><a href="mailto:vladelaina@gmail.com">vladelaina@gmail.com</a></div>',
    githubLabel: 'GitHub',
    toolLabel: 'Animation Compression',
    langLabel: '切换语言 / Switch Language',
    previewLabel: 'GIF 预览',
    previewTitle: 'GIF 预览',
    previewDragHint: '拖拽 GIF 文件到这里',
    previewPasteHint: '或使用 Ctrl+V 粘贴',
    downloadAllText: '下载全部为 ZIP',
    clearAllText: '清空全部',
    openRepository: '打开 GitHub 仓库',
    openConfig: '打开配置文件'
  },
  en: {
    loading: 'Loading',
    backBtn: 'Back',
    backBtnTitle: 'Back',
    backTop: 'Back to Top',
    sidebarTitle: 'Groups',
    sidebarCollapse: 'Collapse Sidebar',
    sidebarExpand: 'Expand Sidebar',
    legalCompact: 'Legal / Disclaimer',
    legalFull: '<strong>Copyright Notice</strong>: All GIF resources displayed on this website are sourced from the public Internet, and the copyright belongs to the original author or rights holder. This site is for learning, research and technical exchange only, and any commercial or illegal use is strictly prohibited. If you believe the content infringes on your rights, please contact us and we will remove it immediately after verification.<div class="legal-links"><a href="https://github.com/MemeTray/MemeTray/issues" target="_blank" rel="noopener">Submit Issue</a><span>·</span><a href="mailto:vladelaina@gmail.com">vladelaina@gmail.com</a></div>',
    githubLabel: 'GitHub',
    toolLabel: 'Animation Compression',
    langLabel: 'Switch Language / 切换语言',
    previewLabel: 'GIF Preview',
    previewTitle: 'GIF Preview',
    previewDragHint: 'Drag & Drop GIF files here',
    previewPasteHint: 'or paste with Ctrl+V',
    downloadAllText: 'Download All as ZIP',
    clearAllText: 'Clear All',
    openRepository: 'Open GitHub Repository',
    openConfig: 'Open Config File'
  }
}

// Allow URL parameters to override and persist the language (?lang=en or ?lang=zh)
try{
  const sp = new URLSearchParams(location.search)
  const q = (sp.get('lang') || sp.get('language') || '').trim()
  if(q==='en' || q==='zh'){
    currentLang = q
    try{ localStorage.setItem('memetray.lang', q) }catch(_){/* ignore */}
  }
}catch(_){/* ignore */}

function t(key) {
  return translations[currentLang][key] || key
}

function updateLanguage() {
  const langIcon = document.getElementById('langIcon')
  if (langIcon) {
    langIcon.textContent = currentLang === 'zh' ? 'EN' : '中文'
  }
  
  // Update action button labels
  if (btnBack) {
    btnBack.setAttribute('aria-label', t('backBtn'))
    btnBack.setAttribute('title', t('backBtnTitle'))
  }
  
  // Update the back-to-top button
  const backTopBtn = document.getElementById('backTop')
  if (backTopBtn) {
    backTopBtn.setAttribute('aria-label', t('backTop'))
    backTopBtn.setAttribute('title', t('backTop'))
  }
  
  // Update the top link labels
  const toolLink = document.getElementById('toolLink')
  if (toolLink) {
    toolLink.setAttribute('aria-label', t('toolLabel'))
    toolLink.setAttribute('title', t('toolLabel'))
  }
  
  const githubLink = document.querySelector('a[href="https://github.com/MemeTray/MemeTray"]')
  if (githubLink) {
    githubLink.setAttribute('aria-label', t('githubLabel'))
    githubLink.setAttribute('title', t('githubLabel'))
  }
  
  const langToggle = document.getElementById('langToggle')
  if (langToggle) {
    langToggle.setAttribute('aria-label', t('langLabel'))
    langToggle.setAttribute('title', t('langLabel'))
  }
  
  // Update preview button labels
  const previewToggle = document.getElementById('previewToggle')
  if (previewToggle) {
    previewToggle.setAttribute('aria-label', t('previewLabel'))
    previewToggle.setAttribute('title', t('previewLabel'))
  }
  
  // Update the sidebar title
  const sideTitle = sidebar && sidebar.querySelector('.side-title')
  if (sideTitle) {
    sideTitle.textContent = t('sidebarTitle')
  }
  
  // Update the sidebar collapse toggle
  const sidebarToggle = sidebar && sidebar.querySelector('.sidebar-toggle')
  if (sidebarToggle) {
    const isCollapsed = sidebar.classList.contains('sidebar--collapsed')
    sidebarToggle.setAttribute('aria-label', isCollapsed ? t('sidebarExpand') : t('sidebarCollapse'))
    sidebarToggle.setAttribute('title', isCollapsed ? t('sidebarExpand') : t('sidebarCollapse'))
  }
  
  // Update the legal disclaimer content
  const lf = document.getElementById('legalFooter')
  if (lf) {
    if (lf.classList.contains('legal--compact')) {
      lf.innerHTML = `<a class="legal-link" href="https://github.com/MemeTray/MemeTray/blob/main/DISCLAIMER.md" target="_blank" rel="noopener">${t('legalCompact')}</a>`
    } else {
      lf.innerHTML = t('legalFull')
    }
  }
  
  // Update text inside the preview panel
  const previewPanelTitle = document.getElementById('previewPanelTitle')
  if (previewPanelTitle) {
    previewPanelTitle.textContent = t('previewTitle')
  }
  
  const previewDragText = document.getElementById('previewDragText')
  if (previewDragText) {
    previewDragText.textContent = t('previewDragHint')
  }
  
  const previewPasteText = document.getElementById('previewPasteText')
  if (previewPasteText) {
    previewPasteText.textContent = t('previewPasteHint')
  }
  
  // Update tooltips for bulk action buttons
  const downloadAllBtn = document.getElementById('downloadAllBtn')
  if (downloadAllBtn) {
    downloadAllBtn.setAttribute('title', t('downloadAllText'))
  }
  
  const clearAllBtn = document.getElementById('clearAllBtn')
  if (clearAllBtn) {
    clearAllBtn.setAttribute('title', t('clearAllText'))
  }
  
  // Persist the selected language
  localStorage.setItem('memetray.lang', currentLang)
}

// Language switching
const langToggle = document.getElementById('langToggle')
if (langToggle) {
  langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'zh' ? 'en' : 'zh'
    updateLanguage()
  })
}

// Desktop background support (URL parameter first, fallback to localStorage, otherwise random from API pool)
;(async function initBackground(){
  try{
    const p=new URLSearchParams(location.search)
    const key='memetray.bg'
    const fromUrlRaw=p.get('bg')||p.get('background')||p.get('wallpaper')
    const fromUrl=fromUrlRaw && fromUrlRaw.trim()
    const savedRaw=localStorage.getItem(key)
    const saved=savedRaw && savedRaw.trim()
    
    // Dynamically import the random wallpaper configuration
    let randomApi
    try{
      const {getRandomWallpaper} = await import('../tools/common/backgroundConfig.js')
      randomApi = getRandomWallpaper()
    }catch(_){
      // Fallback: inline configuration if the module import fails
      const apiPool=[
        'https://t.alcy.cc/ycy','https://t.alcy.cc/moez','https://t.alcy.cc/ysz',
        'https://t.alcy.cc/pc','https://t.alcy.cc/moe','https://t.alcy.cc/fj',
        'https://t.alcy.cc/bd','https://t.alcy.cc/ys','https://t.alcy.cc/lai'
      ]
      randomApi=apiPool[Math.floor(Math.random()*apiPool.length)]
    }
    
    const val=fromUrl||saved||randomApi

    const isValid=(u)=>{
      if(!u) return false
      const s=String(u).trim()
      if(!s) return false
      if(s==='none'||s==='null'||s==='undefined') return false
      if(s.startsWith('data:')||s.startsWith('blob:')) return true
      if(/\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(s)) return true
      // Allow common relative/absolute/http(s) paths without synchronous validation
      return /^(https?:|\/|\.\/|\.\.\/)/.test(s)
    }

    if(desktop && isValid(val)){
      desktop.style.backgroundImage=`url("${val}")`
    }
    // Persist only when the URL is valid
    if(fromUrl && isValid(fromUrl)){
      localStorage.setItem(key,fromUrl)
    }
  }catch(_){}
})()

function createSection(title,count){const sec=document.createElement('div');sec.className='section';const h2=document.createElement('h2');h2.textContent=count?`${title} (${count})`:title;const grid=document.createElement('div');grid.className='gallery';sec.appendChild(h2);sec.appendChild(grid);
  return {sec,grid}}

function renderOneSection(secObj, page = 1){
  const {key,title,dir,files}=secObj
  const list=files.slice().reverse()

  const start = (page - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  const pagedFiles = list.slice(start, end)
  if (pagedFiles.length === 0) {
    return null // No more items to render for this page
  }

  // Find existing or create new section
  let sec = container.querySelector(`.section[data-key="${key}"]`)
  let grid
  if (!sec) {
    const newSection = createSection(title, list.length)
    sec = newSection.sec
    grid = newSection.grid
    sec.dataset.key = key
    // Folder view does not require the header above the content
    if(navState.view==='folder'){
      const h2=sec.querySelector('h2'); if(h2) h2.remove()
    }
    container.appendChild(sec)
  } else {
    grid = sec.querySelector('.gallery')
    // Remove the header when a section already exists
    if(navState.view==='folder'){
      const h2=sec.querySelector('h2'); if(h2) h2.remove()
    }
  }

  // Replace skeleton placeholders with a fade-in effect
  
  // Use baseUrl when available, otherwise fall back to a local path
  const baseUrl = secObj.baseUrl || (GIF_BASE + dir + "/")

  for(const id of pagedFiles){
    const href=baseUrl+id
    const a=document.createElement("a")
    a.href="#"
    a.style.cursor="pointer"
    a.addEventListener("click", async (e)=>{
      e.preventDefault()
      try{
        const response = await fetch(href)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = id
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }catch(err){
        console.error("下载失败:",err)
        alert("下载失败，请重试")
      }
    })
    const thumb=document.createElement("div"); thumb.className="thumb"
    const img=document.createElement("img");
    img.src=href; img.alt=id; img.loading="lazy"; img.decoding="async"
    img.classList.add('fade-in')
    img.addEventListener('load', ()=>{ img.classList.add('is-loaded') }, { once:true })
    img.addEventListener('error', ()=>{ console.warn("图片加载失败:",href); a.style.display="none" }, { once:true })
    thumb.appendChild(img)
    a.appendChild(thumb)
    a.addEventListener("mouseenter",()=>{setTrayIcon(href, img)})
    a.addEventListener("mouseleave",()=>{clearTrayIcon()})
    grid.appendChild(a)
  }
  currentPage[key] = page
  return sec
}


function preloadSectionImages(secObj,max=48){const {dir,files,baseUrl}=secObj;const list=files.slice(0,max);const urlBase=baseUrl||(GIF_BASE+dir+"/");for(const id of list){const img=new Image();img.decoding='async';img.loading='eager';img.src=urlBase+id}}
function preloadOthers(others){let i=0;const tick=()=>{if(i>=others.length)return;preloadSectionImages(others[i++]);if('requestIdleCallback'in window){requestIdleCallback(tick,{timeout:200})}else{setTimeout(tick,0)}};tick()}

function buildItems(){
  const selected = sectionSelect.value

  // Hide all sections first
  const sectionsElements = container.querySelectorAll('.section')
  sectionsElements.forEach(sec => {
    sec.style.display = 'none'
  })

  if (selected === 'all') {
    // Show all sections and render if not already present
    sections.forEach(secObj => {
      const existingSec = container.querySelector(`.section[data-key="${secObj.key}"]`)
      if (existingSec) {
        existingSec.style.display = 'block'
      } else {
        renderOneSection(secObj, 1)
      }
    })
  } else {
    const section = sections.find(s => s.key === selected)
    if (section) {
      const existingSec = container.querySelector(`.section[data-key="${selected}"]`)
      if (existingSec) {
        existingSec.style.display = 'block'
      } else {
        renderOneSection(section, 1)
      }
    }
    const others = sections.filter(s => s.key !== selected)
    preloadOthers(others)
  }
}
// Use the top grid as the primary entry point

// Toggle between views
function enterRoot(){
  navState.view='root'; navState.currentKey=null
  const titleTextEl=document.getElementById('windowTitleText')
  if(titleTextEl) titleTextEl.textContent='MemeTray'
  if(btnBack){ btnBack.disabled=true }
  if(sectionTiles) sectionTiles.style.display='grid'
  if(container) container.style.display='none'
  if(sidebar) sidebar.style.display='none'
  if(container) container.classList.remove('container--folder')
  if(infiniteLoader){infiniteLoader.style.display='none'}
  renderBreadcrumbs()
  updateBackTopVisibility()
  // Clear the URL hash
  if(history.replaceState){ history.replaceState(null,null,' ') }
  else{ location.hash='' }
    // Root view: show the bottom-right pill
  try{
    const lf=document.getElementById('legalFooter')
    if(lf){
      lf.classList.add('legal--compact')
      lf.innerHTML=`<a class="legal-link" href="https://github.com/MemeTray/MemeTray/blob/main/DISCLAIMER.md" target="_blank" rel="noopener">${t('legalCompact')}</a>`
    }
  }catch(_){/* ignore */}
}

function enterFolder(key){
  navState.view='folder'; navState.currentKey=key
  const titleTextEl=document.getElementById('windowTitleText')
  if(titleTextEl) titleTextEl.textContent=key
  if(btnBack){ btnBack.disabled=false }
  if(sectionTiles) sectionTiles.style.display='none'
  if(container) container.style.display='block'
  if(sidebar) sidebar.style.display='flex'
  // Ensure the sidebar highlight matches the current group
  highlightSidebar(key)
  if(container) container.classList.add('container--folder')
  sectionSelect.value=key
  buildItems()
  // Update the URL hash to preserve state
  if(history.replaceState){ history.replaceState(null,null,'#'+encodeURIComponent(key)) }
  else{ location.hash=key }
  // As a safeguard, clear all content section headers after entering a folder
  try{
    if(container){
      container.querySelectorAll('.section h2').forEach(h=>h.remove())
    }
  }catch(_){/* ignore */}
  if(explorerContent){ explorerContent.scrollTo({top:0,behavior:'smooth'}) }
  renderBreadcrumbs()
  updateBackTopVisibility()
  // In folder view, hide the pill to avoid duplicate disclaimers
  try{
    const lf=document.getElementById('legalFooter')
    if(lf){
      lf.classList.remove('legal--compact')
      // In folder view, pin the full disclaimer to the bottom
      lf.innerHTML=t('legalFull')
    }
  }catch(_){/* ignore */}
}

function renderBreadcrumbs(){
  const titleTextEl=document.getElementById('windowTitleText')
  // Show only the MemeTray root, hiding "This PC"
  const parts = navState.view==='folder' ? ['MemeTray',navState.currentKey] : ['MemeTray']
  // 1) Clear and render the title text (same row as the icon)
  if(titleTextEl){
    titleTextEl.innerHTML=''
    parts.forEach((name,idx)=>{
      const isLast=idx===parts.length-1
      const span=document.createElement('span'); span.className='crumb ' + (isLast?'crumb--current':'crumb--link')
      span.textContent=name
      
      // Attach click handlers
      if(!isLast){
        span.addEventListener('click',(e)=>{
          e.stopPropagation() // Prevent events from bubbling to the window title
          if(idx===0) return enterRoot()
          if(idx===1) return enterFolder(navState.currentKey)
        })
      } else if(isLast && idx === 1 && navState.view === 'folder') {
        // Clicking the category name opens the corresponding GitHub folder
        span.style.cursor = 'pointer'
        span.title = t('openRepository')
        span.addEventListener('click', (e) => {
          e.stopPropagation() // Prevent events from bubbling to the window title
          const sec = sections && sections.find(s => s.key === navState.currentKey)
          if (sec && sec.repository) {
            // Navigate to the repository folder, e.g., /tree/main/maomaochong
            const folderUrl = `${sec.repository}/tree/main/${sec.key}`
            window.open(folderUrl, '_blank', 'noopener,noreferrer')
          }
        })
      }
      
      titleTextEl.appendChild(span)
      if(idx<parts.length-1){
        const sep=document.createElement('span'); sep.className='sep sep--chev'; sep.textContent='›'
        titleTextEl.appendChild(sep)
      }
    })
    // Append the item count (n) at the end of folder view
    if(navState.view==='folder' && navState.currentKey){
      const sec=sections && sections.find(s=>s.key===navState.currentKey)
      if(sec && Array.isArray(sec.files)){
        const cnt=document.createElement('span')
        cnt.className='count-badge'
        cnt.textContent=String(sec.files.length)
        // Prevent bubbling so the count label is not clickable
        cnt.addEventListener('click', (e) => {
          e.stopPropagation()
        })
        titleTextEl.appendChild(cnt)
      }
    }
  }
  // 2) Clear content breadcrumbs to avoid duplicates
  if(breadcrumbs){
    breadcrumbs.innerHTML=''
  }
}

// Button handlers
btnBack&&btnBack.addEventListener('click',()=>{
  if(navState.view==='folder') enterRoot()
})

// Window title click behavior
windowTitle&&windowTitle.addEventListener('click',()=>{
  if(navState.view==='root') {
    // When at the root, clicking MemeTray opens GitHub
    window.open('https://github.com/MemeTray/MemeTray', '_blank', 'noopener,noreferrer')
  } else if(navState.view==='folder') {
    // When in a subdirectory, clicking MemeTray returns home
    enterRoot()
  }
})

// Copy-path button removed

function fileName(dir,i){return String(i).padStart(4,'0')+"_"+dir+".gif"}
// Network probing removed; counts now come solely from sections.json

async function fetchSections(){
  if(sections && sections.length){buildItems();return}
  try{
    // Use the centralized sections.json configuration
    console.log('Loading sections.json...')
    const sectionsResponse = await fetch("./sections.json", {cache: 'no-store'})

    if (!sectionsResponse.ok) {
      throw new Error(`Failed to load sections.json: ${sectionsResponse.status}`)
    }

    const sectionsData = await sectionsResponse.json()
    console.log('sections.json loaded successfully:', sectionsData)

    // Convert data into the required format
    sections = Object.entries(sectionsData.sections)
      .map(([key, data]) => {
        const count = Number.isFinite(Number(data.count)) ? Number(data.count) : 0
        const files = []
        for(let i=1; i<=count; i++){
          files.push(fileName(key, i))
        }
        return {
          key: key,
          title: data.title || key,
          dir: key,
          files: files,
          baseUrl: data.cdnBase,
          repository: data.repository,
          count: count
        }
      })
      .filter(s => s.count > 0)

    console.log(`Loaded ${sections.length} sections from sections.json`)
    if (sections.length > 0) {
      sectionSelect.value = sections[0].dir
      buildItems()
    }

    // Sections have already been constructed above

    // Build the top grid selector (preview defaults to 0001_group.gif)
    if(sectionTiles){
      sectionTiles.innerHTML=''
      for(const {dir,title,files,baseUrl} of sections){
        const t=document.createElement('div');t.className='tile';t.dataset.section=dir
        const th=document.createElement('div');th.className='tile-thumb'
        const urlBase=baseUrl||(GIF_BASE+dir+'/')
        const img=document.createElement('img');const first=urlBase+fileName(dir,1)
        img.src=first; img.alt=title; img.loading='lazy'; img.decoding='async'
        th.appendChild(img)
        const tt=document.createElement('div');tt.className='tile-title';tt.textContent=title
        t.appendChild(th);t.appendChild(tt)
        t.addEventListener('mouseenter',()=>{setTrayIcon(first, img)})
        t.addEventListener('mouseleave',()=>{clearTrayIcon()})
        t.addEventListener('click',()=>{enterFolder(dir)})
        sectionTiles.appendChild(t)
      }
    }

    // Build the left sidebar for quick group switching
    if(sidebar){
      sidebar.innerHTML=''
      // Add the title and collapse button
      const header=document.createElement('div'); header.className='side-header'
      const title=document.createElement('div'); title.className='side-title'; title.textContent=t('sidebarTitle')
      const toggleBtn=document.createElement('button'); toggleBtn.className='sidebar-toggle'; toggleBtn.setAttribute('aria-label',t('sidebarCollapse')); toggleBtn.title=t('sidebarCollapse')
      toggleBtn.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" fill="currentColor"></path></svg>'
      header.appendChild(title)
      header.appendChild(toggleBtn)
      sidebar.appendChild(header)
      
      // Collapse button behavior
      toggleBtn.addEventListener('click',toggleSidebar)
      
      // Restore the sidebar state (collapsed by default)
      try{
        const saved=localStorage.getItem('memetray.sidebar.collapsed')
        // Default to collapsed when the user has no preference
        // Respect the user preference when available
        const collapsed = saved === null ? true : saved === 'true'
        if(collapsed){
          sidebar.classList.add('sidebar--collapsed')
          toggleBtn.setAttribute('title',t('sidebarExpand'))
        }
      }catch(_){
        // Fall back to collapsed when localStorage access fails
        sidebar.classList.add('sidebar--collapsed')
        toggleBtn.setAttribute('title',t('sidebarExpand'))
      }
      
      for(const {dir,baseUrl} of sections){
        const item=document.createElement('div'); item.className='side-item'; item.dataset.section=dir
        const th=document.createElement('div'); th.className='thumb'
        const urlBase=baseUrl||(GIF_BASE+dir+'/')
        const preview=urlBase+fileName(dir,1)
        item.dataset.preview=preview
        const img=document.createElement('img'); img.src=preview; img.alt=dir; img.loading='lazy'; img.decoding='async'
        th.appendChild(img)
        const label=document.createElement('div'); label.textContent=dir
        item.appendChild(th); item.appendChild(label)
        item.addEventListener('click',()=>{enterFolder(dir); highlightSidebar(dir)})
        sidebar.appendChild(item)
      }
      // Sidebar hover preview via event delegation
      const onOver=(e)=>{
        const el=e.target && e.target.closest && e.target.closest('.side-item')
        if(!el || !sidebar.contains(el)) return
        const p=el.dataset && el.dataset.preview
        const sourceImg=el.querySelector('img')
        if(p) setTrayIcon(p, sourceImg)
      }
      const onOut=(e)=>{
        const from=e.target && e.target.closest && e.target.closest('.side-item')
        const to=e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.side-item')
        if(from && from!==to) clearTrayIcon()
      }
      sidebar.addEventListener('mouseover', onOver)
      sidebar.addEventListener('mouseout', onOut)
      if (sections.length > 0) {
        highlightSidebar(sections[0].dir)
      }
    }

    // 3) Preload the first 48 items for every group for instant switching
    preloadOthers(sections)
    
    // Restore prior directory state based on the URL hash
    const hash=location.hash.slice(1)
    const targetKey=hash && decodeURIComponent(hash)
    const hasValidTarget=targetKey && sections.some(s=>s.key===targetKey)
    
    if(hasValidTarget){
      // Restore the previous folder view
      enterFolder(targetKey)
    }else{
      // Start in the root view showing folders only
      enterRoot()
    }
    
    // Initialize the language setting
    updateLanguage()
    
    // Hide the loading overlay
    setTimeout(()=>{
      const splash = document.getElementById('splash')
      if(splash){
        splash.classList.add('hidden')
        setTimeout(()=>{ splash.style.display='none' }, 500)
      }
    }, 100)

  }catch(err){
    console.warn('读取本地索引失败',err)
    // Hide the overlay even when an error occurs
    const splash = document.getElementById('splash')
    if(splash){
      splash.classList.add('hidden')
      setTimeout(()=>{ splash.style.display='none' }, 500)
    }
  }
}

fetchSections()

// Disable zooming (Ctrl +/-/0, wheel, or gestures)
window.addEventListener('keydown', (e)=>{
  if(e.ctrlKey && (e.key==='+'||e.key==='='||e.key==='-'||e.key==='0')){
    e.preventDefault()
  }
})
window.addEventListener('wheel', (e)=>{
  if(e.ctrlKey){e.preventDefault()}
},{passive:false})
window.addEventListener('gesturestart', (e)=>{e.preventDefault()})
window.addEventListener('gesturechange', (e)=>{e.preventDefault()})
window.addEventListener('gestureend', (e)=>{e.preventDefault()})

// Back-to-top button logic (bound to content scroll)
const backTopBtn=document.getElementById('backTop')
function updateBackTopVisibility(){
  if(!backTopBtn||!explorerContent) return
  if(navState.view!=='folder'){ backTopBtn.style.display='none'; return }
  const scroller = mainPane || explorerContent
  backTopBtn.style.display=((scroller && scroller.scrollTop>300)?'flex':'none')
}
const scrollerTarget = mainPane || explorerContent
if(scrollerTarget){ scrollerTarget.addEventListener('scroll',updateBackTopVisibility,{passive:true}) }
backTopBtn&&backTopBtn.addEventListener('click',()=>{
  const scroller = mainPane || explorerContent || window
  if(scroller && scroller.scrollTo){ scroller.scrollTo({top:0,behavior:'smooth'}) }
  else{ window.scrollTo({top:0,behavior:'smooth'}) }
})
updateBackTopVisibility()
function highlightSidebar(dir){
  if(!sidebar) return
  sidebar.querySelectorAll('.side-item').forEach(el=>{
    const isActive = el && el.dataset && el.dataset.section===dir
    if(isActive) el.classList.add('active'); else el.classList.remove('active')
  })
}

// Toggle the sidebar open or closed
function toggleSidebar(){
  if(!sidebar) return
  const isCollapsed=sidebar.classList.contains('sidebar--collapsed')
  if(isCollapsed){
    sidebar.classList.remove('sidebar--collapsed')
    const btn=sidebar.querySelector('.sidebar-toggle')
    if(btn){
      btn.setAttribute('title',t('sidebarCollapse'))
      btn.setAttribute('aria-label',t('sidebarCollapse'))
    }
  }else{
    sidebar.classList.add('sidebar--collapsed')
    const btn=sidebar.querySelector('.sidebar-toggle')
    if(btn){
      btn.setAttribute('title',t('sidebarExpand'))
      btn.setAttribute('aria-label',t('sidebarExpand'))
    }
  }
  // Save state to localStorage
  try{
    localStorage.setItem('memetray.sidebar.collapsed',String(!isCollapsed))
  }catch(_){/* ignore */}
}

// Infinite scroll (bound to content scroll)
let isLoading = false
async function handleInfiniteScroll() {
  if (isLoading) return
  if (navState.view!=='folder') return
  const scroller = mainPane || explorerContent || document.documentElement
  const { scrollTop, scrollHeight, clientHeight } = scroller
  if (scrollHeight - scrollTop - clientHeight < 300) {
    isLoading = true
    if(infiniteLoader){infiniteLoader.style.display='flex'}
    const selected = sectionSelect.value
    let section, nextPageKey
    if (selected === 'all') {
      const lastSectionKey = Object.keys(currentPage).pop()
      section = sections.find(s => s.key === lastSectionKey)
      nextPageKey = lastSectionKey
    } else {
      section = sections.find(s => s.key === selected)
      nextPageKey = selected
    }
    if (section) {
      const currentTotal = (currentPage[nextPageKey] || 0) * ITEMS_PER_PAGE
      if (currentTotal >= section.files.length) {
        isLoading = false
        if(infiniteLoader){infiniteLoader.style.display='none'}
        return
      }
      const nextPage = (currentPage[nextPageKey] || 0) + 1
      renderOneSection(section, nextPage)
    }
    setTimeout(() => { isLoading = false; if(infiniteLoader){infiniteLoader.style.display='none'} }, 200)
  }
}
const infTarget = mainPane || explorerContent || window
if(infTarget && infTarget.addEventListener){
  infTarget.addEventListener('scroll', handleInfiniteScroll, { passive: true })
}else{
  window.addEventListener('scroll', handleInfiniteScroll, { passive: true })
}

// Drag the window around
;(function enableDrag(){
  if(!explorer||!explorerTitlebar) return
  let dragging=false, startX=0, startY=0, startLeft=0, startTop=0
  const onDown=(e)=>{
    // Do not start dragging when navigation buttons are clicked
    const target=e.target
    if(target && (target.closest && (target.closest('#btnBack')||target.closest('#pathbar')))) return
    dragging=true
    const pt = e.touches? e.touches[0] : e
    startX=pt.clientX; startY=pt.clientY
    const rect=explorer.getBoundingClientRect()
    startLeft=rect.left; startTop=rect.top
    document.addEventListener('mousemove',onMove)
    document.addEventListener('mouseup',onUp)
    document.addEventListener('touchmove',onMove,{passive:false})
    document.addEventListener('touchend',onUp)
  }
  const onMove=(e)=>{
    if(!dragging) return
    const pt = e.touches? e.touches[0] : e
    if(e.cancelable) e.preventDefault()
    const dx=pt.clientX-startX, dy=pt.clientY-startY
    let nx=startLeft+dx, ny=startTop+dy
    const margin=8
    const vw=window.innerWidth, vh=window.innerHeight
    const rect=explorer.getBoundingClientRect()
    const w=rect.width, h=rect.height
    nx=Math.min(vw-margin, Math.max(margin-w+40, nx))
    ny=Math.min(vh-56, Math.max(margin, ny))
    explorer.style.left=nx+"px"
    explorer.style.top=ny+"px"
  }
  const onUp=()=>{
    dragging=false
    document.removeEventListener('mousemove',onMove)
    document.removeEventListener('mouseup',onUp)
    document.removeEventListener('touchmove',onMove)
    document.removeEventListener('touchend',onUp)
  }
  explorerTitlebar.addEventListener('mousedown',onDown)
  explorerTitlebar.addEventListener('touchstart',onDown,{passive:true})
})()

// Initialize the taskbar and preview panel using the shared module
let memeTrayUI = null
;(async function initMemeTrayComponents() {
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
        title: t('previewTitle'),
        dragHint: t('previewDragHint'),
        pasteHint: t('previewPasteHint'),
        downloadAllText: t('downloadAllText'),
        clearAllText: t('clearAllText')
      }
    })

    // Wire up the preview toggle button
    const previewToggle = document.getElementById('previewToggle')
    if (previewToggle) {
      previewToggle.addEventListener('click', () => {
        memeTrayUI.preview.toggle()
      })
    }

    // Show the tray icon preview when hovering over images
    window.setTrayIcon = (src, img) => {
      if (memeTrayUI) {
        memeTrayUI.taskbar.setTrayIcon(src, img)
      }
    }
    window.clearTrayIcon = () => {
      if (memeTrayUI) {
        memeTrayUI.taskbar.clearTrayIcon()
      }
    }
  } catch (err) {
    console.error('Failed to initialize MemeTray UI:', err)
  }
})()

// Window resizing (legacy logic removed, using the new implementation)

// Window resizing
;(function enableResize(){
  if(!explorer||!resizeHandles.length) return
  const storeKey='memetray.window.bounds'
  const minW=520, minH=320
  const rhN=document.querySelector('.rh-n')
  const rhNE=document.querySelector('.rh-ne')
  const rhNW=document.querySelector('.rh-nw')
  function loadBounds(){
    try{const j=localStorage.getItem(storeKey);return j?JSON.parse(j):null}catch(_){return null}
  }
  function saveBounds(){
    const r=explorer.getBoundingClientRect()
    const b={left:r.left,top:r.top,width:r.width,height:r.height}
    try{localStorage.setItem(storeKey,JSON.stringify(b))}catch(_){/* ignore */}
  }
  // Initialize window position and size when stored
  const saved=loadBounds()
  if(saved&&Number.isFinite(saved.width)&&Number.isFinite(saved.height)){
    explorer.style.left=saved.left+"px"
    explorer.style.top=saved.top+"px"
    explorer.style.width=saved.width+"px"
    explorer.style.height=saved.height+"px"
  }else{
    // Default to filling the viewport with margins (matching CSS defaults)
    explorer.style.left='8px'
    explorer.style.top='8px'
    explorer.style.width=(window.innerWidth-16)+"px"
    explorer.style.height=(window.innerHeight-48-16)+"px"
  }
  let resizing=false, dir='', startX=0, startY=0, start={left:0,top:0,width:0,height:0}
  function onDown(e){
    const target=e.currentTarget
    dir=target.getAttribute('data-dir')||''
    const pt=e.touches? e.touches[0] : e
    startX=pt.clientX; startY=pt.clientY
    const r=explorer.getBoundingClientRect()
    start={left:r.left,top:r.top,width:r.width,height:r.height}
    resizing=true
    document.addEventListener('mousemove',onMove)
    document.addEventListener('mouseup',onUp)
    document.addEventListener('touchmove',onMove,{passive:false})
    document.addEventListener('touchend',onUp)
    e.preventDefault()
  }
  function onMove(e){
    if(!resizing) return
    const pt=e.touches? e.touches[0] : e
    if(e.cancelable) e.preventDefault()
    const dx=pt.clientX-startX, dy=pt.clientY-startY
    let left=start.left, top=start.top, width=start.width, height=start.height
    const vw=window.innerWidth, vh=window.innerHeight
    const tb=48 // taskbar height margin bottom
    if(dir.includes('e')) width=Math.max(minW, Math.min(vw-8-left, start.width+dx))
    if(dir.includes('s')) height=Math.max(minH, Math.min(vh-tb-8-top, start.height+dy))
    if(dir.includes('w')){ left=Math.max(8, Math.min(start.left+start.width-minW, start.left+dx)); width=Math.max(minW, start.width+(start.left-left)) }
    if(dir.includes('n')){ top=Math.max(8, Math.min(start.top+start.height-minH, start.top+dy)); height=Math.max(minH, start.height+(start.top-top)) }
    explorer.style.left=left+"px"
    explorer.style.top=top+"px"
    explorer.style.width=width+"px"
    explorer.style.height=height+"px"
  }
  function onUp(){
    if(!resizing) return
    resizing=false
    document.removeEventListener('mousemove',onMove)
    document.removeEventListener('mouseup',onUp)
    document.removeEventListener('touchmove',onMove)
    document.removeEventListener('touchend',onUp)
    saveBounds()
  }
  resizeHandles.forEach(h=>{
    h.addEventListener('mousedown',onDown)
    h.addEventListener('touchstart',onDown,{passive:false})
  })
  // Save the position after dragging the window
  window.addEventListener('mouseup',()=>{ if(!resizing) saveBounds() })

  // Allow the title bar edge and corners to trigger resizing and show the correct cursor
  if(explorerTitlebar){
    const edge=8
    const corner=12
    const updateCursor=(e)=>{
      const r=explorer.getBoundingClientRect()
      const y=e.clientY - r.top
      const x=e.clientX - r.left
      const onTop=y>=0 && y<=edge
      const onLeft=x>=0 && x<=corner
      const onRight=x>=r.width-corner && x<=r.width
      if(onTop && onLeft){ explorerTitlebar.style.cursor='nwse-resize' }
      else if(onTop && onRight){ explorerTitlebar.style.cursor='nesw-resize' }
      else if(onTop){ explorerTitlebar.style.cursor='ns-resize' }
      else{ explorerTitlebar.style.cursor='move' }
    }
    const startResizeFromTitlebar=(e)=>{
      const r=explorer.getBoundingClientRect()
      const y=e.clientY - r.top
      const x=e.clientX - r.left
      if(y<0 || y>edge) return
      e.preventDefault(); e.stopPropagation()
      const opts={clientX:e.clientX, clientY:e.clientY, bubbles:true}
      if(x<=12 && rhNW){ rhNW.dispatchEvent(new MouseEvent('mousedown',opts)); return }
      if(x>=r.width-12 && rhNE){ rhNE.dispatchEvent(new MouseEvent('mousedown',opts)); return }
      if(rhN){ rhN.dispatchEvent(new MouseEvent('mousedown',opts)) }
    }
    explorerTitlebar.addEventListener('mousemove',updateCursor)
    explorerTitlebar.addEventListener('mouseleave',()=>{ explorerTitlebar.style.cursor='move' })
    explorerTitlebar.addEventListener('mousedown',startResizeFromTitlebar)
    explorerTitlebar.addEventListener('touchstart',(e)=>{
      const t=e.touches&&e.touches[0]; if(!t) return
      const fake=new MouseEvent('mousedown',{clientX:t.clientX,clientY:t.clientY,bubbles:true})
      startResizeFromTitlebar(fake)
    },{passive:false})
  }

  // Tool dropdown interactions
  const toolsToggle = document.getElementById('toolsToggle')
  const toolsMenu = document.getElementById('toolsMenu')
  if (toolsToggle && toolsMenu) {
    toolsToggle.addEventListener('click', (e) => {
      e.stopPropagation()
      toolsMenu.classList.toggle('show')
    })
    
    // Close the dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!toolsToggle.contains(e.target) && !toolsMenu.contains(e.target)) {
        toolsMenu.classList.remove('show')
      }
    })
    
    // Close the dropdown with the ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toolsMenu.classList.contains('show')) {
        toolsMenu.classList.remove('show')
      }
    })
  }
})()
