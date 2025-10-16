function zeroPad(num, size){const s=String(num);return s.length>=size?s:"0".repeat(size-s.length)+s}
let sections=window.MEMETRAY_SECTIONS||[]
const GIF_BASE=location.pathname.includes('/docs/')?'../gifs/':'./gifs/'
const container=document.getElementById("container")
const totalCountEl=document.getElementById("totalCount")
const searchInput=document.getElementById("search")
const sectionSelect=document.getElementById("sectionSelect")
const clearBtn=document.getElementById("clear")
const trayIcon=document.getElementById("trayIcon")
const clockTime=document.getElementById("clock-time")
const clockDate=document.getElementById("clock-date")

function createSection(title){const sec=document.createElement("div");sec.className="section";const h2=document.createElement("h2");h2.textContent=title;const grid=document.createElement("div");grid.className="gallery";sec.appendChild(h2);sec.appendChild(grid);return {sec,grid}}

function buildItems(){container.innerHTML="";let total=0;const q=searchInput.value.trim().toLowerCase();const selected=sectionSelect.value;for(const {key,title,dir,files} of sections){if(selected!=="all"&&selected!==key)continue;const {sec,grid}=createSection(title);const list=files.slice().reverse();for(const id of list){if(q&&id.toLowerCase().indexOf(q)===-1)continue;const href=GIF_BASE+dir+"/"+id;const a=document.createElement("a");a.href=href;a.download=id;const thumb=document.createElement("div");thumb.className="thumb";const img=document.createElement("img");img.src=href;img.alt=id;img.loading="lazy";img.decoding="async";img.onerror=()=>{console.warn("图片加载失败:",href);a.style.display="none"};
thumb.appendChild(img);a.appendChild(thumb);
// 悬停预览：进入显示，离开清空
a.addEventListener("mouseenter",()=>{setTrayIcon(href)})
a.addEventListener("mouseleave",()=>{clearTrayIcon()})
grid.appendChild(a);total++}container.appendChild(sec)}if(totalCountEl){totalCountEl.textContent=String(total)}}
searchInput.addEventListener("input",buildItems)
sectionSelect.addEventListener("change",buildItems)
clearBtn.addEventListener("click",()=>{searchInput.value="";sectionSelect.value="all";buildItems()})

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
  if(sections && sections.length){buildItems();return}
  try{
    // 仅使用本地静态索引，避免任何外部 API 依赖
    const localIdx=await fetch(GIF_BASE+"_index.json",{cache:'no-store'})
    if(localIdx.ok){
      const data=await localIdx.json()
      if(Array.isArray(data.sections)){
        const dirs=data.sections.map(String)
        const results=await Promise.all(dirs.map(async (name)=>{
          const count=await probeCountForDir(name)
          const files=[]; for(let i=1;i<=count;i++){files.push(fileName(name,i))}
          return {key:name,title:name,dir:name,files}
        }))
        sections=results
      }
    }
  }catch(err){console.warn('读取本地索引失败',err)}
  buildItems()
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
