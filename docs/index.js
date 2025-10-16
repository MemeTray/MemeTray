function zeroPad(num, size){const s=String(num);return s.length>=size?s:"0".repeat(size-s.length)+s}
let sections=window.MEMETRAY_SECTIONS||[]
const GIF_BASE=location.pathname.includes('/docs/')?'../gifs/':'./gifs/'
const container=document.getElementById("container")
const sectionTiles=document.getElementById("sectionTiles")
const searchInput=null
const sectionSelect={value:'all'}
const clearBtn=null
const trayIcon=document.getElementById("trayIcon")
const clockTime=document.getElementById("clock-time")
const clockDate=document.getElementById("clock-date")

// 加载遮罩
const splash=document.getElementById('splash')
const splashDots=document.getElementById('splashDots')
let splashTimer=null
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

function renderOneSection(secObj){const {key,title,dir,files}=secObj;const list=files.slice().reverse();const shown=list;const {sec,grid}=createSection(title,shown.length);for(const id of shown){const href=GIF_BASE+dir+"/"+id;const a=document.createElement("a");a.href=href;a.download=id;const thumb=document.createElement("div");thumb.className="thumb";const img=document.createElement("img");img.src=href;img.alt=id;img.loading="lazy";img.decoding="async";img.onerror=()=>{console.warn("图片加载失败:",href);a.style.display="none"};thumb.appendChild(img);a.appendChild(thumb);a.addEventListener("mouseenter",()=>{setTrayIcon(href)});a.addEventListener("mouseleave",()=>{clearTrayIcon()});grid.appendChild(a)}container.appendChild(sec)}

function progressiveRender(others){let i=0;const next=()=>{if(i>=others.length)return;const item=others[i++];const cb=()=>{renderOneSection(item);next()};if('requestIdleCallback'in window){requestIdleCallback(cb,{timeout:250})}else{setTimeout(cb,0)}};next()}

function preloadSectionImages(secObj,max=48){const {dir,files}=secObj;const list=files.slice(0,max);for(const id of list){const img=new Image();img.decoding='async';img.loading='eager';img.src=GIF_BASE+dir+"/"+id}}
function preloadOthers(others){let i=0;const tick=()=>{if(i>=others.length)return;preloadSectionImages(others[i++]);if('requestIdleCallback'in window){requestIdleCallback(tick,{timeout:200})}else{setTimeout(tick,0)}};tick()}

function buildItems(){container.innerHTML="";const selected=sectionSelect.value;const first=(selected==="all"?sections[0]:sections.find(s=>s.key===selected));if(first) renderOneSection(first);const others=sections.filter(s=>s!==first);if(selected==="all"){progressiveRender(others)}else{preloadOthers(others)}}
// 输入与清空控件已移除，交互通过顶部方格

// 主题切换已移除

function setTrayIcon(src){trayIcon.innerHTML="";const img=document.createElement("img");img.src=src;img.alt="tray";trayIcon.appendChild(img)}
function clearTrayIcon(){if(trayIcon){trayIcon.innerHTML=""}}

// 时钟
function formatDate(d){const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,'0');const day=String(d.getDate()).padStart(2,'0');return y+"/"+m+"/"+day}
function updateClock(){const d=new Date();const hh=String(d.getHours()).padStart(2,'0');const mm=String(d.getMinutes()).padStart(2,'0');const ss=String(d.getSeconds()).padStart(2,'0');
  if(clockTime) clockTime.textContent=hh+":"+mm+":"+ss;
  if(clockDate) clockDate.textContent=formatDate(d);
}
setInterval(updateClock,1000);updateClock()

function fileName(dir,i){return String(i).padStart(4,'0')+"_"+dir+".gif"}
async function fileExists(url){
  try{
    const u=url+(url.includes('?')?'&':'?')+"t="+Date.now();
    // 先尝试 HEAD，部分静态托管不支持则回退 GET
    const r=await fetch(u,{method:'HEAD',cache:'no-store'}); if(r.ok) return true;
    const r2=await fetch(u,{cache:'no-store'}); return r2.ok;
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
        t.addEventListener('click',()=>{sectionSelect.value=dir;buildItems();window.scrollTo({top:0,behavior:'smooth'})})
        sectionTiles.appendChild(t)
      }
    }

    // 3) 预加载所有分组前 48 张，确保后续切换秒开
    preloadOthers(sections)
    // 完成本地索引探测和首屏渲染后，隐藏遮罩
    stopSplash()

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

// 返回顶部按钮逻辑
const backTopBtn=document.getElementById('backTop')
function onScroll(){
  if(!backTopBtn) return
  backTopBtn.style.display=(window.scrollY>300)?'flex':'none'
}
window.addEventListener('scroll',onScroll,{passive:true})
backTopBtn&&backTopBtn.addEventListener('click',()=>{window.scrollTo({top:0,behavior:'smooth'})})
onScroll()
