function zeroPad(num, size){const s=String(num);return s.length>=size?s:"0".repeat(size-s.length)+s}
const sections=window.MEMETRAY_SECTIONS||[]
const GIF_BASE=location.pathname.includes('/docs/')?'../gifs/':'./gifs/'
const container=document.getElementById("container")
const searchInput=document.getElementById("search")
const sectionSelect=document.getElementById("sectionSelect")
const clearBtn=document.getElementById("clear")
const trayIcon=document.getElementById("trayIcon")
const clockTime=document.getElementById("clock-time")
const clockDate=document.getElementById("clock-date")

function createSection(title){const sec=document.createElement("div");sec.className="section";const h2=document.createElement("h2");h2.textContent=title;const grid=document.createElement("div");grid.className="gallery";sec.appendChild(h2);sec.appendChild(grid);return {sec,grid}}

function buildItems(){container.innerHTML="";const q=searchInput.value.trim().toLowerCase();const selected=sectionSelect.value;for(const {key,title,dir,files} of sections){if(selected!=="all"&&selected!==key)continue;const {sec,grid}=createSection(title);const list=files.slice().reverse();for(const id of list){if(q&&id.toLowerCase().indexOf(q)===-1)continue;const href=GIF_BASE+dir+"/"+id;const a=document.createElement("a");a.href=href;a.download=id;const thumb=document.createElement("div");thumb.className="thumb";const img=document.createElement("img");img.src=href;img.alt=id;img.loading="lazy";img.decoding="async";img.onerror=()=>{console.warn("图片加载失败:",href);a.style.display="none"};
thumb.appendChild(img);a.appendChild(thumb);
// 悬停预览：仅托盘图标
a.addEventListener("mouseenter",()=>{setTrayIcon(href)})
grid.appendChild(a)}container.appendChild(sec)}}
searchInput.addEventListener("input",buildItems)
sectionSelect.addEventListener("change",buildItems)
clearBtn.addEventListener("click",()=>{searchInput.value="";sectionSelect.value="all";buildItems()})

// 主题切换已移除

function setTrayIcon(src){trayIcon.innerHTML="";const img=document.createElement("img");img.src=src;img.alt="tray";trayIcon.appendChild(img)}

// 时钟
function formatDate(d){const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,'0');const day=String(d.getDate()).padStart(2,'0');return y+"/"+m+"/"+day}
function updateClock(){const d=new Date();const hh=String(d.getHours()).padStart(2,'0');const mm=String(d.getMinutes()).padStart(2,'0');const ss=String(d.getSeconds()).padStart(2,'0');
  if(clockTime) clockTime.textContent=hh+":"+mm+":"+ss;
  if(clockDate) clockDate.textContent=formatDate(d);
}
setInterval(updateClock,1000);updateClock()
buildItems()

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
