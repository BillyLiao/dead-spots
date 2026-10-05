// 固定序列的假亂數：依序回傳 values，用完從頭來。讓有亂數的函式結果可預測。
function seq(...values){let i=0;return()=>values[i++%values.length];}
// 簡單的可重現亂數（mulberry32），給需要「很多次亂數」的性質測試用。
function seeded(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
module.exports={seq,seeded};
