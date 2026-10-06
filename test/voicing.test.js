const test=require('node:test');const assert=require('node:assert/strict');
const C=require('../core.js');
const {seeded}=require('./helpers.js');
const B=id=>C.BUILTIN.find(b=>b.id===id);

test('voiceMove：低音和最高音各移動幾個半音',()=>{
  // C 高三弦原位（G5 B5 e3 = 60 64 67）→ G 第一轉位（G4 B3 e3 = 59 62 67）
  assert.equal(C.voiceMove([-1,-1,-1,5,5,3],[-1,-1,-1,4,3,3]),1);
  assert.equal(C.voiceMove([-1,-1,-1,5,5,3],[-1,-1,-1,5,5,3]),0);
  // 低音以實際音高最低的為準，不是最低的那條弦（6弦第10格 50 > 5弦空弦 45）
  assert.equal(C.voiceMove([10,0,-1,-1,-1,-1],[-1,0,-1,-1,-1,-1]),0+5);
});

test('C → G：挑同一個把位、移動最少的轉位（第一轉位 4-3-3），不跑到別的把位',()=>{
  const triads=['b-maj-gbe0','b-maj-gbe1','b-maj-gbe2'].map(B);
  const prev={frets:[-1,-1,-1,5,5,3],root:3,center:C.centerOf([-1,-1,-1,5,5,3])};
  const rand=seeded(4);let hits=0;
  for(let i=0;i<500;i++){
    const v=C.pickVoicingFrom(triads,()=>1,{pc:7,q:'maj'},{anchor:prev.center,prev},null,rand);
    if(v.frets.join()==='-1,-1,-1,4,3,3')hits++;
  }
  assert.equal(hits,500);
});

// 某個和弦在 anchor 附近「庫裡能做到的最近距離」（只看完全符合性質的指型；沒有的話看替代性質）
function nearestPossible(shapes,c,anchor){
  const chain=C.COMPAT[c.q];let best=[Infinity,Infinity];
  for(const sh of shapes){const idx=chain.indexOf(C.shapeQ(sh));if(idx<0)continue;
    for(const d of C.placements(sh,c.pc)){const dist=Math.abs(C.centerOf(C.shifted(sh.frets,d))-anchor);const t=idx===0?0:1;if(dist<best[t])best[t]=dist;}}
  return best;
}

test('每個和弦都挑庫裡能做到最近的把位（誤差 1.5 格內）',()=>{
  const rand=seeded(21);
  const progs=[['I','V','vi','IV'],['i','bVI','bIII','bVII'],['Imaj7','IVmaj7'],['i7','iv7'],['I','iii','IV','iv'],['Iadd9','IVadd9']];
  for(const ch of progs){
    const minor=ch[0][0]==='i';
    for(const [k] of (minor?C.MINOR_KEYS:C.MAJOR_KEYS))for(let t=0;t<5;t++){
      const chords=C.buildChords({ch},k);
      const vs=C.voiceProgression(C.BUILTIN,()=>1,chords,3+rand()*4,rand);
      vs.forEach((v,i)=>{
        const [ex,sub]=nearestPossible(C.BUILTIN,chords[i],vs.anchor);
        const bound=(v.q===chords[i].q?ex:Math.min(ex,sub))+1.5;
        assert.ok(Math.abs(v.center-vs.anchor)<=bound+1e-9,`${chords[i].name}（${ch.join(' ')} in ${k}）在 ${v.frets}，離把位 ${Math.abs(v.center-vs.anchor).toFixed(2)}，最近可到 ${bound-1.5}`);
      });
    }
  }
});

test('中把位的調：整組指型都在第一個和弦 3 格內',()=>{
  const rand=seeded(8);
  for(const [ch,keys] of [[['I','V','vi','IV'],['A','B','C','D']],[['i','bVI','bIII','bVII'],['A','B','C','D']],[['Imaj7','IVmaj7'],['A','C','D','E']]])
    for(const k of keys)for(let t=0;t<10;t++){
      const vs=C.voiceProgression(C.BUILTIN,()=>1,C.buildChords({ch},k),4+rand()*3,rand);
      for(const v of vs)assert.ok(Math.abs(v.center-vs.anchor)<=3,`${ch.join(' ')} in ${k}: ${vs.map(v=>v.frets.join(',')).join(' | ')}`);
    }
});

test('voiceProgression：第一個和弦決定把位，之後每個和弦都參考前一個',()=>{
  const chords=C.buildChords({ch:['I','V','vi','IV']},'G');
  const vs=C.voiceProgression(C.BUILTIN,()=>1,chords,5,seeded(2));
  assert.equal(vs.length,4);
  vs.forEach((v,i)=>assert.equal(C.mod(C.rootMidi(v.frets,v.root),12),chords[i].pc));
});

test('voiceProgression：庫裡沒有能用的指型時，那個和弦是 null，其他照常',()=>{
  const onlyMaj=[B('b-maj-e')];
  const vs=C.voiceProgression(onlyMaj,()=>1,C.buildChords({ch:['I','vi']},'G'),5,seeded(1));
  assert.ok(vs[0]);assert.equal(vs[1],null);
});
