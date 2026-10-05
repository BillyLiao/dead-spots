const test=require('node:test');const assert=require('node:assert/strict');
const C=require('../core.js');

// 把一個指型的每條弦轉成級數標籤，6弦→1弦，悶音是 x
const degrees=(frets,root)=>{const set=C.relSet(frets,root);return C.rels(frets,root).map(r=>r==null?'x':C.degLabel(r,set)).join(' ');};

test('spell：依字母拼音，不是只看半音',()=>{
  assert.equal(C.spell(5,8),'A♭');   // A 字母、pc 8
  assert.equal(C.spell(4,8),'G♯');   // G 字母、pc 8
  assert.equal(C.spell(6,10),'B♭');
  assert.equal(C.spell(3,4),'F♭');   // 理論上合法的拼法也要對
  assert.equal(C.spell(1,0),'D♭♭');
});

test('spellSimple：重升 / 重降改成相鄰字母，單一升降不動',()=>{
  assert.equal(C.spellSimple(6,9),'A');    // B♭♭ → A
  assert.equal(C.spellSimple(1,0),'C');    // D♭♭ → C
  assert.equal(C.spellSimple(3,7),'G');    // F♯♯ → G
  assert.equal(C.spellSimple(0,11),'C♭');  // 單一降記號維持
  assert.equal(C.spellSimple(5,8),'A♭');
});

test('parseKey：升降記號',()=>{
  assert.deepEqual(C.parseKey('F#'),{L:3,pc:6});
  assert.deepEqual(C.parseKey('Bb'),{L:6,pc:10});
  assert.deepEqual(C.parseKey('E'),{L:2,pc:4});
});

test('級數：根音不在最低音時（轉位）也算得對',()=>{
  assert.equal(degrees([-1,-1,-1,9,8,8],5),'x x x 3 5 1');  // 大三和弦第一轉位，根音在 1 弦
  assert.equal(degrees([-1,-1,-1,5,6,5],4),'x x x 5 1 3');  // 第二轉位
  assert.equal(degrees([-1,3,-1,4,5,-1],1),'x 1 x 7 3 x');  // maj7 shell
});

test('級數標籤看上下文：沒有三音時是 2 / 4，有三音時是 9 / 11',()=>{
  assert.equal(degrees([-1,3,5,5,3,3],1),'x 1 5 1 2 5');   // sus2
  assert.equal(degrees([-1,1,3,3,4,1],1),'x 1 5 1 4 5');   // sus4
  assert.equal(degrees([-1,-1,5,4,3,5],2),'x x 1 3 5 9');  // add9
});

test('回歸：maj7♯11 沒有五度時，增四度標成 ♯11 而不是 ♭5',()=>{
  assert.equal(degrees([1,-1,2,2,0,0],0),'1 x 7 3 ♯11 7');
  assert.equal(C.fam(6,C.relSet([1,-1,2,2,0,0],0)),'x');
  // m7♭5 的 ♭5 仍然是 ♭5、算五度家族
  assert.equal(degrees([-1,3,4,3,4,-1],1),'x 1 ♭5 ♭7 ♭3 x');
  assert.equal(C.fam(6,C.relSet([-1,3,4,3,4,-1],1)),'f');
});

test('音級家族（決定圖上的形狀與顏色）',()=>{
  const set=new Set([0,4,7,11]);
  assert.deepEqual([0,4,7,11,2].map(r=>C.fam(r,set)),['r','t','f','s','x']);
  assert.equal(C.fam(9,new Set([0,3,6,9])),'s');   // dim7 的 °7 算七度
  assert.equal(C.fam(9,new Set([0,4,7,9])),'x');   // 6 和弦的 6 算延伸音
});

test('detectQ：省略五度的 shell 也判斷得出來',()=>{
  assert.equal(C.detectQ([1,-1,1,1,-1,-1],0),'m7');
  assert.equal(C.detectQ([1,-1,1,2,-1,-1],0),'7');
  assert.equal(C.detectQ([1,3,3,-1,-1,-1],0),'5');
  assert.equal(C.detectQ([-1,-1,5,-1,-1,-1],2),'root');
});

test('detectQ：根音弦沒按或沒指定時回傳 null',()=>{
  assert.equal(C.detectQ([1,3,3,2,1,1],null),null);
  assert.equal(C.detectQ([-1,3,3,2,1,1],0),null);
});

test('detectQ：查不到的組合回傳 null（畫面顯示「未辨識」）',()=>{
  assert.equal(C.detectQ([-1,3,4,-1,-1,-1],1),null);  // 1 + ♭9
});

test('轉位判斷',()=>{
  assert.equal(C.invName(0),'原位');
  assert.equal(C.invName(4),'第一轉位');
  assert.equal(C.invName(7),'第二轉位');
  assert.equal(C.invName(10),'第三轉位');
  assert.equal(C.invName(2),'其他低音');
  assert.deepEqual([0,3,7,11,2].map(C.invCode),['1','3','5','7','x']);
});
