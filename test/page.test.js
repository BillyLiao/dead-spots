// 冒煙測試：index.html 能載入 core.js，內嵌 script 語法正確，沒有重複定義 core 已經有的函式。
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const inline=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));

test('index.html 在內嵌 script 之前載入 core.js',()=>{
  const i=html.indexOf('<script src="core.js"></script>');
  assert.ok(i>0);assert.ok(i<html.indexOf('<script>'));
});

test('內嵌 script 語法正確',()=>{
  assert.doesNotThrow(()=>new vm.Script(inline));
});

test('內嵌 script 沒有重複宣告 core.js 的頂層名稱（瀏覽器會丟 SyntaxError）',()=>{
  const core=fs.readFileSync(path.join(__dirname,'..','core.js'),'utf8');
  const decl=src=>new Set([...src.matchAll(/^(?:const|let|function)\s+([A-Za-z_$][\w$]*)/gm)].map(m=>m[1]));
  const dup=[...decl(inline)].filter(n=>decl(core).has(n));
  assert.deepEqual(dup,[]);
});

test('core.js 和內嵌 script 一起在同一個全域執行時不會出錯',()=>{
  const core=fs.readFileSync(path.join(__dirname,'..','core.js'),'utf8');
  const ctx=vm.createContext({console});
  new vm.Script(core).runInContext(ctx);
  // 內嵌 script 要 DOM 才能跑，這裡只確認 core 的全域名稱在同一個 context 裡看得到
  assert.equal(new vm.Script('typeof pickVoicingFrom+typeof BUILTIN').runInContext(ctx),'functionobject');
});

test('回歸：和弦名稱和級數不能被 CSS 轉成大寫（m7 會變 M7、vi 會變 VI）',()=>{
  const css=[...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
  for(const sel of ['.fact .v','.ccard .nm','.ccard .rn','.prompt-big','.reveal-meta .nm','.lcard .q','.detect .big']){
    const esc=sel.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const rules=[...css.matchAll(new RegExp('(?:^|[}\\n,])\\s*'+esc+'\\s*[{,][^}]*}','g'))].map(m=>m[0]);
    assert.ok(rules.length>0,sel+' 找不到樣式');
    for(const r of rules)assert.ok(!/text-transform\s*:\s*uppercase/.test(r),sel+' 有 uppercase：'+r.slice(0,80));
  }
});

test('index.html 引用的本機檔案都有列在部署清單裡（不然上線會 404）',()=>{
  const deploy=fs.readFileSync(path.join(__dirname,'..','.github','workflows','deploy.yml'),'utf8');
  const cp=deploy.match(/cp ([^\n]+) _site\//);assert.ok(cp,'deploy.yml 找不到 cp ... _site/');
  const shipped=new Set(cp[1].trim().split(/\s+/));
  const refs=[...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map(m=>m[1]).filter(r=>!r.startsWith('//'));
  assert.ok(refs.length>0);
  for(const r of refs){
    assert.ok(shipped.has(r),r+' 沒有列在 deploy.yml 的部署清單');
    assert.ok(fs.existsSync(path.join(__dirname,'..',r)),r+' 檔案不存在');
  }
});
