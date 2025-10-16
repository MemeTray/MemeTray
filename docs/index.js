function zeroPad(num, size){const s=String(num);return s.length>=size?s:"0".repeat(size-s.length)+s}
const sections=window.MEMETRAY_SECTIONS||[]
const container=document.getElementById("container")
const searchInput=document.getElementById("search")
const sectionSelect=document.getElementById("sectionSelect")
const clearBtn=document.getElementById("clear")
function createSection(title){const sec=document.createElement("div");sec.className="section";const h2=document.createElement("h2");h2.textContent=title;const grid=document.createElement("div");grid.className="gallery";sec.appendChild(h2);sec.appendChild(grid);return {sec,grid}}
function buildItems(){container.innerHTML="";const q=searchInput.value.trim().toLowerCase();const selected=sectionSelect.value;for(const {key,title,dir,files} of sections){if(selected!=="all"&&selected!==key)continue;const {sec,grid}=createSection(title);for(const id of files){if(q&&id.toLowerCase().indexOf(q)===-1)continue;const href="../gifs/"+dir+"/"+id;const a=document.createElement("a");a.href=href;a.download=id;const img=document.createElement("img");img.src=href;img.alt=id;img.loading="lazy";img.decoding="async";img.onerror=()=>{console.warn("图片加载失败:",href);a.style.display="none"};a.appendChild(img);grid.appendChild(a)}container.appendChild(sec)}}
searchInput.addEventListener("input",buildItems)
sectionSelect.addEventListener("change",buildItems)
clearBtn.addEventListener("click",()=>{searchInput.value="";sectionSelect.value="all";buildItems()})
buildItems()

