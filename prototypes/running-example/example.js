(function(root){
  'use strict';
  const input='午餐 38 元，打车 46 元，咖啡 22 元。';
  const expenses=[{id:'meal',name:'午餐',amount:38,category:'餐饮'},{id:'taxi',name:'打车',amount:46,category:'交通'},{id:'coffee',name:'咖啡',amount:22,category:'饮品'}];
  const allowed=['餐饮','交通'];
  const eligible=expenses.filter(x=>allowed.includes(x.category));
  const total=eligible.reduce((sum,x)=>sum+x.amount,0);
  const prompt='你是消费记录整理助手。\n\n任务：从用户记录中提取消费名称、金额和类别。\n类别只允许：餐饮、交通、饮品。\n金额以元为单位，仅输出 JSON 数组，不筛选、不求和。\n\n用户记录：\n'+input;
  const response=JSON.stringify(expenses.map(({name,amount,category})=>({name,amount,category})),null,2);
  const duration=42;
  const scenes=[
    {id:'input',start:0,end:6.5,title:'从一条消费记录开始',caption:'三笔消费都在这里：午餐 38 元、打车 46 元、咖啡 22 元。',detail:'目标：按本例规则，算出可以报销的金额。'},
    {id:'prompt',start:6.5,end:15,title:'把这条记录填入 Prompt',caption:'告诉语言模型要提取什么，再把同一条消费记录放进去。',detail:'本例让模型只整理消费，不负责筛选或求和。'},
    {id:'extract',start:15,end:23,title:'让文字变成可处理的消费',caption:'名称、金额和类别被分开整理，三笔消费仍然一一对应。',detail:'此处为预先写好的模型输出示例，没有发起 API 调用。'},
    {id:'filter',start:23,end:30,title:'按报销规则，留下两笔',caption:'本例仅报销餐饮和交通；咖啡属于饮品，金额不计入合计。',detail:'午餐和打车继续向前，咖啡保留在旁边供核对。'},
    {id:'calculate',start:30,end:38.5,title:'把留下的金额加起来',caption:'38 + 46 = 84 元。参与计算的是筛选后两笔消费的金额。',detail:'这一步直接计算，无需再调用语言模型。'},
    {id:'result',start:38.5,end:42,title:'得到一份能追溯来源的结果',caption:'可报销 84 元：来自午餐 38 元和打车 46 元，咖啡 22 元已排除。',detail:'向后拖动时间线，可以重新查看任何一次变化。'},
  ];
  const cues=[{time:0,label:'原始记录'},{time:11,label:'填入 Prompt'},{time:20,label:'模型输出'},{time:27,label:'规则筛选'},{time:35.5,label:'金额相加'},{time:42,label:'最终结果'}];
  const clampTime=t=>Number.isFinite(Number(t))?Math.max(0,Math.min(duration,Number(t))):0;
  const sceneAt=t=>scenes.find(s=>clampTime(t)>=s.start&&clampTime(t)<s.end)||scenes.at(-1);
  const value={input,expenses,allowed,eligible,total,prompt,response,duration,scenes,cues,clampTime,sceneAt};
  if(typeof module!=='undefined'&&module.exports)module.exports=value;else root.IPOExample=value;
})(typeof window!=='undefined'?window:globalThis);
