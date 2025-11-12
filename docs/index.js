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
// 移除复制路径按钮
const resizeHandles=[...document.querySelectorAll('#explorer .resize-handle')]
const sectionSelect={value:'all'}
const trayIcon=document.getElementById("trayIcon")
const clockTime=document.getElementById("clock-time")
const clockDate=document.getElementById("clock-date")
const infiniteLoader=document.getElementById('infiniteLoader')

const ITEMS_PER_PAGE = 50
let currentPage = {} // { [sectionKey]: pageNumber }
let navState={view:'root',currentKey:null}
const WINDOWS_ROOT='此电脑'
const CATIME_PATH='%LOCALAPPDATA%\\Catime\\animations'

// 多语言支持
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

// URL 参数覆盖语言并持久化（?lang=en 或 ?lang=zh）
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
  
  // 更新按钮
  if (btnBack) {
    btnBack.setAttribute('aria-label', t('backBtn'))
    btnBack.setAttribute('title', t('backBtnTitle'))
  }
  
  // 更新返回顶部按钮
  const backTopBtn = document.getElementById('backTop')
  if (backTopBtn) {
    backTopBtn.setAttribute('aria-label', t('backTop'))
    backTopBtn.setAttribute('title', t('backTop'))
  }
  
  // 更新顶部链接
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
  
  // 更新预览按钮
  const previewToggle = document.getElementById('previewToggle')
  if (previewToggle) {
    previewToggle.setAttribute('aria-label', t('previewLabel'))
    previewToggle.setAttribute('title', t('previewLabel'))
  }
  
  // 更新侧边栏标题
  const sideTitle = sidebar && sidebar.querySelector('.side-title')
  if (sideTitle) {
    sideTitle.textContent = t('sidebarTitle')
  }
  
  // 更新侧边栏折叠按钮
  const sidebarToggle = sidebar && sidebar.querySelector('.sidebar-toggle')
  if (sidebarToggle) {
    const isCollapsed = sidebar.classList.contains('sidebar--collapsed')
    sidebarToggle.setAttribute('aria-label', isCollapsed ? t('sidebarExpand') : t('sidebarCollapse'))
    sidebarToggle.setAttribute('title', isCollapsed ? t('sidebarExpand') : t('sidebarCollapse'))
  }
  
  // 更新法律声明
  const lf = document.getElementById('legalFooter')
  if (lf) {
    if (lf.classList.contains('legal--compact')) {
      lf.innerHTML = `<a class="legal-link" href="https://github.com/MemeTray/MemeTray/blob/main/DISCLAIMER.md" target="_blank" rel="noopener">${t('legalCompact')}</a>`
    } else {
      lf.innerHTML = t('legalFull')
    }
  }
  
  // 更新预览面板文本
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
  
  // 更新批量操作按钮 tooltip
  const downloadAllBtn = document.getElementById('downloadAllBtn')
  if (downloadAllBtn) {
    downloadAllBtn.setAttribute('title', t('downloadAllText'))
  }
  
  const clearAllBtn = document.getElementById('clearAllBtn')
  if (clearAllBtn) {
    clearAllBtn.setAttribute('title', t('clearAllText'))
  }
  
  // 保存语言设置
  localStorage.setItem('memetray.lang', currentLang)
}

// 语言切换
const langToggle = document.getElementById('langToggle')
if (langToggle) {
  langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'zh' ? 'en' : 'zh'
    updateLanguage()
  })
}

// 桌面背景支持（URL 参数优先，其次 localStorage），无值或无效时从API池随机选择
;(async function initBackground(){
  try{
    const p=new URLSearchParams(location.search)
    const key='memetray.bg'
    const fromUrlRaw=p.get('bg')||p.get('background')||p.get('wallpaper')
    const fromUrl=fromUrlRaw && fromUrlRaw.trim()
    const savedRaw=localStorage.getItem(key)
    const saved=savedRaw && savedRaw.trim()
    
    // 动态导入随机壁纸配置
    let randomApi
    try{
      const {getRandomWallpaper} = await import('../tools/common/backgroundConfig.js')
      randomApi = getRandomWallpaper()
    }catch(_){
      // 降级：如果模块加载失败，使用内联配置
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
      // 允许常见的相对/绝对/HTTP(S) 路径，但不做同步探测
      return /^(https?:|\/|\.\/|\.\.\/)/.test(s)
    }

    if(desktop && isValid(val)){
      desktop.style.backgroundImage=`url("${val}")`
    }
    // 仅在 URL 有效时保存
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
    // 文件夹视图不需要内容区上方的“名称与数量”标题
    if(navState.view==='folder'){
      const h2=sec.querySelector('h2'); if(h2) h2.remove()
    }
    container.appendChild(sec)
  } else {
    grid = sec.querySelector('.gallery')
    // 已存在 section 时也移除标题
    if(navState.view==='folder'){
      const h2=sec.querySelector('h2'); if(h2) h2.remove()
    }
  }

  // 移除骨架占位，改为图片淡入
  
  // 使用 baseUrl（如果存在）或回退到本地路径
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
// 顶部方格作为主要交互入口

// 视图切换
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
  // 清除 URL hash
  if(history.replaceState){ history.replaceState(null,null,' ') }
  else{ location.hash='' }
    // 根视图：展示右下角小药丸
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
  // 确保侧栏高亮与当前分组一致（从主页点击方块进入时生效）
  highlightSidebar(key)
  if(container) container.classList.add('container--folder')
  sectionSelect.value=key
  buildItems()
  // 更新 URL hash 以保持状态
  if(history.replaceState){ history.replaceState(null,null,'#'+encodeURIComponent(key)) }
  else{ location.hash=key }
  // 保险：进入文件夹后清理内容区所有分区标题
  try{
    if(container){
      container.querySelectorAll('.section h2').forEach(h=>h.remove())
    }
  }catch(_){/* ignore */}
  if(explorerContent){ explorerContent.scrollTo({top:0,behavior:'smooth'}) }
  renderBreadcrumbs()
  updateBackTopVisibility()
  // 文件夹视图：隐藏药丸（避免与分组内声明重复）
  try{
    const lf=document.getElementById('legalFooter')
    if(lf){
      lf.classList.remove('legal--compact')
      // 文件夹视图填充完整声明，贴在窗口底部
      lf.innerHTML=t('legalFull')
    }
  }catch(_){/* ignore */}
}

function renderBreadcrumbs(){
  const titleTextEl=document.getElementById('windowTitleText')
  // 仅显示 MemeTray 起始，不显示 "此电脑"
  const parts = navState.view==='folder' ? ['MemeTray',navState.currentKey] : ['MemeTray']
  // 1) 清空并渲染到标题文本（与图标同一行）
  if(titleTextEl){
    titleTextEl.innerHTML=''
    parts.forEach((name,idx)=>{
      const isLast=idx===parts.length-1
      const span=document.createElement('span'); span.className='crumb ' + (isLast?'crumb--current':'crumb--link')
      span.textContent=name
      
      // 添加点击事件
      if(!isLast){
        span.addEventListener('click',()=>{
          if(idx===0) return enterRoot()
          if(idx===1) return enterFolder(navState.currentKey)
        })
      } else if(isLast && idx === 1 && navState.view === 'folder') {
        // 当前分类名称，点击跳转到 GitHub 仓库
        span.style.cursor = 'pointer'
        span.title = t('openRepository')
        span.addEventListener('click', () => {
          const sec = sections && sections.find(s => s.key === navState.currentKey)
          if (sec && sec.repository) {
            window.open(sec.repository, '_blank', 'noopener,noreferrer')
          }
        })
      }
      
      titleTextEl.appendChild(span)
      if(idx<parts.length-1){
        const sep=document.createElement('span'); sep.className='sep sep--chev'; sep.textContent='›'
        titleTextEl.appendChild(sep)
      }
    })
    // 在文件夹视图最后追加数量 (n)
    if(navState.view==='folder' && navState.currentKey){
      const sec=sections && sections.find(s=>s.key===navState.currentKey)
      if(sec && Array.isArray(sec.files)){
        const cnt=document.createElement('span')
        cnt.className='count-badge'
        cnt.textContent=String(sec.files.length)
        cnt.style.cursor = 'pointer'
        cnt.title = t('openConfig')
        
        // 点击数量标签跳转到 config.json
        cnt.addEventListener('click', () => {
          if (sec.repository) {
            const configUrl = `${sec.repository}/blob/main/config.json`
            window.open(configUrl, '_blank', 'noopener,noreferrer')
          }
        })
        
        titleTextEl.appendChild(cnt)
      }
    }
  }
  // 2) 清空内容区 breadcrumbs，避免重复显示
  if(breadcrumbs){
    breadcrumbs.innerHTML=''
  }
}

// 按钮事件
btnBack&&btnBack.addEventListener('click',()=>{
  if(navState.view==='folder') enterRoot()
})

// 已移除复制路径按钮

function setTrayIcon(src, sourceImg = null){
  if(!trayIcon) return
  trayIcon.innerHTML=""
  
  // 如果提供了源图片且已加载完成，尝试直接复制当前帧
  if(sourceImg && sourceImg.complete && sourceImg.naturalWidth > 0) {
    try {
      // 方法1：直接克隆图片元素（最简单，但可能重新开始播放）
      const clonedImg = sourceImg.cloneNode(true)
      clonedImg.alt = "tray"
      // 移除可能的类名和事件监听器
      clonedImg.className = ""
      clonedImg.style.width = "100%"
      clonedImg.style.height = "100%"
      clonedImg.style.objectFit = "contain"
      trayIcon.appendChild(clonedImg)
      return
    } catch (err) {
      console.warn("Failed to clone image:", err)
    }
  }
  
  // 降级方案：创建新的图片元素
  const img=document.createElement("img")
  img.src=src
  img.alt="tray"
  img.style.width = "100%"
  img.style.height = "100%"
  img.style.objectFit = "contain"
  trayIcon.appendChild(img)
}
function clearTrayIcon(){
  if(trayIcon){
    trayIcon.innerHTML=""
  }
}

// 时钟
function formatDate(d){const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,'0');const day=String(d.getDate()).padStart(2,'0');return y+"/"+m+"/"+day}
function updateClock(){const d=new Date();const hh=String(d.getHours()).padStart(2,'0');const mm=String(d.getMinutes()).padStart(2,'0');const ss=String(d.getSeconds()).padStart(2,'0');
  if(clockTime) clockTime.textContent=hh+":"+mm+":"+ss;
  if(clockDate) clockDate.textContent=formatDate(d);
}
setInterval(updateClock,1000);updateClock()

// 托盘图标根据悬停动态显示

function fileName(dir,i){return String(i).padStart(4,'0')+"_"+dir+".gif"}
// 已移除网络探针逻辑，数量完全由 sections.json 提供

async function fetchSections(){
  if(sections && sections.length){buildItems();return}
  try{
    // 仅使用本地静态索引，避免任何外部 API 依赖
    const localIdx=await fetch("./sections.txt",{cache:'no-store'})
    if(!localIdx.ok) throw new Error('sections.txt not found')
    const text=await localIdx.text()
    const sections_list = text.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0)
    if(!sections_list.length) throw new Error('empty sections')
    // 处理分类配置，从各个仓库获取 count 信息
    const normalized = sections_list
      .map((dir)=>{
        // 自动生成 URL
        const baseUrl = `https://cdn.jsdelivr.net/gh/MemeTray/gifs-${dir}@main/${dir}/`
        const repository = `https://github.com/MemeTray/gifs-${dir}`
        return {dir, baseUrl, repository}
      })
      .filter(({dir})=>!!dir)
    if(!normalized.length) throw new Error('invalid sections schema: expect array of {dir}')

    // 1) 异步获取各个分组的配置信息
    const sectionsWithCount = await Promise.all(
      normalized.map(async ({dir, baseUrl, repository}) => {
        try {
          // config.json 位于仓库根目录，不在子目录中
          const configUrl = `https://cdn.jsdelivr.net/gh/MemeTray/gifs-${dir}@main/config.json`
          const configResponse = await fetch(configUrl, {cache: 'no-store'})
          if (!configResponse.ok) throw new Error(`config.json not found for ${dir}`)
          const config = await configResponse.json()
          const count = Number.isFinite(Number(config.count)) ? Number(config.count) : 0
          const files = []; for(let i=1; i<=count; i++){files.push(fileName(dir,i))}
          return {key:dir, title:dir, dir, files, baseUrl, repository, count}
        } catch (err) {
          console.warn(`Failed to load config for ${dir}:`, err)
          return {key:dir, title:dir, dir, files:[], baseUrl, repository, count:0}
        }
      })
    )
    
    sections = sectionsWithCount.filter(s => s.count > 0)
    if (sections.length > 0) {
      sectionSelect.value = sections[0].dir
      buildItems()
    }

    // sections 已经在上面构建完成

    // 构建顶部方格选择器（预览固定为 0001_分组名.gif）
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

    // 构建左侧侧边栏（分组快速切换）
    if(sidebar){
      sidebar.innerHTML=''
      // 添加标题和折叠按钮
      const header=document.createElement('div'); header.className='side-header'
      const title=document.createElement('div'); title.className='side-title'; title.textContent=t('sidebarTitle')
      const toggleBtn=document.createElement('button'); toggleBtn.className='sidebar-toggle'; toggleBtn.setAttribute('aria-label',t('sidebarCollapse')); toggleBtn.title=t('sidebarCollapse')
      toggleBtn.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" fill="currentColor"></path></svg>'
      header.appendChild(title)
      header.appendChild(toggleBtn)
      sidebar.appendChild(header)
      
      // 折叠按钮事件
      toggleBtn.addEventListener('click',toggleSidebar)
      
      // 恢复侧边栏状态（默认收起）
      try{
        const saved=localStorage.getItem('memetray.sidebar.collapsed')
        // 如果用户从未设置过，默认为收起（collapsed=true）
        // 如果用户设置过，则按用户偏好显示
        const collapsed = saved === null ? true : saved === 'true'
        if(collapsed){
          sidebar.classList.add('sidebar--collapsed')
          toggleBtn.setAttribute('title',t('sidebarExpand'))
        }
      }catch(_){
        // 如果 localStorage 失败，也默认收起
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
      // 侧边栏悬停预览（事件委托，覆盖所有子项）
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

    // 3) 预加载所有分组前 48 张，确保后续切换秒开
    preloadOthers(sections)
    
    // 检查 URL hash 以恢复之前的目录状态
    const hash=location.hash.slice(1)
    const targetKey=hash && decodeURIComponent(hash)
    const hasValidTarget=targetKey && sections.some(s=>s.key===targetKey)
    
    if(hasValidTarget){
      // 恢复到之前的文件夹视图
      enterFolder(targetKey)
    }else{
      // 默认进入根视图（只显示文件夹）
      enterRoot()
    }
    
    // 初始化语言设置
    updateLanguage()
    
    // 隐藏加载遮罩
    setTimeout(()=>{
      const splash = document.getElementById('splash')
      if(splash){
        splash.classList.add('hidden')
        setTimeout(()=>{ splash.style.display='none' }, 500)
      }
    }, 100)

  }catch(err){
    console.warn('读取本地索引失败',err)
    // 即使出错也隐藏遮罩
    const splash = document.getElementById('splash')
    if(splash){
      splash.classList.add('hidden')
      setTimeout(()=>{ splash.style.display='none' }, 500)
    }
  }
}

fetchSections()

// 禁止缩放（Ctrl +/-/0、Ctrl+滚轮、手势）
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

// 返回顶部按钮逻辑（绑定到窗口内容滚动）
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

// 侧边栏折叠/展开切换
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
  // 保存状态到 localStorage
  try{
    localStorage.setItem('memetray.sidebar.collapsed',String(!isCollapsed))
  }catch(_){/* ignore */}
}

// Infinite Scroll（绑定到窗口内容滚动）
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

// 窗口拖拽
;(function enableDrag(){
  if(!explorer||!explorerTitlebar) return
  let dragging=false, startX=0, startY=0, startLeft=0, startTop=0
  const onDown=(e)=>{
    // 如果点击在导航按钮上，不触发拖拽
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

// GIF 预览面板功能
;(function initPreviewPanel(){
  const previewToggle = document.getElementById('previewToggle')
  const previewPanel = document.getElementById('previewPanel')
  const previewClose = document.getElementById('previewClose')
  const previewUploadArea = document.getElementById('previewUploadArea')
  const previewGallery = document.getElementById('previewGallery')
  const previewActions = document.getElementById('previewActions')
  const downloadAllBtn = document.getElementById('downloadAllBtn')
  const clearAllBtn = document.getElementById('clearAllBtn')
  
  if (!previewToggle || !previewPanel) return
  
  let previewFiles = []
  
  // 切换预览面板显示/隐藏
  function togglePreviewPanel() {
    const isVisible = previewPanel.style.display !== 'none'
    previewPanel.style.display = isVisible ? 'none' : 'flex'
    
    // 如果是首次打开，初始化拖拽功能
    if (!isVisible && !previewPanel.dataset.initialized) {
      initPreviewDragDrop()
      previewPanel.dataset.initialized = 'true'
    }
  }
  
  // 初始化拖拽功能
  async function initPreviewDragDrop() {
    try {
      const { setupDragAndDrop, setupPasteSupport } = await import('../tools/common/fileUploadHelpers.js')
      
      // 设置拖拽支持
      setupDragAndDrop({
        uploadArea: previewUploadArea,
        onFilesDropped: handlePreviewFiles,
        acceptType: 'image/gif'
      })
      
      // 设置粘贴支持
      setupPasteSupport({
        onFilesPasted: handlePreviewFiles,
        acceptType: 'image/gif'
      })
      
    } catch (err) {
      console.warn('Failed to load file upload helpers:', err)
    }
  }
  
  // 处理预览文件
  function handlePreviewFiles(files) {
    console.log(`处理 ${files.length} 个文件`)
    
    files.forEach((fileObj, index) => {
      const { file, path } = fileObj
      
      // 检查文件类型
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
    
    // 隐藏上传提示，显示批量操作按钮
    if (previewFiles.length > 0) {
      previewUploadArea.style.display = 'none'
      if (previewActions) {
        previewActions.style.display = 'flex'
      }
    }
    
    console.log(`文件处理完成，当前预览文件总数: ${previewFiles.length}`)
  }
  
  // 渲染预览项
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
    
    // 悬停时显示在托盘图标
    div.addEventListener('mouseenter', () => {
      setTrayIcon(item.url, img)
    })
    
    div.addEventListener('mouseleave', () => {
      clearTrayIcon()
    })
    
    div.appendChild(img)
    div.appendChild(info)
    div.appendChild(removeBtn)
    previewGallery.appendChild(div)
  }
  
  // 移除预览项
  function removePreviewItem(id) {
    const index = previewFiles.findIndex(item => item.id === id)
    if (index > -1) {
      const item = previewFiles[index]
      URL.revokeObjectURL(item.url)
      previewFiles.splice(index, 1)
      
      const element = previewGallery.querySelector(`[data-id="${id}"]`)
      if (element) {
        element.remove()
      }
      
      // 如果没有文件了，显示上传提示，隐藏批量操作按钮
      if (previewFiles.length === 0) {
        previewUploadArea.style.display = 'block'
        if (previewActions) {
          previewActions.style.display = 'none'
        }
      }
    }
  }
  
  // 格式化文件大小
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }
  
  // 批量下载为 ZIP
  async function downloadAllAsZip() {
    if (previewFiles.length === 0) return
    
    // 禁用下载按钮，显示加载状态
    const downloadBtn = document.getElementById('downloadAllBtn')
    const originalTitle = downloadBtn ? downloadBtn.title : ''
    if (downloadBtn) {
      downloadBtn.disabled = true
      downloadBtn.style.opacity = '0.6'
      downloadBtn.title = 'Downloading...'
    }
    
    try {
      // 动态加载 JSZip 库
      let JSZip
      if (typeof window.JSZip === 'undefined') {
        // 如果 JSZip 未加载，动态加载
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
        document.head.appendChild(script)
        
        // 等待脚本加载完成
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
      
      // 添加所有文件到 ZIP
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
          // 继续处理其他文件，不中断整个过程
        }
      }
      
      // 检查是否有文件被成功添加
      if (Object.keys(zip.files).length === 0) {
        throw new Error('No files were successfully added to the ZIP')
      }
      
      // 生成 ZIP 文件
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })
      
      // 下载 ZIP 文件
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `MemeTray-Preview-${new Date().toISOString().slice(0, 10)}.zip`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 延迟清理 URL，确保下载开始
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
      
      console.log(`成功下载 ${Object.keys(zip.files).length} 个文件`)
      
    } catch (err) {
      console.error('下载失败:', err)
      
      // 提供备用下载方案
      const fallbackDownload = confirm(`ZIP 打包下载失败: ${err.message}\n\n是否要逐个下载文件？`)
      if (fallbackDownload) {
        downloadFilesIndividually()
      }
    } finally {
      // 恢复下载按钮状态
      if (downloadBtn) {
        downloadBtn.disabled = false
        downloadBtn.style.opacity = '1'
        downloadBtn.title = originalTitle
      }
    }
  }
  
  // 备用下载方案：逐个下载文件
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
        
        // 添加延迟避免浏览器阻止多个下载
        if (i < previewFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (err) {
        console.warn(`下载文件 ${item.name} 失败:`, err)
      }
    }
  }
  
  // 清空所有文件
  function clearAllFiles() {
    if (previewFiles.length === 0) return
    
    // 清理所有 blob URL
    previewFiles.forEach(item => {
      URL.revokeObjectURL(item.url)
    })
    
    // 清空数组和界面
    previewFiles = []
    previewGallery.innerHTML = ''
    
    // 显示上传提示，隐藏批量操作按钮
    previewUploadArea.style.display = 'block'
    if (previewActions) {
      previewActions.style.display = 'none'
    }
  }
  
  // 事件监听
  previewToggle.addEventListener('click', togglePreviewPanel)
  previewClose.addEventListener('click', togglePreviewPanel)
  
  // 批量操作按钮事件
  if (downloadAllBtn) {
    downloadAllBtn.addEventListener('click', downloadAllAsZip)
  }
  
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllFiles)
  }
  
  // 点击面板外部关闭
  document.addEventListener('click', (e) => {
    if (previewPanel.style.display !== 'none' && 
        !previewPanel.contains(e.target) && 
        !previewToggle.contains(e.target)) {
      previewPanel.style.display = 'none'
    }
  })
})()

// 窗口缩放（旧逻辑移除，保留新版）

// 窗口缩放
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
  // 初始化位置尺寸（若有存储，应用之）
  const saved=loadBounds()
  if(saved&&Number.isFinite(saved.width)&&Number.isFinite(saved.height)){
    explorer.style.left=saved.left+"px"
    explorer.style.top=saved.top+"px"
    explorer.style.width=saved.width+"px"
    explorer.style.height=saved.height+"px"
  }else{
    // 默认占满视口，四周留缝隙（与 CSS 初始一致）
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
  // 窗口拖拽结束也保存位置
  window.addEventListener('mouseup',()=>{ if(!resizing) saveBounds() })

  // 让标题栏顶边与顶角也可触发缩放与显示对应光标
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

  // 工具下拉菜单交互
  const toolsToggle = document.getElementById('toolsToggle')
  const toolsMenu = document.getElementById('toolsMenu')
  if (toolsToggle && toolsMenu) {
    toolsToggle.addEventListener('click', (e) => {
      e.stopPropagation()
      toolsMenu.classList.toggle('show')
    })
    
    // 点击外部关闭下拉菜单
    document.addEventListener('click', (e) => {
      if (!toolsToggle.contains(e.target) && !toolsMenu.contains(e.target)) {
        toolsMenu.classList.remove('show')
      }
    })
    
    // ESC 键关闭下拉菜单
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toolsMenu.classList.contains('show')) {
        toolsMenu.classList.remove('show')
      }
    })
  }
})()
