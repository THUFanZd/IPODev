// Run: node <skill>/assets/process-example.mjs --project <new-directory>
// A runnable authoring example, not a required visual vocabulary for other tasks.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {args, writeAtomic, validateModel} from '../scripts/lib.mjs';

const css = `
[data-scene] { height: 320px; overflow: hidden; }
.hint { position:absolute; left:8%; top:16px; color:#58695f; font-size:12px; }
.order { position:absolute; width:76%; left:12%; height:64px; padding:10px 15px; border:1px solid #ceddcb; border-radius:9px; background:#fff; display:flex; justify-content:space-between; align-items:center; }
.amount { font-size:24px; letter-spacing:-.7px; font-weight:600; }
.status { font-size:12px; color:#285b43; }
.cancel { border-style:dashed; border-color:#b8c0b7; }
.cancel .status { color:#687367; }
.checked { border-color:#9a7950; background:#f4eee4; }
.excluded { opacity:.28; }
.value { position:absolute; display:grid; place-items:center; width:80px; height:80px; background:#e5eddf; border:1px solid #b7cbb1; border-radius:50%; font-size:26px; font-weight:600; }
.operator { position:absolute; font-size:28px; color:#58695f; }
.result { position:absolute; left:12%; top:200px; width:76%; height:84px; border-radius:8px; background:#285b43; color:white; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.result strong { font-size:32px; font-weight:600; }
.result small { font-size:12px; }
.guide { position:absolute; width:1px; height:45px; background:#a2b79a; top:144px; left:50%; }
.report { position:absolute; left:8%; top:174px; width:84%; height:106px; border:1px solid #cbd7c6; background:white; border-radius:7px; padding:17px; }
.report small { display:block; color:#58695f; font-size:12px; margin-bottom:10px; }
.report p { font-size:17px; margin:0; }
.sentence { display:flex; align-items:baseline; flex-wrap:wrap; gap:4px; }
.inline-amount { display:inline-block; padding:0 5px; border-radius:4px; color:#285b43; background:#e5eddf; font-size:21px; font-weight:600; }
.token { position:absolute; display:grid; place-items:center; height:54px; width:35%; background:#e5eddf; color:#285b43; font-size:29px; font-weight:600; border-radius:6px; }
.placeholder { display:inline-block; width:60px; border-bottom:1px dashed #a1b49a; height:22px; vertical-align:bottom; }
@media(max-width:340px) { .amount{font-size:21px}.report{padding:14px}.report p{font-size:15px} }
`;
const frame = (id,title,caption,html) => ({id,title,caption,html});
const order = (id,amount,status,top,extra='',left='12%') => `<div data-key="${id}" class="order ${extra}" style="top:${top}px;left:${left}"><span class="amount">${amount}</span><span class="status">${status}</span></div>`;
export function filterVisual(concrete=true) {
  const a=concrete?'120 元':'订单 A', b=concrete?'80 元':'订单 B', c=concrete?'50 元':'订单 C';
  return {css, frames:[
    frame('received','先看同一组订单','逐笔查看付款状态，决定哪些订单可以参与金额汇总。',`<span class="hint">待处理 · 三笔订单</span>${order('a',a,'已付款',52)}${order('b',b,'已付款',140)}${order('c',c,'已取消',228,'cancel')}`),
    frame('inspect','状态决定是否保留','第三笔已经取消，不能计入已付款金额。',`<span class="hint">检查条件：付款成功</span>${order('a',a,'✓ 保留',52)}${order('b',b,'✓ 保留',140)}${order('c',c,'排除',228,'checked')}`),
    frame('retained','留下可汇总的订单',concrete?'留下 120 元、80 元两笔；后续只对它们求和。':'留下付款成功的 A、B；后续只对它们求和。',`<span class="hint">筛选结果 · 两笔订单</span>${order('a',a,'已付款',76)}${order('b',b,'已付款',164)}`),
  ]};
}
export function sumVisual(concrete=true) {
  const a=concrete?'120':'金额 A', b=concrete?'80':'金额 B', total=concrete?'200':'总金额';
  return {css, frames:[
    frame('orders','读取筛选后的订单','上一环节已经排除了取消订单，这里直接使用留下的两笔。',`<span class="hint">来自第 1 步的输出</span>${order('a',concrete?'120 元':'订单 A','已付款',76)}${order('b',concrete?'80 元':'订单 B','已付款',164)}`),
    frame('amounts','取出金额',concrete?'取出 120 和 80；付款状态已完成筛选，不参与加法。':'只取两笔订单的金额，准备相加。',`<span class="hint">只让金额参与运算</span><div data-key="a" class="value" style="left:12%;top:86px">${a}</div><div data-key="b" class="value" style="left:62%;top:86px">${b}</div><span data-key="plus" class="operator" style="left:47%;top:104px">+</span>`),
    frame('sum','合并成一个总金额',concrete?'120 + 80 = 200 元。这是已付款金额，可用于生成摘要。':'两笔有效金额相加；总金额将用于生成摘要。',`<span class="hint">把有效金额汇总</span><div data-key="a" class="value" style="left:18%;top:50px;width:68px;height:68px">${a}</div><div data-key="b" class="value" style="left:62%;top:50px;width:68px;height:68px">${b}</div><span data-key="plus" class="operator" style="left:47%;top:63px">+</span><span data-key="merge" class="guide"></span><div data-key="total" class="result"><strong>${total}</strong><small>已付款金额${concrete?' / 元':''}</small></div>`),
  ]};
}
export function formatVisual(concrete=true) {
  const amount=concrete?'200':'总金额';
  return {css,frames:[
    frame('template','准备一句可读的说明','金额已算好，这一步只补上含义和单位。',`<span class="hint">把数值放进一句话</span><div data-key="amount" class="token" style="left:32.5%;top:64px">${amount}</div><div class="report"><small>金额摘要</small><p>已付款金额合计：<span class="placeholder"></span> 元。</p></div>`),
    frame('written','把金额写入摘要',concrete?'读者能直接知道：已付款金额合计为 200 元。':'摘要同时保留金额、含义和单位，供用户直接阅读。',`<span class="hint">摘要已形成</span><div class="report"><small>金额摘要</small><p class="sentence"><span>已付款金额合计：</span><strong data-key="amount" class="inline-amount">${amount}</strong><span>元。</span></p></div>`),
  ]};
}

export function exampleModel() {
  const original=[{amount:120,status:'paid'},{amount:80,status:'paid'},{amount:50,status:'cancelled'}],paid=original.slice(0,2);
  const objects=[['orders','原始订单','待处理的订单，包含付款状态与金额。',original,null],['paid-orders','已付款订单','筛选后，可以参与汇总的订单。',paid,'filter'],['total','付款金额合计','所有已付款订单的金额总和。',{total:200},'sum'],['report','金额摘要','供用户阅读的一句话汇总结果。','已付款金额合计：200 元。','format']];
  const specs=[['filter','筛选已付款订单','orders','paid-orders','检查付款状态，保留付款成功的订单。',filterVisual],['sum','汇总付款金额','paid-orders','total','取出有效订单的金额并相加。',sumVisual],['format','生成可读摘要','total','report','把金额填入说明文字，注明单位元。',formatVisual]];
  const summaries=['三笔订单：120 元、80 元已付款，50 元已取消。','两笔已付款订单：120 元、80 元。','付款金额合计为 200 元。','已付款金额合计：200 元。'];
  return validateModel({schemaVersion:2,id:'process-visual-example',revision:1,title:'从三笔订单，到一份金额摘要',subtitle:'P 可视化与播放模板示例',goal:'观察同一组数据怎样被筛选、汇总，再写入摘要。',scope:'独立的示意案例，用于展示 P 的自由设计与播放；不执行订单业务。',mode:'plan',
    artifacts:objects.map(([id,name,summary,value,producer])=>({id,name,summary,kind:'data',location:producer?'来自 '+producer+' 环节':'示意订单输入',format:typeof value==='string'?'text':'JSON',sampleKind:'illustrative',...(producer?{producedBy:producer}:{}),fields:id==='orders'||id==='paid-orders'?[{path:'amount',type:'number',meaning:'订单金额，单位元'},{path:'status',type:'string',meaning:'paid 为已付款，cancelled 为已取消'}]:[{path:id==='total'?'total':'text',type:id==='total'?'number':'string',meaning:summary}],example:value})),
    flow:objects.map(o=>o[0]),
    nodes:specs.map(([id,title,input,output,description,visual],i)=>({id,revision:1,title,summary:description,dependsOn:i?[specs[i-1][0]]:[],input:{summary:objects[i][2],description:objects[i][2],artifactIds:[input]},output:{summary:objects[i+1][2],description:objects[i+1][2],artifactIds:[output]},process:{description,rules:[],errors:[],derivations:[{id:id+'-result',outputId:output,inputIds:[input],steps:[description],visual:visual(false)}]},trace:[{id:id+'-trace',label:title,before:objects[i][3],operation:description,after:objects[i+1][3]}],questions:[]})),
    runningExample:{id:'three-orders',title:'用同一组订单，走完三个环节',summary:'120 元、80 元已付款，50 元已取消；最终汇总 200 元。',sampleKind:'illustrative',values:objects.map((o,i)=>({artifactId:o[0],summary:summaries[i],value:o[3]})),steps:specs.map(([id,,input,output,description,visual],i)=>({nodeId:id,outputs:[{outputId:output,changes:[{id:id+'-change',before:summaries[i],operation:description,after:summaries[i+1]}],visual:visual(true)}]}))},
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const options=args(process.argv.slice(2));if(!options.project)throw Error('Usage: node process-example.mjs --project <new-directory>');
  const root=path.resolve(options.project),file=path.join(root,'project.json');
  if(fs.existsSync(file)||fs.existsSync(path.join(root,'index.html'))||fs.existsSync(path.join(root,'feedback.json')))throw Error('Choose a new example directory; existing project files are preserved.');
  fs.mkdirSync(root,{recursive:true});writeAtomic(file,JSON.stringify(exampleModel(),null,2)+'\n');console.log(`Created ${file}. Run render.mjs and serve.mjs to preview.`);
}
