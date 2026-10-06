const test=require('node:test');const assert=require('node:assert/strict');
const C=require('../core.js');
const mk=(id,frets,root,extra={})=>({id,name:'',notes:'',frets,root,src:'custom',fixedQ:'',blind:false,created:0,...extra});

test('同一個可移動指型在不同把位算同一個（截圖裡的兩個 maj7）',()=>{
  const a=mk('a',[1,-1,2,2,-1,-1],0),b=mk('b',[2,-1,3,3,-1,-1],0),c=mk('c',[8,-1,9,9,-1,-1],0);
  assert.ok(C.sameShape(a,b));assert.ok(C.sameShape(a,c));
});

test('根音標在不同弦就是不同指型（級數不同）',()=>{
  const am7=mk('a',[-1,0+5,7,5,6,5],1);            // 根音在 5 弦
  const c6=mk('b',[-1,5,7,5,6,5],4);               // 同按法，根音標在 2 弦
  assert.ok(!C.sameShape(am7,c6));
});

test('相對格位不同就是不同指型',()=>{
  assert.ok(!C.sameShape(mk('a',[1,3,3,2,1,1],0),mk('b',[1,3,3,1,1,1],0)));
});

test('悶音的位置也要一樣',()=>{
  assert.ok(!C.sameShape(mk('a',[1,3,3,2,1,1],0),mk('b',[1,3,3,2,1,-1],0)));
});

test('有空弦的指型：位置不同就不算同一個，完全一樣才算',()=>{
  const em7=mk('a',[0,2,2,0,3,3],0);
  assert.ok(!C.sameShape(em7,mk('b',[0,3,3,0,4,4],0)));
  assert.ok(C.sameShape(em7,mk('b',[0,2,2,0,3,3],0)));
  // 有空弦 vs 同形狀封閉版，聲音不同，不算同一個
  assert.ok(!C.sameShape(em7,mk('c',[5,7,7,5,8,8],0)));
});

test('findDuplicate：不會跟自己比',()=>{
  const a=mk('a',[1,-1,2,2,-1,-1],0),b=mk('b',[3,-1,4,4,-1,-1],0);
  assert.equal(C.findDuplicate(a,[a]),null);
  assert.equal(C.findDuplicate(a,[a,b]).id,'b');
});

test('findDuplicate：新的自訂指型跟內建重複也會抓到',()=>{
  const mine=mk('new',[3,-1,4,4,3,-1],0);   // = 內建 b-maj7-e 移到 3 格
  assert.equal(C.findDuplicate(mine,C.BUILTIN).id,'b-maj7-e');
});

test('內建指型之間沒有重複',()=>{
  assert.deepEqual(C.duplicateGroups(C.BUILTIN).map(g=>g.map(s=>s.id)),[]);
});

test('duplicateGroups：把重複的分成一組',()=>{
  const a=mk('a',[1,-1,2,2,-1,-1],0),b=mk('b',[2,-1,3,3,-1,-1],0),c=mk('c',[1,3,3,2,1,1],0);
  assert.deepEqual(C.duplicateGroups([a,b,c]).map(g=>g.map(s=>s.id)),[['a','b']]);
});

test('pickKeeper：自訂優先於內建、早建立的優先、兩個內建不合併',()=>{
  const old=mk('old',[1],0,{created:1}),neu=mk('neu',[1],0,{created:2}),bi={id:'b',src:'builtin'};
  assert.equal(C.pickKeeper(neu,old).keep.id,'old');
  assert.equal(C.pickKeeper(bi,neu).keep.id,'neu');
  assert.equal(C.pickKeeper(neu,bi).drop.id,'b');
  assert.equal(C.pickKeeper(bi,{id:'b2',src:'builtin'}),null);
});

test('mergeShapeData：名稱補空、筆記合併去重、盲區取聯集',()=>{
  const keep=mk('k',[1],0,{notes:'小指壓不住'}),drop=mk('d',[1],0,{name:'螢火蟲 verse',notes:'小指壓不住'});
  const m=C.mergeShapeData(keep,drop,true);
  assert.equal(m.id,'k');assert.equal(m.name,'螢火蟲 verse');assert.equal(m.notes,'小指壓不住');assert.equal(m.blind,true);
  const m2=C.mergeShapeData(mk('k',[1],0,{name:'A',notes:'x'}),mk('d',[1],0,{name:'B',notes:'y'}),false);
  assert.equal(m2.name,'A');assert.equal(m2.notes,'x / y');assert.equal(m2.blind,false);
});

test('mergeStats：次數加總、取最後一次練習時間',()=>{
  assert.deepEqual(C.mergeStats({n:3,miss:1,last:5},{n:2,miss:2,last:9}),{n:5,miss:3,last:9});
  assert.deepEqual(C.mergeStats(null,{n:1,miss:0,last:2}),{n:1,miss:0,last:2});
  assert.equal(C.mergeStats(null,undefined),null);
});

const blindOf=st=>s=>s.src==='custom'?!!s.blind:!!(st.flags[s.id]&&st.flags[s.id].blind);

test('applyMerge：兩個自訂重複 → 留早建立的，刪掉另一個，紀錄加總',()=>{
  const a=mk('a',[1,-1,2,2,-1,-1],0,{created:1,notes:'x'}),b=mk('b',[2,-1,3,3,-1,-1],0,{created:2,blind:true,name:'verse'});
  const st={chords:[b,a],flags:{},stats:{a:{n:2,miss:1,last:1},b:{n:3,miss:3,last:9}}};
  const r=C.applyMerge(st,b,a,blindOf(st));
  assert.equal(r.keepId,'a');assert.equal(r.dropId,'b');
  assert.deepEqual(r.state.chords.map(c=>c.id),['a']);
  const kept=r.state.chords[0];
  assert.equal(kept.name,'verse');assert.equal(kept.notes,'x');assert.equal(kept.blind,true);
  assert.deepEqual(kept.frets,[1,-1,2,2,-1,-1],'保留原本記錄的把位');
  assert.deepEqual(r.state.stats,{a:{n:5,miss:4,last:9}});
});

test('applyMerge：自訂跟內建重複 → 留自訂，內建隱藏，內建的盲區和紀錄轉過來',()=>{
  const mine=mk('mine',[3,-1,4,4,3,-1],0);
  const bi=C.BUILTIN.find(b=>b.id==='b-maj7-e');
  const st={chords:[mine],flags:{'b-maj7-e':{blind:true}},stats:{'b-maj7-e':{n:4,miss:2,last:3}}};
  const r=C.applyMerge(st,mine,bi,blindOf(st));
  assert.equal(r.keepId,'mine');
  assert.deepEqual(r.state.flags,{'b-maj7-e':{hidden:true}});
  assert.equal(r.state.chords[0].blind,true);
  assert.deepEqual(r.state.stats,{mine:{n:4,miss:2,last:3}});
});

test('applyMerge：不改傳入的 state',()=>{
  const a=mk('a',[1,-1,2,2,-1,-1],0,{created:1}),b=mk('b',[2,-1,3,3,-1,-1],0,{created:2});
  const st={chords:[a,b],flags:{},stats:{a:{n:1,miss:0,last:1}}};
  const snap=JSON.stringify(st);
  C.applyMerge(st,a,b,()=>false);
  assert.equal(JSON.stringify(st),snap);
});

test('applyMerge：兩個內建不合併',()=>{
  assert.equal(C.applyMerge({chords:[],flags:{},stats:{}},C.BUILTIN[0],C.BUILTIN[1],()=>false),null);
});

test('unhideCovered：刪掉取代內建的自訂指型後，內建的重新出現',()=>{
  const mine=mk('mine',[3,-1,4,4,3,-1],0);
  const flags={'b-maj7-e':{hidden:true},'b-m7-e':{blind:true}};
  assert.deepEqual(C.unhideCovered(flags,mine,C.BUILTIN),{'b-m7-e':{blind:true}});
  assert.deepEqual(flags['b-maj7-e'],{hidden:true},'不改傳入的 flags');
});
