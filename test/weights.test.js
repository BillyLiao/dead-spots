const test=require('node:test');const assert=require('node:assert/strict');
const C=require('../core.js');
const {seq,seeded}=require('./helpers.js');

test('weighted：依權重選，亂數在邊界時選第一個 / 最後一個',()=>{
  const arr=[{id:'a',w:1},{id:'b',w:3}];
  assert.equal(C.weighted(arr,seq(0)).id,'a');
  assert.equal(C.weighted(arr,seq(0.24)).id,'a');
  assert.equal(C.weighted(arr,seq(0.26)).id,'b');
  assert.equal(C.weighted(arr,seq(0.999999)).id,'b');
});

test('weighted：大量抽樣時比例接近權重',()=>{
  const arr=[{id:'a',w:1},{id:'b',w:3}],rand=seeded(42);let b=0;
  for(let i=0;i<20000;i++)if(C.weighted(arr,rand).id==='b')b++;
  assert.ok(Math.abs(b/20000-0.75)<0.02,'b 比例 '+b/20000);
});

test('drillWeightOf：卡住比例越高權重越高',()=>{
  assert.ok(C.drillWeightOf(1,10,8,-1)>C.drillWeightOf(1,10,2,-1));
});

test('drillWeightOf：沒練過的有加成，盲區優先權放大權重',()=>{
  assert.ok(C.drillWeightOf(1,0,0,-1)>C.drillWeightOf(1,2,1,-1));   // 同樣 50% 卡住率的估計，沒練過 ×1.3
  assert.equal(C.drillWeightOf(6,4,1,-1),6*C.drillWeightOf(1,4,1,-1));
});

test('drillWeightOf：剛出過的題目大幅降權，越久以前出的降得越少',()=>{
  const base=C.drillWeightOf(1,4,1,-1);
  assert.ok(C.drillWeightOf(1,4,1,0)<base*0.1);
  assert.ok(C.drillWeightOf(1,4,1,0)<C.drillWeightOf(1,4,1,3));
});

// 測試用指型
const mk=(id,frets,root,extra={})=>({id,name:'',frets,root,src:'custom',fixedQ:'',...extra});
const chordOf=(pc,q,inv=null)=>({pc,q,inv});

test('pickVoicingFrom：沒有可用指型時回傳 null',()=>{
  assert.equal(C.pickVoicingFrom([],()=>1,chordOf(0,'maj'),5),null);
  const onlyMinor=[mk('m',[1,3,3,1,1,1],0)];
  assert.equal(C.pickVoicingFrom(onlyMinor,()=>1,chordOf(0,'maj7'),5),null);
});

test('pickVoicingFrom：選出的指型根音就是和弦根音',()=>{
  const shapes=C.BUILTIN,rand=seeded(7);
  for(let pc=0;pc<12;pc++)for(const q of ['maj','m','maj7','m7','7']){
    const v=C.pickVoicingFrom(shapes,()=>1,chordOf(pc,q),5,null,rand);
    assert.ok(v);
    assert.equal(C.mod(C.rootMidi(v.frets,v.root),12),pc,`${pc} ${q}`);
  }
});

test('pickVoicingFrom：性質完全符合的優先於替代性質',()=>{
  const exact=mk('exact',[-1,3,2,4,3,-1],1);  // maj9 → 替代
  const maj7=mk('maj7',[-1,3,-1,4,5,-1],1);   // maj7 → 完全符合
  let hits=0;const rand=seeded(3);
  for(let i=0;i<500;i++)if(C.pickVoicingFrom([exact,maj7],()=>1,chordOf(0,'maj7'),3,null,rand).id==='maj7')hits++;
  assert.ok(hits>400,'maj7 只被選了 '+hits+' 次');
});

test('pickVoicingFrom：優先權高的（盲區）被選中的機率較高',()=>{
  const a=mk('blind',[-1,3,-1,4,5,-1],1),b=mk('plain',[-1,3,5,4,5,3],1);  // 兩個都在第 3–5 格
  const prio=s=>s.id==='blind'?6:1;let hits=0;const rand=seeded(9);
  for(let i=0;i<1000;i++)if(C.pickVoicingFrom([a,b],prio,chordOf(0,'maj7'),5,null,rand).id==='blind')hits++;
  assert.ok(hits>700,'盲區只被選了 '+hits+' 次');
});

test('pickVoicingFrom：要求轉位時偏好低音符合的指型',()=>{
  const rootPos=mk('root',[-1,-1,5,4,3,-1],2),first=mk('first',[-1,-1,9,7,8,-1],4);
  let hits=0;const rand=seeded(11);
  for(let i=0;i<500;i++)if(C.pickVoicingFrom([rootPos,first],()=>1,chordOf(7,'maj','3'),6,null,rand).id==='first')hits++;
  assert.ok(hits>400,'第一轉位只被選了 '+hits+' 次');
});

test('pickVoicingFrom：「換指型」時盡量避開目前這個',()=>{
  const a=mk('a',[-1,3,-1,4,5,-1],1),b=mk('b',[1,-1,2,2,1,-1],0);
  let same=0;const rand=seeded(5);
  for(let i=0;i<500;i++)if(C.pickVoicingFrom([a,b],()=>1,chordOf(0,'maj7'),5,'a',rand).id==='a')same++;
  assert.ok(same<50,'還是選到原本的 '+same+' 次');
});

test('pickVoicingFrom：手動指定的性質（fixedQ）優先於自動判斷',()=>{
  const forced=mk('forced',[1,3,3,2,1,1],0,{fixedQ:'maj7'});
  const v=C.pickVoicingFrom([forced],()=>1,chordOf(5,'maj7'),3);
  assert.equal(v.id,'forced');
});
