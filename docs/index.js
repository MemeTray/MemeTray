let sections=window.MEMETRAY_SECTIONS||[]
const GIF_BASE=location.pathname.includes('/docs/')?'../gifs/':'./gifs/'
const container=document.getElementById("container")
const sectionTiles=document.getElementById("sectionTiles")
const desktop=document.getElementById('desktop')
const explorer=document.getElementById('explorer')
const explorerTitlebar=document.getElementById('explorerTitlebar')
const explorerContent=document.getElementById('explorerContent')
const btnBack=document.getElementById('btnBack')
const windowTitle=document.getElementById('windowTitle')
const breadcrumbs=document.getElementById('breadcrumbs')
const copyPathBtn=document.getElementById('copyPath')
const resizeHandles=[...document.querySelectorAll('#explorer .resize-handle')]
const sectionSelect={value:'all'}
const trayIcon=document.getElementById("trayIcon")
const clockTime=document.getElementById("clock-time")
const clockDate=document.getElementById("clock-date")

// 加载遮罩
const splash=document.getElementById('splash')
const splashDots=document.getElementById('splashDots')
let splashTimer=null
const ITEMS_PER_PAGE = 50
let currentPage = {} // { [sectionKey]: pageNumber }
let navState={view:'root',currentKey:null}
const WINDOWS_ROOT='此电脑'
const CATIME_PATH='%LOCALAPPDATA%\\Catime\\animations'

// 桌面背景支持（URL 参数优先，其次 localStorage）
;(function initBackground(){
  try{
    const p=new URLSearchParams(location.search)
    const key='memetray.bg'
    const fromUrl=p.get('bg')||p.get('background')||p.get('wallpaper')
    const saved=localStorage.getItem(key)
    const val=fromUrl||saved||''
    if(desktop){
      if(val){desktop.style.backgroundImage=`url("${val}")`}
      else{desktop.style.backgroundImage='none'}
    }
    if(fromUrl){localStorage.setItem(key,fromUrl)}
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
  const legal=document.createElement('div');legal.className='legal';legal.innerHTML='<strong>版权声明</strong>：本网站展示的 GIF 资源均来源于公开互联网，版权归原作者或权利人所有；本站仅用于学习、研究与技术交流，严禁任何商业或非法用途。如您认为内容侵权，请联系我们，我们将在核实后立即移除。<div class="legal-links"><a href="https://github.com/MemeTray/MemeTray/issues" target="_blank" rel="noopener">提交 Issue</a><span>·</span><a href="mailto:vladelaina@gmail.com">vladelaina@gmail.com</a></div>';
  sec.appendChild(legal);
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
    container.appendChild(sec)
  } else {
    grid = sec.querySelector('.gallery')
  }

  for(const id of pagedFiles){
    const href=GIF_BASE+dir+"/"+id
    const a=document.createElement("a")
    a.href=href;a.download=id;const thumb=document.createElement("div");thumb.className="thumb";const img=document.createElement("img");img.src=href;img.alt=id;img.loading="lazy";img.decoding="async";img.onerror=()=>{console.warn("图片加载失败:",href);a.style.display="none"};thumb.appendChild(img);a.appendChild(thumb);a.addEventListener("mouseenter",()=>{setTrayIcon(href)});a.addEventListener("mouseleave",()=>{clearTrayIcon()});grid.appendChild(a)
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
  renderBreadcrumbs()
  updateBackTopVisibility()
}

function enterFolder(key){
  navState.view='folder'; navState.currentKey=key
  const titleTextEl=document.getElementById('windowTitleText')
  if(titleTextEl) titleTextEl.textContent=key
  if(btnBack){ btnBack.disabled=false }
  if(sectionTiles) sectionTiles.style.display='none'
  if(container) container.style.display='block'
  sectionSelect.value=key
  buildItems()
  if(explorerContent){ explorerContent.scrollTo({top:0,behavior:'smooth'}) }
  renderBreadcrumbs()
  updateBackTopVisibility()
}

function renderBreadcrumbs(){
  if(!breadcrumbs) return
  breadcrumbs.innerHTML=''
  // Root: 此电脑 > MemeTray (静态)
  const parts = navState.view==='folder' ? [WINDOWS_ROOT,'MemeTray',navState.currentKey] : [WINDOWS_ROOT,'MemeTray']
  parts.forEach((name,idx)=>{
    const span=document.createElement('span'); span.className='crumb'
    span.textContent=name
    if(idx===0){ span.addEventListener('click',()=>enterRoot()) }
    if(idx===1){ span.addEventListener('click',()=>enterRoot()) }
    if(idx===2){ span.addEventListener('click',()=>enterFolder(navState.currentKey)) }
    breadcrumbs.appendChild(span)
    if(idx<parts.length-1){
      const sep=document.createElement('span'); sep.className='sep'; sep.textContent='>'
      breadcrumbs.appendChild(sep)
    }
  })
}

// 按钮事件
btnBack&&btnBack.addEventListener('click',()=>{
  if(navState.view==='folder') enterRoot()
})

copyPathBtn&&copyPathBtn.addEventListener('click',async ()=>{
  try{
    const path = navState.view==='folder' && navState.currentKey ? `${CATIME_PATH}\\${navState.currentKey}` : CATIME_PATH
    await navigator.clipboard.writeText(path)
    copyPathBtn.disabled=true; setTimeout(()=>{copyPathBtn.disabled=false},600)
  }catch(_){/* ignore */}
})

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
function isImageResponse(resp){
  if(!resp) return false;
  const ct=(resp.headers&&resp.headers.get('content-type'))||'';
  return resp.ok && /^(image)\//i.test(ct);
}
async function fileExists(url){
  try{
    const u=url+(url.includes('?')?'&':'?')+"t="+Date.now();
    // 先尝试 HEAD，部分静态托管（如启用 SPA 回退到 index.html）会返回 200 但 content-type 为 text/html
    const r=await fetch(u,{method:'HEAD',cache:'no-store'});
    if(isImageResponse(r)) return true;
    // 回退 GET，再次校验 content-type 必须是图片，避免 SPA 200 误判
    const r2=await fetch(u,{cache:'no-store'});
    return isImageResponse(r2);
  }catch(e){return false}
}
async function probeCountForDir(dir){
  let prev=0, curr=1, maxCap=10000;
  // 指数探测：1,2,4,8,... 直到不存在
  while(curr<=maxCap){
    const ok=await fileExists(GIF_BASE+dir+"/"+fileName(dir,curr));
    if(!ok) break; prev=curr; curr*=2;
  }
  if(prev===0){return 0}
  // 二分查找最后存在的编号
  let lo=prev, hi=Math.min(curr-1,maxCap);
  while(lo<hi){
    const mid=Math.floor((lo+hi+1)/2);
    const ok=await fileExists(GIF_BASE+dir+"/"+fileName(dir,mid));
    if(ok) lo=mid; else hi=mid-1;
  }
  return lo;
}

async function fetchSections(){
  startSplash()
  if(sections && sections.length){buildItems();return}
  try{
    // 仅使用本地静态索引，避免任何外部 API 依赖
    const localIdx=await fetch(GIF_BASE+"index.json",{cache:'no-store'})
    if(!localIdx.ok) throw new Error('index.json not found')
    const data=await localIdx.json()
    if(!Array.isArray(data.sections) || !data.sections.length) throw new Error('empty sections')
    const dirs=data.sections.map(String)

    // 1) 先探测并渲染第一个分组，避免白屏
    const firstDir=dirs[0]
    const firstCount=await probeCountForDir(firstDir)
    const firstFiles=[]; for(let i=1;i<=firstCount;i++){firstFiles.push(fileName(firstDir,i))}
    sections=[{key:firstDir,title:firstDir,dir:firstDir,files:firstFiles}]
    sectionSelect.value=firstDir
    buildItems()

    // 2) 后台并发探测其余分组，完成后一次性更新 tiles
    const otherDirs=dirs.slice(1)
    const otherSections=await Promise.all(otherDirs.map(async (name)=>{
      const count=await probeCountForDir(name)
      const files=[]; for(let i=1;i<=count;i++){files.push(fileName(name,i))}
      return {key:name,title:name,dir:name,files}
    }))
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
  backTopBtn.style.display=(explorerContent.scrollTop>300)?'flex':'none'
}
if(explorerContent){
  explorerContent.addEventListener('scroll',updateBackTopVisibility,{passive:true})
}
backTopBtn&&backTopBtn.addEventListener('click',()=>{
  if(explorerContent){explorerContent.scrollTo({top:0,behavior:'smooth'})}
  else{window.scrollTo({top:0,behavior:'smooth'})}
})
updateBackTopVisibility()

// Infinite Scroll（绑定到窗口内容滚动）
let isLoading = false
async function handleInfiniteScroll() {
  if (isLoading) return
  if (navState.view!=='folder') return
  const scroller = explorerContent || document.documentElement
  const { scrollTop, scrollHeight, clientHeight } = scroller
  if (scrollHeight - scrollTop - clientHeight < 300) {
    isLoading = true
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
        return
      }
      const nextPage = (currentPage[nextPageKey] || 0) + 1
      renderOneSection(section, nextPage)
    }
    setTimeout(() => { isLoading = false }, 200)
  }
}

if(explorerContent){
  explorerContent.addEventListener('scroll', handleInfiniteScroll, { passive: true })
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
})()
