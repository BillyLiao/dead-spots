const test=require('node:test');const assert=require('node:assert/strict');
const C=require('../core.js');

// 每個內建指型應有的性質、轉位、級數（6弦→1弦）。改內建指型時這張表要跟著改。
const EXPECTED={
 'b-maj-e':['maj','原位','1 5 1 3 5 1'],'b-maj-a':['maj','原位','x 1 5 1 3 5'],
 'b-maj-gbe0':['maj','原位','x x x 1 3 5'],'b-maj-gbe1':['maj','第一轉位','x x x 3 5 1'],'b-maj-gbe2':['maj','第二轉位','x x x 5 1 3'],
 'b-maj-dgb0':['maj','原位','x x 1 3 5 x'],'b-maj-dgb1':['maj','第一轉位','x x 3 5 1 x'],'b-maj-dgb2':['maj','第二轉位','x x 5 1 3 x'],
 'b-m-e':['m','原位','1 5 1 ♭3 5 1'],'b-m-a':['m','原位','x 1 5 1 ♭3 5'],
 'b-m-gbe0':['m','原位','x x x 1 ♭3 5'],'b-m-gbe1':['m','第一轉位','x x x ♭3 5 1'],'b-m-gbe2':['m','第二轉位','x x x 5 1 ♭3'],
 'b-m-dgb0':['m','原位','x x 1 ♭3 5 x'],
 'b-maj7-e':['maj7','原位','1 x 7 3 5 x'],'b-maj7-a':['maj7','原位','x 1 5 7 3 5'],'b-maj7-ash':['maj7','原位','x 1 x 7 3 x'],'b-maj7-d':['maj7','原位','x x 1 5 7 3'],
 'b-m7-e':['m7','原位','1 5 ♭7 ♭3 5 1'],'b-m7-a':['m7','原位','x 1 5 ♭7 ♭3 5'],'b-m7-esh':['m7','原位','1 x ♭7 ♭3 x x'],'b-m7-ash':['m7','原位','x 1 x ♭7 ♭3 x'],
 'b-7-e':['7','原位','1 5 ♭7 3 5 1'],'b-7-a':['7','原位','x 1 5 ♭7 3 5'],'b-7-esh':['7','原位','1 x ♭7 3 x x'],
 'b-m9-a':['m9','原位','x 1 ♭3 ♭7 9 x'],'b-maj9-a':['maj9','原位','x 1 3 7 9 x'],
 'b-sus2-a':['sus2','原位','x 1 5 1 2 5'],'b-sus4-a':['sus4','原位','x 1 5 1 4 5'],'b-add9-d':['add9','原位','x x 1 3 5 9'],
 'b-m6-a':['m6','原位','x 1 ♭3 6 1 x'],'b-m7b5-a':['m7b5','原位','x 1 ♭5 ♭7 ♭3 x'],'b-mmaj7-a':['mMaj7','原位','x 1 5 7 ♭3 5'],
 'b-5-e':['5','原位','1 5 1 x x x'],'b-5-a':['5','原位','x 1 5 1 x x'],
 'b-o-cadd9':['add9','原位','x 1 3 5 9 5'],'b-o-fmaj7s11':['maj7#11','原位','1 x 7 3 ♯11 7'],'b-o-asus2':['sus2','原位','x 1 5 1 2 5'],
 'b-o-em7':['m7','原位','1 5 1 ♭3 ♭7 ♭3'],'b-o-amaj7':['maj7','原位','x 1 5 7 3 5'],
 // 開放弦常用和弦（v0.4.0）
 'b-o-c':['maj','原位','x 1 3 5 1 3'],'b-o-a':['maj','原位','x 1 5 1 3 5'],'b-o-g':['maj','原位','1 3 5 1 3 1'],
 'b-o-e':['maj','原位','1 5 1 3 5 1'],'b-o-d':['maj','原位','x x 1 5 1 3'],
 'b-o-am':['m','原位','x 1 5 1 ♭3 5'],'b-o-em':['m','原位','1 5 1 ♭3 5 1'],'b-o-dm':['m','原位','x x 1 5 1 ♭3'],
 'b-o-a7':['7','原位','x 1 5 ♭7 3 5'],'b-o-e7':['7','原位','1 5 ♭7 3 5 1'],'b-o-d7':['7','原位','x x 1 5 ♭7 3'],
 'b-o-g7':['7','原位','1 3 5 1 3 ♭7'],'b-o-c7':['7','原位','x 1 3 ♭7 1 3'],'b-o-b7':['7','原位','x 1 3 ♭7 1 5'],
 'b-o-am7':['m7','原位','x 1 5 ♭7 ♭3 5'],'b-o-dm7':['m7','原位','x x 1 5 ♭7 ♭3'],'b-o-em7b':['m7','原位','1 5 ♭7 ♭3 5 1'],
 'b-o-cmaj7':['maj7','原位','x 1 3 5 7 3'],'b-o-fmaj7':['maj7','原位','x x 1 3 5 7'],'b-o-gmaj7':['maj7','原位','1 x 5 1 3 7'],
 'b-o-dsus2':['sus2','原位','x x 1 5 1 2'],'b-o-dsus4':['sus4','原位','x x 1 5 1 4'],'b-o-asus4':['sus4','原位','x 1 5 1 4 5'],
 'b-o-esus4':['sus4','原位','1 5 1 4 5 1'],'b-o-e5':['5','原位','1 5 1 x x x'],'b-o-a5':['5','原位','x 1 5 1 x x'],
};

test('內建指型數量與表格一致',()=>{
  assert.equal(C.BUILTIN.length,Object.keys(EXPECTED).length);
});

for(const sh of C.BUILTIN){
  test(`內建 ${sh.id}`,()=>{
    const exp=EXPECTED[sh.id];assert.ok(exp,'表格裡沒有這個指型');
    const set=C.relSet(sh.frets,sh.root),r=C.rels(sh.frets,sh.root);
    assert.equal(C.detectQ(sh.frets,sh.root),exp[0],'性質');
    assert.equal(C.invName(r[C.bassIdx(sh.frets)]),exp[1],'轉位');
    assert.equal(r.map(x=>x==null?'x':C.degLabel(x,set)).join(' '),exp[2],'級數');
  });
}

test('內建指型的 id 不重複、都是 6 條弦、根音弦有按',()=>{
  const ids=new Set();
  for(const sh of C.BUILTIN){
    assert.ok(!ids.has(sh.id),'重複 id '+sh.id);ids.add(sh.id);
    assert.equal(sh.frets.length,6);
    assert.ok(sh.frets[sh.root]>=0,sh.id+' 根音弦沒按');
    assert.equal(sh.src,'builtin');
  }
});
