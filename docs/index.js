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

// 加载遮罩
const splash=document.getElementById('splash')
const splashDots=document.getElementById('splashDots')
let splashTimer=null
const ITEMS_PER_PAGE = 50
let currentPage = {} // { [sectionKey]: pageNumber }
let navState={view:'root',currentKey:null}
const WINDOWS_ROOT='此电脑'
const CATIME_PATH='%LOCALAPPDATA%\\Catime\\animations'

// 桌面背景支持（URL 参数优先，其次 localStorage），无值或无效时保留 CSS 默认
;(function initBackground(){
  try{
    const p=new URLSearchParams(location.search)
    const key='memetray.bg'
    const fromUrlRaw=p.get('bg')||p.get('background')||p.get('wallpaper')
    const fromUrl=fromUrlRaw && fromUrlRaw.trim()
    const savedRaw=localStorage.getItem(key)
    const saved=savedRaw && savedRaw.trim()
    const val=fromUrl||saved||''

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

function startSplash(){
  if(!splash) return
  splash.style.display='flex'
  splash.classList.remove('splash--hide')
  if(splashTimer) return
  let i=0; const states=['.','..','...']
  splashTimer=setInterval(()=>{if(splashDots){splashDots.textContent=states[i%3]} i++},400)
}
function stopSplash(){
  if(splash){splash.classList.add('splash--hide'); splash.style.display='none'}
  if(splashTimer){clearInterval(splashTimer); splashTimer=null}
}

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

  for(const id of pagedFiles){
    const href=GIF_BASE+dir+"/"+id
    const a=document.createElement("a")
    a.href=href
    a.download=id
    const thumb=document.createElement("div"); thumb.className="thumb"
    const img=document.createElement("img");
    img.src=href; img.alt=id; img.loading="lazy"; img.decoding="async"
    img.classList.add('fade-in')
    img.addEventListener('load', ()=>{ img.classList.add('is-loaded') }, { once:true })
    img.addEventListener('error', ()=>{ console.warn("图片加载失败:",href); a.style.display="none" }, { once:true })
    thumb.appendChild(img)
    a.appendChild(thumb)
    a.addEventListener("mouseenter",()=>{setTrayIcon(href)})
    a.addEventListener("mouseleave",()=>{clearTrayIcon()})
    grid.appendChild(a)
  }
  currentPage[key] = page
  return sec
}


function preloadSectionImages(secObj,max=48){const {dir,files}=secObj;const list=files.slice(0,max);for(const id of list){const img=new Image();img.decoding='async';img.loading='eager';img.src=GIF_BASE+dir+"/"+id}}
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
  // 根视图：展示右下角小药丸
  try{
    const lf=document.getElementById('legalFooter')
    if(lf){
      lf.classList.add('legal--compact')
      lf.innerHTML='<a class="legal-link" href="https://github.com/MemeTray/MemeTray/blob/main/DISCLAIMER.md" target="_blank" rel="noopener">法律 / 免责声明</a>'
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
      lf.innerHTML='<strong>版权声明</strong>：本网站展示的 GIF 资源均来源于公开互联网，版权归原作者或权利人所有；本站仅用于学习、研究与技术交流，严禁任何商业或非法用途。如您认为内容侵权，请联系我们，我们将在核实后立即移除。<div class="legal-links"><a href="https://github.com/MemeTray/MemeTray/issues" target="_blank" rel="noopener">提交 Issue</a><span>·</span><a href="mailto:vladelaina@gmail.com">vladelaina@gmail.com</a></div>'
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
      if(!isLast){
        span.addEventListener('click',()=>{
          if(idx===0) return enterRoot()
          if(idx===1) return enterFolder(navState.currentKey)
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

function setTrayIcon(src){trayIcon.innerHTML="";const img=document.createElement("img");img.src=src;img.alt="tray";trayIcon.appendChild(img)}
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
// 已移除网络探针逻辑，数量完全由 index.json 提供

async function fetchSections(){
  startSplash()
  if(sections && sections.length){buildItems();return}
  try{
    // 仅使用本地静态索引，避免任何外部 API 依赖
    const localIdx=await fetch(GIF_BASE+"index.json",{cache:'no-store'})
    if(!localIdx.ok) throw new Error('index.json not found')
    const data=await localIdx.json()
    if(!Array.isArray(data.sections) || !data.sections.length) throw new Error('empty sections')
    // 严格要求 { dir, count } 结构
    const normalized=(data.sections||[])
      .map((s)=>({
        dir: String(s && s.dir != null ? s.dir : ''),
        count: Number.isFinite(Number(s && s.count)) ? Number(s.count) : NaN
      }))
      .filter(({dir,count})=>!!dir && Number.isFinite(count) && count>=0)
    if(!normalized.length) throw new Error('invalid sections schema: expect array of {dir, count>=0}')

    // 1) 先基于数量快速渲染第一个分组，避免白屏
    const first=normalized[0]
    const firstCount=Math.max(0, Number(first.count)||0)
    const firstFiles=[]; for(let i=1;i<=firstCount;i++){firstFiles.push(fileName(first.dir,i))}
    sections=[{key:first.dir,title:first.dir,dir:first.dir,files:firstFiles}]
    sectionSelect.value=first.dir
    buildItems()

    // 2) 构建其余分组文件列表（严格使用 count）
    const otherSections=normalized.slice(1).map(({dir,count})=>{
      const c=Math.max(0, Number(count)||0)
      const files=[]; for(let i=1;i<=c;i++){files.push(fileName(dir,i))}
      return {key:dir,title:dir,dir,files}
    })
    sections=[sections[0], ...otherSections]

    // 构建顶部方格选择器（预览固定为 0001_分组名.gif）
    if(sectionTiles){
      sectionTiles.innerHTML=''
      for(const {dir,title,files} of sections){
        const t=document.createElement('div');t.className='tile';t.dataset.section=dir
        const th=document.createElement('div');th.className='tile-thumb'
        const img=document.createElement('img');const first=GIF_BASE+dir+'/'+fileName(dir,1)
        img.src=first; img.alt=title; img.loading='lazy'; img.decoding='async'
        th.appendChild(img)
        const tt=document.createElement('div');tt.className='tile-title';tt.textContent=title
        t.appendChild(th);t.appendChild(tt)
        t.addEventListener('mouseenter',()=>{setTrayIcon(first)})
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
      const title=document.createElement('div'); title.className='side-title'; title.textContent='分组'
      const toggleBtn=document.createElement('button'); toggleBtn.className='sidebar-toggle'; toggleBtn.setAttribute('aria-label','折叠侧边栏'); toggleBtn.title='折叠侧边栏'
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
          toggleBtn.setAttribute('title','展开侧边栏')
        }
      }catch(_){
        // 如果 localStorage 失败，也默认收起
        sidebar.classList.add('sidebar--collapsed')
        toggleBtn.setAttribute('title','展开侧边栏')
      }
      
      for(const {dir} of sections){
        const item=document.createElement('div'); item.className='side-item'; item.dataset.section=dir
        const th=document.createElement('div'); th.className='thumb'
        const preview=GIF_BASE+dir+'/'+fileName(dir,1)
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
        if(p) setTrayIcon(p)
      }
      const onOut=(e)=>{
        const from=e.target && e.target.closest && e.target.closest('.side-item')
        const to=e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.side-item')
        if(from && from!==to) clearTrayIcon()
      }
      sidebar.addEventListener('mouseover', onOver)
      sidebar.addEventListener('mouseout', onOut)
      highlightSidebar(first.dir)
    }

    // 3) 预加载所有分组前 48 张，确保后续切换秒开
    preloadOthers(sections)
    // 完成本地索引探测和首屏渲染后，隐藏遮罩
    stopSplash()
    // 默认进入根视图（只显示文件夹）
    enterRoot()

  }catch(err){
    console.warn('读取本地索引失败',err)
    stopSplash()
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
    if(btn) btn.setAttribute('title','折叠侧边栏')
  }else{
    sidebar.classList.add('sidebar--collapsed')
    const btn=sidebar.querySelector('.sidebar-toggle')
    if(btn) btn.setAttribute('title','展开侧边栏')
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
})()
