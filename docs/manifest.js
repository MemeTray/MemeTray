(function(){
function generateSequentialFilenames(groupSuffix,start,end){const list=[];for(let i=start;i<=end;i++){list.push(String(i).padStart(4,'0')+"_"+groupSuffix+".gif");}return list}
window.MEMETRAY_SECTIONS=[
{key:"doro", title:"doro", dir:"doro", files: generateSequentialFilenames("doro",1,185)},
{key:"genshin", title:"genshin", dir:"genshin", files: generateSequentialFilenames("genshin",1,3)},
{key:"maodie", title:"maodie", dir:"maodie", files: generateSequentialFilenames("maodie",1,14)},
{key:"maomaochong", title:"maomaochong", dir:"maomaochong", files: generateSequentialFilenames("maomaochong",1,349)}
]
})();

