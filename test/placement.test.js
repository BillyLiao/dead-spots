const test=require('node:test');const assert=require('node:assert/strict');
const C=require('../core.js');
const shape=(frets,root)=>({frets,root});
const rootPc=(frets,root)=>C.mod(C.rootMidi(frets,root),12);

test('可移動指型：每個調都放得到，平移後根音是目標音',()=>{
  const sh=shape([1,3,3,2,1,1],0); // F 的 E 型封閉
  for(let pc=0;pc<12;pc++){
    const pl=C.placements(sh,pc);
    assert.ok(pl.length>0,'pc '+pc+' 沒有位置');
    for(const d of pl)assert.equal(rootPc(C.shifted(sh.frets,d),0),pc);
  }
});

test('平移後所有按的格數都在 1–17 格之間',()=>{
  const sh=shape([-1,3,5,5,3,3],1);
  for(let pc=0;pc<12;pc++)for(const d of C.placements(sh,pc)){
    const f=C.fretted(C.shifted(sh.frets,d));
    assert.ok(Math.min(...f)>=1&&Math.max(...f)<=17,`pc ${pc} d ${d}: ${f}`);
  }
});

test('平移不動悶音和空弦',()=>{
  assert.deepEqual(C.shifted([-1,3,2,0,3,3],2),[-1,5,4,0,5,5]);
});

test('含空弦的指型只能用在原本的調',()=>{
  const cadd9=shape([-1,3,2,0,3,3],1); // C
  assert.deepEqual(C.placements(cadd9,0),[0]);
  for(let pc=1;pc<12;pc++)assert.deepEqual(C.placements(cadd9,pc),[]);
});

test('centerOf：只算有按的格，全空弦時給預設值',()=>{
  assert.equal(C.centerOf([-1,3,-1,4,5,-1]),4);
  assert.equal(C.centerOf([0,0,0,0,0,0]),1.5);
});

test('noteNameRel：轉位低音的拼法',()=>{
  assert.equal(C.noteNameRel(4,7,4),'B');   // G 的三音
  assert.equal(C.noteNameRel(1,2,4),'F♯');  // D 的三音
  assert.equal(C.noteNameRel(6,10,3),'D♭'); // B♭ 的小三度
});
