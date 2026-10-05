const test=require('node:test');const assert=require('node:assert/strict');
const C=require('../core.js');
const {seq,seeded}=require('./helpers.js');
const names=(prog,key)=>C.buildChords({ch:prog.split(' ')},key).map(c=>c.name).join(' ');

test('parseRoman：大小寫決定大小三和弦，字尾決定性質',()=>{
  const p=t=>{const r=C.parseRoman(t);return[r.step,r.semi,r.q,r.inv];};
  assert.deepEqual(p('I'),[0,0,'maj',null]);
  assert.deepEqual(p('vi'),[5,9,'m',null]);
  assert.deepEqual(p('bVII'),[6,10,'maj',null]);
  assert.deepEqual(p('i7'),[0,0,'m7',null]);
  assert.deepEqual(p('imaj7'),[0,0,'mMaj7',null]);
  assert.deepEqual(p('IVmaj7'),[3,5,'maj7',null]);
  assert.deepEqual(p('iv6'),[3,5,'m6',null]);
  assert.deepEqual(p('V/3'),[4,7,'maj','3']);
  assert.deepEqual(p('i5'),[0,0,'5',null]);
  assert.deepEqual(p('iii7'),[2,4,'m7',null]);   // 'iii' 不能被當成 'ii' + 'i'
  assert.deepEqual(p('VII'),[6,11,'maj',null]);
});

test('buildChords：和弦名稱拼法',()=>{
  assert.equal(names('I V vi IV','E'),'E B C♯m A');
  assert.equal(names('I V vi IV','Bb'),'B♭ F Gm E♭');
  assert.equal(names('i bVII bVI bVII','G#'),'G♯m F♯ E F♯');
  assert.equal(names('i bVI bIII bVII','C#'),'C♯m A E B');
  assert.equal(names('I V/3 vi IV','G'),'G D/F♯ Em C');
  assert.equal(names('i bII','E'),'Em F');
  assert.equal(names('Imaj7 II','D'),'Dmaj7 E');
  assert.equal(names('i imaj7 i7 i6','A'),'Am Am(maj7) Am7 Am6');
  assert.equal(names('I bVI bVII I','Db'),'D♭ A C♭ D♭');   // 回歸：B♭♭ 要顯示成 A
});

test('每個和弦進行的每個和弦，在所有預設調裡都不會出現重升 / 重降',()=>{
  for(const p of C.PROGS){
    const keys=(p.minor?C.MINOR_KEYS:C.MAJOR_KEYS).map(k=>k[0]);
    for(const k of keys){
      const n=C.buildChords(p,k).map(c=>c.name).join(' ');
      assert.ok(!/♯♯|♭♭/.test(n),`${p.ch.join(' ')} in ${k}: ${n}`);
    }
  }
});

test('每個和弦進行的 token 都解析得出來，且有替代表',()=>{
  for(const p of C.PROGS)for(const t of p.ch){
    const c=C.parseRoman(t);
    assert.ok(c.q in C.QD,`${t} → ${c.q} 不在 QD`);
    assert.ok(C.COMPAT[c.q],`${t} → ${c.q} 沒有 COMPAT`);
    assert.equal(C.COMPAT[c.q][0],c.q,`${c.q} 的替代表第一個應該是自己`);
  }
});

test('和弦進行資料：權重為正、風格都在 STYLES 裡、小調旗標跟第一個和弦一致',()=>{
  const styles=new Set(C.STYLES.map(s=>s[0]));
  for(const p of C.PROGS){
    assert.ok(p.w>0);
    for(const s of p.st)assert.ok(styles.has(s),'未知風格 '+s);
    assert.equal(p.minor,p.ch[0][0]==='i',p.ch.join(' '));
  }
  for(const s of styles)assert.ok(C.PROGS.some(p=>p.st.includes(s)),s+' 沒有任何和弦進行');
});

test('只用內建指型，每個和弦進行在每個預設調都能為每個和弦找到指型',()=>{
  const rand=seeded(1);
  for(const p of C.PROGS){
    const keys=(p.minor?C.MINOR_KEYS:C.MAJOR_KEYS).map(k=>k[0]);
    for(const k of keys)for(const c of C.buildChords(p,k)){
      const v=C.pickVoicingFrom(C.BUILTIN,()=>1,c,5,null,rand);
      assert.ok(v,`${c.name}（${p.ch.join(' ')} in ${k}）找不到指型`);
    }
  }
});

test('genBpm：三角分布落在 中心 ± 幅度 之內，兩個亂數都 0.5 時剛好是中心',()=>{
  for(const [st,[c,sp]] of Object.entries(C.STYLE_BPM)){
    assert.equal(C.genBpm(st,seq(0.5)),c);
    assert.equal(C.genBpm(st,seq(0)),Math.round(c-sp));
    assert.equal(C.genBpm(st,seq(0.999999)),Math.round(c+sp*0.999998));
  }
});

test('pickKey：亂數決定調性，小調用小調表',()=>{
  assert.equal(C.pickKey(false,seq(0)),C.MAJOR_KEYS[0][0]);
  assert.equal(C.pickKey(true,seq(0.999999)),C.MINOR_KEYS.at(-1)[0]);
});
