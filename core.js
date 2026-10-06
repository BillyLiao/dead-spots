// Dead Spots — 不碰畫面的純邏輯。index.html 用 <script src> 載入（共用全域），測試用 require 載入。
/* ============ music core ============ */
const OPEN=[40,45,50,55,59,64]; // 6弦→1弦 (E A D G B e)
const LETTERS=['C','D','E','F','G','A','B'], NAT=[0,2,4,5,7,9,11], MAJ=[0,2,4,5,7,9,11];
const PCNAME=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const mod=(n,m)=>((n%m)+m)%m;
function spell(L,pc){let a=mod(pc-NAT[L],12);if(a>6)a-=12;return LETTERS[L]+(a>0?'♯'.repeat(a):'♭'.repeat(-a));}
// 和弦名稱用：避免重升 / 重降（B♭♭ → A），單一升降維持樂理拼法
function spellSimple(L,pc){let a=mod(pc-NAT[L],12);if(a>6)a-=12;if(Math.abs(a)<2)return spell(L,pc);for(const d of[1,-1]){const L2=mod(L+(a>0?d:-d),7);let b=mod(pc-NAT[L2],12);if(b>6)b-=12;if(Math.abs(b)<2)return spell(L2,pc);}return PCNAME[pc];}
function parseKey(s){const L=LETTERS.indexOf(s[0]);let a=0;for(const c of s.slice(1)){if(c==='#')a++;if(c==='b')a--;}return{L,pc:mod(NAT[L]+a,12)};}

const QD={maj:'',m:'m',maj7:'maj7',m7:'m7','7':'7',mMaj7:'m(maj7)',add9:'add9',madd9:'m(add9)','9':'9',m9:'m9',maj9:'maj9','6':'6',m6:'m6','69':'6/9',m11:'m11',m7b5:'m7♭5',dim:'°',dim7:'°7',aug:'+','5':'5',sus2:'sus2',sus4:'sus4','7sus4':'7sus4','maj7#11':'maj7♯11',add11:'add11',madd11:'m(add11)',maj7no3:'maj7(no3)','7no3':'7(no3)',root:'單音'};
const qLabel=q=>q==null?'未辨識':q==='maj'?'maj':QD[q];
const QTABLE={'4':'maj','3':'m','4,11':'maj7','3,10':'m7','4,10':'7','3,11':'mMaj7','2,4':'add9','2,3':'madd9','2':'sus2','5':'sus4','5,10':'7sus4','2,4,11':'maj9','2,3,10':'m9','2,4,10':'9','4,9':'6','3,9':'m6','2,4,9':'69','3,6':'dim','3,6,10':'m7b5','3,6,9':'dim7','4,8':'aug','4,6,11':'maj7#11','2,4,6,11':'maj7#11','3,5,10':'m11','2,3,5,10':'m11','4,5':'add11','3,5':'madd11','11':'maj7no3','2,11':'maj7no3','10':'7no3'};
const QUAL_OPTIONS=['maj','m','maj7','m7','7','mMaj7','add9','madd9','9','m9','maj9','6','m6','69','m11','m7b5','dim','dim7','aug','5','sus2','sus4','7sus4','maj7#11','add11','madd11'];

function rootMidi(f,r){return OPEN[r]+f[r];}
function rels(f,r){const rm=rootMidi(f,r);return f.map((x,i)=>x<0?null:mod(OPEN[i]+x-rm,12));}
function relSet(f,r){return new Set(rels(f,r).filter(x=>x!=null));}
function detectQ(f,r){
  if(r==null||f[r]<0)return null;
  const s=relSet(f,r);const has5=s.has(7);s.delete(7);s.delete(0);
  const k=[...s].sort((a,b)=>a-b).join(',');
  if(k==='')return has5?'5':'root';
  return QTABLE[k]||null;
}
function fam(rel,set){
  if(rel===0)return'r';if(rel===3||rel===4)return't';if(rel===7)return'f';
  if(rel===6)return(set.has(7)||(set.has(11)&&set.has(4)))?'x':'f';
  if(rel===8)return set.has(7)?'x':'f';
  if(rel===10||rel===11)return's';
  if(rel===9&&set.has(3)&&set.has(6)&&!set.has(7))return's';
  return'x';
}
function degLabel(rel,set){
  const has3=set.has(3)||set.has(4);
  switch(rel){case 0:return'1';case 1:return'♭9';case 2:return has3?'9':'2';case 3:return'♭3';case 4:return'3';
  case 5:return has3?'11':'4';case 6:return(set.has(7)||(set.has(11)&&set.has(4)))?'♯11':'♭5';case 7:return'5';case 8:return set.has(7)?'♭13':'♯5';
  case 9:return(set.has(3)&&set.has(6)&&!set.has(7))?'°7':'6';case 10:return'♭7';case 11:return'7';}
}
function bassIdx(f){return f.findIndex(x=>x>=0);}
function topIdx(f){for(let i=5;i>=0;i--)if(f[i]>=0)return i;return -1;}
function invName(rel){if(rel===0)return'原位';if(rel===3||rel===4)return'第一轉位';if(rel===6||rel===7||rel===8)return'第二轉位';if(rel===10||rel===11)return'第三轉位';return'其他低音';}
function invCode(rel){if(rel===0)return'1';if(rel===3||rel===4)return'3';if(rel>=6&&rel<=8)return'5';if(rel===10||rel===11)return'7';return'x';}
const strNo=i=>6-i;
const fretted=f=>f.filter(x=>x>0);
const hasOpen=f=>f.some(x=>x===0);
function centerOf(f){const fr=fretted(f);return fr.length?fr.reduce((a,b)=>a+b,0)/fr.length:1.5;}
function placements(sh,pc){
  const f=sh.frets,base=mod(pc-rootMidi(f,sh.root),12);
  if(hasOpen(f))return base===0?[0]:[];
  const fr=fretted(f);if(!fr.length)return[];
  const lo=Math.min(...fr),hi=Math.max(...fr),out=[];
  for(let d=base-24;d<=24;d+=12)if(lo+d>=1&&hi+d<=17)out.push(d);
  return out;
}
const shifted=(f,d)=>f.map(x=>x>0?x+d:x);
const REL_STEP=[0,1,1,2,2,3,4,4,5,5,6,6];
function noteNameRel(rootL,rootPc,rel){return spellSimple(mod(rootL+REL_STEP[rel],7),mod(rootPc+rel,12));}

/* ============ builtin shapes ============ */
const BUILTIN_RAW=[
 ['b-maj-e','E 型封閉',[1,3,3,2,1,1],0],['b-maj-a','A 型封閉',[-1,1,3,3,3,1],1],
 ['b-maj-gbe0','高三弦',[-1,-1,-1,5,5,3],3],['b-maj-gbe1','高三弦',[-1,-1,-1,9,8,8],5],['b-maj-gbe2','高三弦',[-1,-1,-1,5,6,5],4],
 ['b-maj-dgb0','中三弦',[-1,-1,5,4,3,-1],2],['b-maj-dgb1','中三弦',[-1,-1,9,7,8,-1],4],['b-maj-dgb2','中三弦',[-1,-1,5,5,5,-1],3],
 ['b-m-e','E 型封閉',[1,3,3,1,1,1],0],['b-m-a','A 型封閉',[-1,1,3,3,2,1],1],
 ['b-m-gbe0','高三弦',[-1,-1,-1,5,4,3],3],['b-m-gbe1','高三弦',[-1,-1,-1,8,8,8],5],['b-m-gbe2','高三弦',[-1,-1,-1,5,6,4],4],
 ['b-m-dgb0','中三弦',[-1,-1,5,3,3,-1],2],
 ['b-maj7-e','E 根 drop',[1,-1,2,2,1,-1],0],['b-maj7-a','A 型封閉',[-1,1,3,2,3,1],1],['b-maj7-ash','Shell',[-1,3,-1,4,5,-1],1],['b-maj7-d','D 根',[-1,-1,5,7,7,7],2],
 ['b-m7-e','E 型封閉',[1,3,1,1,1,1],0],['b-m7-a','A 型封閉',[-1,1,3,1,2,1],1],['b-m7-esh','Shell',[1,-1,1,1,-1,-1],0],['b-m7-ash','Shell',[-1,3,-1,3,4,-1],1],
 ['b-7-e','E 型封閉',[1,3,1,2,1,1],0],['b-7-a','A 型封閉',[-1,1,3,1,3,1],1],['b-7-esh','Shell',[1,-1,1,2,-1,-1],0],
 ['b-m9-a','A 根',[-1,3,1,3,3,-1],1],['b-maj9-a','A 根',[-1,3,2,4,3,-1],1],
 ['b-sus2-a','A 型',[-1,3,5,5,3,3],1],['b-sus4-a','A 型',[-1,1,3,3,4,1],1],['b-add9-d','D 根',[-1,-1,5,4,3,5],2],
 ['b-m6-a','A 根',[-1,3,1,2,1,-1],1],['b-m7b5-a','A 根',[-1,3,4,3,4,-1],1],['b-mmaj7-a','A 型',[-1,3,5,4,4,3],1],
 ['b-5-e','Power',[1,3,3,-1,-1,-1],0],['b-5-a','Power',[-1,1,3,3,-1,-1],1],
 ['b-o-cadd9','開放弦',[-1,3,2,0,3,3],1],['b-o-fmaj7s11','開放弦',[1,-1,2,2,0,0],0],['b-o-asus2','開放弦',[-1,0,2,2,0,0],1],
 ['b-o-em7','開放弦',[0,2,2,0,3,3],0],['b-o-amaj7','開放弦',[-1,0,2,1,2,0],1],
];
const BUILTIN=BUILTIN_RAW.map(([id,tag,frets,root])=>({id,name:'',tag,frets,root,src:'builtin',fixedQ:''}));

/* ============ progressions ============ */
const STYLES=[['indie','indie'],['dream','dream pop'],['triphop','trip hop'],['postpunk','post-punk'],['shoegaze','shoegaze']];
const STYLE_BPM={indie:[116,20],dream:[90,18],triphop:[84,11],postpunk:[140,18],shoegaze:[104,26]};
const PROGS=[
 ['I V vi IV',5,'indie dream','大調','最安全的四和弦。換成你庫裡少用的轉位就不無聊。'],
 ['vi IV I V',4,'indie','大調','從 vi 開始，聽起來偏小調但會往上走。'],
 ['I iii vi IV',3,'indie dream','大調','iii 讓 I 跟 vi 之間有一層霧。'],
 ['IV I V vi',3,'indie','大調','從下屬開始，像句子沒有主詞。'],
 ['I V/3 vi IV',2,'indie dream','大調','V 用第一轉位，低音一路往下走。'],
 ['Imaj7 IVmaj7',5,'dream indie','大調','兩和弦漂浮。重點在右手跟音色，不在和聲。'],
 ['Imaj7 iii7 vi7 IVmaj7',3,'dream','大調','全部都是七和弦，降低每個和弦的「答案感」。'],
 ['I iii IV iv',4,'dream indie shoegaze','大調・借用 iv','最後的 iv 是小調借來的，那一下的失落感就是重點。'],
 ['I IV iv I',3,'shoegaze dream','大調・借用 iv','IV → iv 只動一個音（3 降成 ♭3）。'],
 ['I bVII IV I',4,'shoegaze indie','Mixolydian','♭VII 讓大調不那麼亮。'],
 ['I bVI bVII I',3,'shoegaze','大調・借用','♭VI ♭VII 從小調借，衝回 I 會很寬。'],
 ['I III vi IV',2,'shoegaze dream','大調・半音中音','III 是大三和弦，不在調內，製造一瞬間的偏移。'],
 ['Iadd9 IVadd9',4,'shoegaze dream','大調','加九音保持空心，適合大量 reverb / fuzz 底下的和聲。'],
 ['Imaj7 II',3,'dream','Lydian','II 是大三和弦，帶出 ♯4 的懸浮感。'],
 ['IVmaj7 iii7 ii7 Imaj7',2,'dream','大調','一路往下的七和弦，沒有 V 的拉力。'],
 ['Isus2 vi7 IVmaj7 iv6',2,'dream shoegaze','大調・借用 iv','開頭不給三音，結尾的 iv6 是小調色彩。'],
 ['i bVII bVI bVII',4,'postpunk shoegaze','Aeolian','小調循環，不回到 V。'],
 ['i bVI bIII bVII',5,'postpunk indie','Aeolian','很常見的小調四和弦，低音大跳。'],
 ['i iv',3,'postpunk triphop','小調','兩和弦。留空間給貝斯線。'],
 ['i bIII bVII IV',3,'postpunk indie','Dorian','最後的 IV 是大三和弦，Dorian 的亮點。'],
 ['i bII',2,'postpunk triphop','Phrygian','半音往上再回來，很緊。'],
 ['i5 bVI5 bIII5 bVII5',3,'postpunk shoegaze','Aeolian','Power chord 版本。注意悶音跟下撥的一致性。'],
 ['i IV',3,'postpunk triphop','Dorian','小調 i 對大調 IV，冷裡帶一點光。'],
 ['i v bVI bVII',2,'postpunk','Aeolian','v 是小三和弦，沒有導音，不會被拉回去。'],
 ['i7 iv7',4,'triphop','小調','慢、重、留白。m7 的 shell 指型很好用。'],
 ['i9 bVImaj7',4,'triphop dream','Aeolian','兩個都是延伸和弦，音色比和聲重要。'],
 ['i bVI V',3,'triphop','和聲小調','V 是大三和弦（和聲小調），有電影感的張力。'],
 ['i imaj7 i7 i6',3,'triphop dream','小調・Line cliché','只有一個聲部半音往下走，其他不動。'],
 ['i7 bIImaj7',2,'triphop','Phrygian','暗、靠近、有點不安。'],
 ['i7 IV7',3,'triphop','Dorian','IV7 是屬七和弦，帶一點 soul。'],
 ['i7 bVImaj7 bIIImaj7 bVII',2,'triphop dream','Aeolian','小調配大七和弦，冷暖並存。'],
 ['iv7 i7 bVImaj7 V7',2,'triphop','和聲小調','從 iv 開始，最後被 V7 拉回去。'],
 ['iadd9 bVImaj7',3,'shoegaze dream','小調','小調加九音，比 m7 更模糊。'],
].map(([ch,w,st,mode,feel])=>({ch:ch.split(' '),w,st:st.split(' '),mode,feel,minor:ch[0]==='i'}));
const MAJOR_KEYS=[['E',10],['A',10],['D',9],['G',9],['C',7],['B',5],['F',4],['F#',3],['Bb',3],['Eb',3],['Ab',2],['Db',2]];
const MINOR_KEYS=[['E',10],['A',10],['B',7],['D',7],['F#',6],['C#',5],['G',5],['C',4],['F',3],['G#',2],['Bb',2],['Eb',2]];
const NUMS=['I','II','III','IV','V','VI','VII'];
const QMAP_L={'':'m','7':'m7','maj7':'mMaj7','add9':'madd9','9':'m9','6':'m6','11':'m11','ø7':'m7b5','°':'dim','5':'5','sus2':'sus2','sus4':'sus4'};
const QMAP_U={'':'maj','7':'7','maj7':'maj7','add9':'add9','9':'9','maj9':'maj9','6':'6','maj7#11':'maj7#11','5':'5','sus2':'sus2','sus4':'sus4','6/9':'69'};
function parseRoman(tok){
  const m=tok.match(/^([b#]?)(VII|VI|V|IV|III|II|I|vii|vi|v|iv|iii|ii|i)(.*)$/);
  let[,acc,num,suf]=m;let inv=null;const sl=suf.indexOf('/');if(sl>=0){inv=suf.slice(sl+1);suf=suf.slice(0,sl);}
  const lower=num!==num.toUpperCase(),step=NUMS.indexOf(num.toUpperCase());
  const semi=mod(MAJ[step]+(acc==='b'?-1:acc==='#'?1:0),12);
  const q=(lower?QMAP_L:QMAP_U)[suf]??(lower?'m':'maj');
  return{tok,step,semi,q,inv};
}
const prettyRn=t=>t.replace(/^b/,'♭').replace(/^#/,'♯').replace('#','♯');
const COMPAT={maj:['maj','add9','sus2','69','6','maj7','5'],m:['m','madd9','m7','m11','5'],maj7:['maj7','maj9','maj7#11','maj7no3','maj'],m7:['m7','m9','m11','m'],'7':['7','9','7sus4','7no3','maj'],mMaj7:['mMaj7','m'],add9:['add9','sus2','maj9','maj'],madd9:['madd9','m9','m'],'9':['9','7'],m9:['m9','m7','madd9','m11'],maj9:['maj9','maj7','add9'],'6':['6','69','maj'],m6:['m6','m'],m11:['m11','m7','m9'],m7b5:['m7b5','dim'],dim:['dim','m7b5','dim7'],'5':['5','maj','m'],sus2:['sus2','add9'],sus4:['sus4','7sus4','maj'],'maj7#11':['maj7#11','maj7','maj9'],'69':['69','6','add9']};

/* ============ shared pure helpers ============ */
const shapeQ=s=>s.fixedQ||detectQ(s.frets,s.root);
function weighted(arr,rand=Math.random){const t=arr.reduce((a,b)=>a+b.w,0);let x=rand()*t;for(const a of arr){x-=a.w;if(x<=0)return a;}return arr[arr.length-1];}
function genBpm(style,rand=Math.random){const[c,sp]=STYLE_BPM[style];return Math.round(c+(rand()+rand()-1)*sp);}
function pickKey(minor,rand=Math.random){return weighted((minor?MINOR_KEYS:MAJOR_KEYS).map(([k,w])=>({k,w})),rand).k;}
function buildChords(prog,key){
  const K=parseKey(key);
  return prog.ch.map(tok=>{
    const c=parseRoman(tok);const L=mod(K.L+c.step,7),pc=mod(K.pc+c.semi,12);
    let name=spellSimple(L,pc)+QD[c.q];
    if(c.inv){const rel=c.inv==='3'?(['m','m7','m9','madd9','m6','m11','mMaj7','dim','m7b5'].includes(c.q)?3:4):7;name+='/'+noteNameRel(L,pc,rel);}
    return{...c,L,pc,name,v:null};
  });
}
// 兩個指型之間的聲部移動：低音（實際最低音）和最高音各移動幾個半音。
function voiceMove(a,b){
  const p=f=>f.map((x,i)=>x<0?null:OPEN[i]+x).filter(x=>x!=null);
  const pa=p(a),pb=p(b);if(!pa.length||!pb.length)return 0;
  return Math.abs(Math.min(...pa)-Math.min(...pb))+Math.abs(Math.max(...pa)-Math.max(...pb));
}
// 從 shapes 裡挑一個能彈和弦 c 的指型，並決定放在哪一格。
// ctx.anchor：這組和弦的把位（格數中心）；ctx.prev：前一個和弦的指型（可省略）。也可以直接傳數字當 anchor。
// 規則：
// 1. 列出所有「指型 × 可放的把位」。換指型時（excludeId）有別的選擇就先排除目前這個。
// 2. 性質完全符合的指型如果離把位不遠（比最近的候選多 3 格以內），只用完全符合的。
// 3. 只留離把位最近的那一圈（最近距離 + 1.5 格內），讓整組和弦待在同一個把位。
// 4. 圈內依 優先權（盲區 6、自訂 3、內建 1）× 性質符合度 × 轉位需求 × 聲部移動少 加權抽一個。
function pickVoicingFrom(shapes,prioFn,c,ctx,excludeId,rand=Math.random){
  if(typeof ctx==='number')ctx={anchor:ctx};
  const anchor=ctx.anchor,prev=ctx.prev||null;
  const chain=COMPAT[c.q]||[c.q];
  let all=[];
  for(const sh of shapes){
    const idx=chain.indexOf(shapeQ(sh));if(idx<0)continue;
    for(const d of placements(sh,c.pc)){
      const f=shifted(sh.frets,d),center=centerOf(f);
      all.push({sh,f,idx,center,dist:Math.abs(center-anchor)});
    }
  }
  if(excludeId&&all.some(x=>x.sh.id!==excludeId))all=all.filter(x=>x.sh.id!==excludeId);
  if(!all.length)return null;
  const minDist=xs=>Math.min(...xs.map(x=>x.dist));
  const exact=all.filter(x=>x.idx===0);
  let pool=exact.length&&minDist(exact)<=minDist(all)+3?exact:all;
  const near=minDist(pool);pool=pool.filter(x=>x.dist<=near+1.5);
  for(const x of pool){
    let w=prioFn(x.sh)*(x.idx===0?3:1/(1+x.idx))/(1+x.dist/2);
    if(c.inv){const r=rels(x.sh.frets,x.sh.root);w*=invCode(r[bassIdx(x.sh.frets)])===c.inv?5:0.4;}
    if(prev)w/=1+voiceMove(prev.frets,x.f)/3;
    x.w=w;
  }
  const p=weighted(pool,rand);
  return{id:p.sh.id,frets:p.f,root:p.sh.root,q:shapeQ(p.sh),center:p.center};
}
// 幫一整組和弦挑指型：第一個和弦落在 startAnchor 附近並決定這組的把位，之後每個和弦都待在這個把位、參考前一個和弦的聲部。
function voiceProgression(shapes,prioFn,chords,startAnchor,rand=Math.random){
  let anchor=startAnchor,prev=null;const out=[];
  chords.forEach((c,i)=>{
    const v=pickVoicingFrom(shapes,prioFn,c,{anchor,prev},null,rand);
    if(v){if(!prev)anchor=v.center;prev=v;}
    out.push(v);
  });
  out.anchor=anchor;
  return out;
}
// 盲區練習的出題權重。recentIndex：最近出過的第幾題（-1 = 沒出過）。
function drillWeightOf(prio,n,miss,recentIndex){
  let w=prio*(1+2*((miss+1)/(n+2)));
  if(!n)w*=1.3;
  if(recentIndex>=0)w*=0.05*(recentIndex+1);
  return w;
}

/* ============ shape identity ============ */
// 判斷是不是同一個指型：
// - 可移動指型（沒有空弦）：不管在哪個把位都算同一個，只比相對格位。
// - 有空弦的指型：空弦不會跟著移動，位置不同聲音就不同，要完全一樣才算。
// - 根音標在不同弦，級數就不同（例如 Am7 vs C6），算不同指型。
function shapeKey(sh){
  const f=sh.frets;
  if(hasOpen(f))return'o|'+f.join(',')+'|r'+sh.root;
  const fr=fretted(f),lo=fr.length?Math.min(...fr):0;
  return'm|'+f.map(x=>x<0?'x':x-lo).join(',')+'|r'+sh.root;
}
const sameShape=(a,b)=>shapeKey(a)===shapeKey(b);
function findDuplicate(sh,shapes){return shapes.find(o=>o.id!==sh.id&&sameShape(o,sh))||null;}
function duplicateGroups(shapes){
  const m=new Map();
  for(const s of shapes){const k=shapeKey(s);if(!m.has(k))m.set(k,[]);m.get(k).push(s);}
  return[...m.values()].filter(g=>g.length>1);
}
// 兩個重複指型留哪一個：有自訂的就留自訂（名稱、筆記在那邊）；都是自訂就留比較早建立的。兩個都是內建回傳 null。
function pickKeeper(a,b){
  if(a.src==='builtin'&&b.src==='builtin')return null;
  if(a.src==='builtin')return{keep:b,drop:a};
  if(b.src==='builtin')return{keep:a,drop:b};
  return(a.created||0)<=(b.created||0)?{keep:a,drop:b}:{keep:b,drop:a};
}
// 合併後留下的指型（新物件）：名稱用留下那個的、沒有就用另一個的；筆記合併去重；任一個是盲區就是盲區。
function mergeShapeData(keep,drop,dropBlind){
  const notes=[...new Set([keep.notes,drop.notes].map(x=>(x||'').trim()).filter(Boolean))];
  return{...keep,name:keep.name||drop.name||'',notes:notes.join(' / '),blind:!!keep.blind||!!dropBlind,fixedQ:keep.fixedQ||drop.fixedQ||''};
}
function mergeStats(a,b){
  if(!a&&!b)return null;
  const z={n:0,miss:0,last:0};a=a||z;b=b||z;
  return{n:a.n+b.n,miss:a.miss+b.miss,last:Math.max(a.last||0,b.last||0)};
}

// 合併兩個重複指型，回傳新的 {chords, flags, stats}（不改傳入的 state）。
// 留下自訂的那個；被合併掉的若是內建就標成隱藏，若是自訂就刪掉。isBlindFn(shape) 判斷盲區。
function applyMerge(state,a,b,isBlindFn){
  const plan=pickKeeper(a,b);if(!plan)return null;
  const{keep,drop}=plan;
  if(!state.chords.some(c=>c.id===keep.id))return null;
  const merged=mergeShapeData(keep,drop,isBlindFn(drop));
  let chords=state.chords.map(c=>c.id===keep.id?merged:c);
  const flags={...state.flags},stats={...state.stats};
  const st=mergeStats(stats[keep.id],stats[drop.id]);if(st)stats[keep.id]=st;
  delete stats[drop.id];
  if(drop.src==='custom')chords=chords.filter(c=>c.id!==drop.id);
  else flags[drop.id]={hidden:true};
  return{state:{chords,flags,stats},keepId:keep.id,dropId:drop.id};
}
// 刪掉一個自訂指型時，讓之前被它取代（隱藏）的內建指型重新出現。
function unhideCovered(flags,deleted,builtins){
  const out={...flags};
  for(const b of builtins)if(out[b.id]&&out[b.id].hidden&&sameShape(b,deleted))delete out[b.id];
  return out;
}

if(typeof module!=='undefined')module.exports={OPEN,LETTERS,NAT,PCNAME,mod,spell,spellSimple,parseKey,QD,qLabel,QTABLE,QUAL_OPTIONS,rootMidi,rels,relSet,detectQ,fam,degLabel,bassIdx,topIdx,invName,invCode,strNo,fretted,hasOpen,centerOf,placements,shifted,noteNameRel,
  BUILTIN,STYLES,STYLE_BPM,PROGS,MAJOR_KEYS,MINOR_KEYS,parseRoman,prettyRn,COMPAT,
  shapeQ,weighted,genBpm,pickKey,buildChords,pickVoicingFrom,voiceMove,voiceProgression,drillWeightOf,
  shapeKey,sameShape,findDuplicate,duplicateGroups,pickKeeper,mergeShapeData,mergeStats,applyMerge,unhideCovered};
