(function(){
'use strict';
const E=window.IPOExample,$=id=>document.getElementById(id),G=window.gsap;
if(!G||!E){$('load-error').hidden=false;$('play').disabled=true;$('scrubber').disabled=true;return;}
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),stage=$('stage'),world=$('world');
let timeline,seekTween=null,currentScene='',resizeTask=0;
const allTokens=E.expenses.map(e=>$('token-'+e.id));
const contexts=['原始输入','组织模型输入','模型输出 · 示意','筛选有效消费','计算金额','最终输出'];
const clock=t=>`00:${String(Math.floor(t)).padStart(2,'0')}`;
$('result-total').textContent=E.total;
$('prompt-content').textContent=E.prompt;
$('data-content').textContent='模型输出（示意）\n\n'+E.response+'\n\n报销规则\n仅报销餐饮和交通。\n\n筛选结果\n'+E.eligible.map(x=>`${x.name}：${x.amount} 元`).join('\n')+'\n\n计算\n'+E.eligible.map(x=>x.amount).join(' + ')+' = '+E.total+' 元';
const shortCues=['记录','Prompt','整理','筛选','求和','结果'];
$('cues').innerHTML=E.cues.map((c,i)=>`<button class="cue" data-cue="${i}" style="left:${c.time/E.duration*100}%" aria-label="跳到${c.label}"><span class="cue-full">${c.label}</span><span class="cue-short">${shortCues[i]}</span></button>`).join('');

function update(){
  if(!timeline)return;
  const t=timeline.time(),s=E.sceneAt(t),index=E.scenes.indexOf(s),progress=t/E.duration;
  $('scrubber').value=Math.round(t*100);$('track-fill').style.setProperty('--progress',progress*100+'%');
  $('elapsed').textContent=clock(t);
  $('scrubber').setAttribute('aria-valuetext',`${s.title}，${Math.round(progress*100)}%`);
  const playing=!timeline.paused()&&t<E.duration;
  $('play-text').textContent=playing?'暂停':t>=E.duration?'再播放':'播放';
  $('play').setAttribute('aria-label',playing?'暂停演示':t>=E.duration?'重新播放演示':'播放演示');
  $('play-icon').innerHTML=playing?'<path d="M3 2H6V12H3ZM9 2H12V12H9Z"/>':'<path d="M4 2L12 7L4 12Z"/>';
  if(currentScene!==s.id){
    currentScene=s.id;document.body.dataset.scene=s.id;
    $('now-title').textContent=s.title;$('now-caption').textContent=s.caption;$('scene-detail').textContent=s.detail;
    $('position-label').textContent=`${index+1} / ${E.scenes.length}`;
    $('stage-context').textContent=contexts[index];stage.setAttribute('aria-label',s.title+'。'+s.caption);
    for(const button of $('cues').children)button.setAttribute('aria-current',Number(button.dataset.cue)===index?'step':'false');
  }
}
function pause(){seekTween?.kill();seekTween=null;timeline?.pause();update();}
function goTo(time,smooth=false){
  pause();const target=E.clampTime(time);
  if(smooth&&!reduced.matches)seekTween=G.to(timeline,{time:target,duration:.65,ease:'power2.inOut',onUpdate:update,onComplete:()=>{seekTween=null;update();}});
  else timeline.time(target,false);
  update();
}
function play(){
  seekTween?.kill();seekTween=null;
  if(reduced.matches){const next=E.cues.find(c=>c.time>timeline.time()+.05);goTo(next?.time??0);return;}
  if(timeline.time()>=E.duration-.01)timeline.time(0,false);
  timeline.play();update();
}
function rebuild(){
  const oldTime=timeline?.time()||0,wasPlaying=timeline&&!timeline.paused();
  seekTween?.kill();timeline?.kill();
  G.set(world.querySelectorAll('*'),{clearProps:'all'});
  const mobile=stage.clientWidth<600,W=mobile?560:1120,H=mobile?560:470;
  world.style.width=W+'px';world.style.height=H+'px';
  const scale=Math.min((stage.clientWidth-(mobile?12:20))/W,(stage.clientHeight-(mobile?74:20))/H);
  world.style.transform=`translate(${-W*scale/2}px,${-H*scale/2+(mobile?20:0)}px) scale(${scale})`;
  const place=(id,props)=>G.set($(id),props);
  const source=mobile?{left:130,top:83,width:300,height:300}:{left:390,top:78,width:340,height:300};
  const starts=mobile?[{left:147,top:164},{left:147,top:224},{left:147,top:284}]:[{left:426,top:160},{left:426,top:220},{left:426,top:280}];
  place('source-paper',source);place('source-caption',{left:source.left,top:source.top-43});
  allTokens.forEach((token,i)=>G.set(token,{...starts[i],width:mobile?260:268,height:48,opacity:1,x:0,y:0}));
  G.set('.token .item-label',{top:24});
  const hidden=['prompt-paper','model-unit','extraction-paper','filter-rule','filter-accepted','filter-rejected','reject-reason','sum-plus','sum-line','sum-label','result-paper','final-seal','result-caption'];
  hidden.forEach(id=>place(id,{opacity:0}));G.set('.category',{opacity:0});
  G.set('.coffee-slash',{opacity:0});G.set('#model-signal',{opacity:0});
  const prompt=mobile?{left:35,top:65,width:490,height:365}:{left:342,top:47,width:650,height:356};place('prompt-paper',prompt);
  if(mobile){G.set('.document-head strong',{fontSize:21});G.set('.document-head small',{fontSize:14});G.set('.prompt-instruction',{fontSize:22});G.set('.prompt-instruction.small',{fontSize:17});G.set('.prompt-footer',{fontSize:13});G.set('.prompt-slot span',{fontSize:14});G.set('.source-caption',{fontSize:17});G.set('.paper-eyebrow',{fontSize:15});G.set('.paper-title',{fontSize:25});G.set('.token .item-label',{fontSize:21});G.set('.token .amount',{fontSize:30});G.set('.amount .unit',{fontSize:14});G.set('.category',{fontSize:16});}
  const model=mobile?{left:181,top:61,width:200,height:108}:{left:432,top:178,width:200,height:108};place('model-unit',model);
  const extracted=mobile?{left:60,top:211,width:440,height:307}:{left:666,top:70,width:382,height:320};place('extraction-paper',extracted);
  const out=mobile?{left:80,ys:[298,364,430],width:400,height:54}:{left:684,ys:[167,235,303],width:345,height:54};
  if(mobile){G.set('.extraction-paper h2',{fontSize:24});G.set('.extraction-paper p',{fontSize:16});G.set('.column-labels',{fontSize:14});}
  const lines=$('path-in').parentElement;lines.setAttribute('viewBox',`0 0 ${W} ${H}`);G.set(lines,{width:W,height:H});
  $('path-in').setAttribute('d',mobile?'M280 26V60':'M340 232 C380 232 390 232 432 232');
  $('path-out').setAttribute('d',mobile?'M280 170V210':'M632 232 C648 232 650 232 690 232');
  G.set('#path-in,#path-out',{strokeDashoffset:300,opacity:0});
  place('filter-rule',mobile?{left:56,top:95,fontSize:22}:{left:328,top:52});
  place('filter-accepted',mobile?{left:72,top:155,fontSize:17}:{left:335,top:113});
  place('filter-rejected',mobile?{left:86,top:371,fontSize:17}:{left:810,top:181});
  place('reject-reason',mobile?{left:86,top:475,fontSize:16}:{left:814,top:292});
  place('sum-plus',mobile?{left:274,top:170}:{left:545,top:161});
  const receipt=mobile?{left:130,top:303,width:300,height:222}:{left:412,top:248,width:300,height:208};place('result-paper',receipt);
  place('final-seal',mobile?{left:352,top:348}:{left:648,top:335});
  place('result-caption',mobile?{left:140,top:456,width:280,fontSize:16}:{left:423,top:439,width:278});
  const sumSvg=$('sum-line');sumSvg.setAttribute('viewBox',`0 0 ${W} ${H}`);G.set(sumSvg,{width:W,height:H});
  sumSvg.querySelector('path').setAttribute('d',mobile?'M145 259 C145 290 280 266 280 302M415 259 C415 290 280 266 280 302':'M385 242 C385 268 560 220 560 248M735 242 C735 268 560 220 560 248');
  place('sum-label',mobile?{left:177,top:278,fontSize:16}:{left:467,top:225});
  timeline=G.timeline({paused:true,defaults:{ease:'power2.inOut'},onUpdate:update,onComplete:()=>{timeline.pause();update();}});
  timeline.to({},{duration:E.duration},0);
  E.cues.forEach(c=>timeline.addLabel(c.label,c.time));
  // The original note yields its three persistent objects to the prompt input.
  timeline.to('#source-paper',{x:mobile?0:-330,y:mobile?-12:25,scale:.76,opacity:mobile?.14:.35,duration:2},5.9);
  timeline.to('#source-caption',{opacity:0,duration:.8},6);
  timeline.to('#prompt-paper',{opacity:1,y:0,duration:1.8},6.6);
  const promptXs=mobile?[62,211,360]:[374,574,774],promptY=mobile?313:280;
  allTokens.forEach((token,i)=>timeline.to(token,{left:promptXs[i],top:promptY,width:mobile?138:178,height:44,backgroundColor:'#fff',borderColor:'#dce5f5',boxShadow:'0 3px 6px #4b65990b',duration:2.15},7.4+i*.18));
  timeline.to('.token .item-label',{top:22,fontSize:mobile?17:16,left:10,duration:1.7},7.4).to('.token .token-glyph',{opacity:0,width:0,duration:1.2},7.4).to('.token .amount',{fontSize:mobile?22:23,right:10,duration:1.7},7.4);
  // The model returns the same items as separate records. Its response is illustrative.
  timeline.to('#source-paper',{opacity:0,duration:1},14.1).to('#prompt-paper',{x:mobile?0:-315,y:mobile?-30:12,scale:mobile?.86:.56,opacity:mobile?0:.35,duration:1.7},14.4);
  timeline.to('#model-unit',{opacity:1,duration:1.1},15.2).to('#path-in,#path-out',{opacity:1,strokeDashoffset:0,duration:1.8},15.4);
  timeline.to('#model-signal',{opacity:.65,scale:1.05,duration:.8},16.2).to('#model-signal',{opacity:0,scale:1.12,duration:.9},17.1);
  timeline.to('#extraction-paper',{opacity:1,duration:1.4},17.2);
  allTokens.forEach((token,i)=>timeline.to(token,{left:out.left,top:out.ys[i],width:out.width,height:out.height,backgroundColor:'#f5f7fb',borderColor:'#e4eaf2',boxShadow:'0 0 0 #0000',duration:2.1},17.3+i*.28));
  timeline.to('.token .item-label',{top:27,fontSize:mobile?21:17,left:14,duration:1.7},17.3).to('.token .amount',{fontSize:mobile?28:25,right:mobile?112:92,duration:1.7},17.3).to('.category',{opacity:1,duration:1.3},18.8);
  // Split according to one explicit business rule, preserving the excluded record.
  timeline.to('#prompt-paper,#model-unit,#path-in,#path-out,#extraction-paper',{opacity:0,duration:1.3},23);
  timeline.to('#filter-rule,#filter-accepted,#filter-rejected',{opacity:1,duration:1.2},23.6);
  const keepLeft=mobile?70:330,keepYs=mobile?[193,270]:[156,244],keepWidth=mobile?420:350;
  allTokens.slice(0,2).forEach((token,i)=>timeline.to(token,{left:keepLeft,top:keepYs[i],width:keepWidth,height:mobile?60:58,backgroundColor:'#eef6f2',borderColor:'#cbdfd5',duration:1.9},23.7+i*.12));
  timeline.to('#token-meal .item-label,#token-taxi .item-label',{top:mobile?30:29,duration:1.9},23.7);
  timeline.to('#token-coffee',{left:mobile?75:803,top:mobile?408:224,width:mobile?410:260,height:mobile?56:52,backgroundColor:'#f1eae4',borderColor:'#ddcabb',opacity:.62,scale:mobile?1:.86,duration:2},23.9);
  timeline.to('#token-coffee .amount',{right:mobile?112:81,duration:1.9},23.9).to('.coffee-slash',{opacity:.65,duration:.7},25.4).to('#reject-reason',{opacity:1,duration:.8},25.7);
  // Consume the two retained amounts; show the exact computed result, without fake intermediate totals.
  timeline.to('#filter-rule,#filter-accepted,#filter-rejected,#reject-reason',{opacity:0,duration:1},30);
  const operandXs=mobile?[70,340]:[306,656];
  allTokens.slice(0,2).forEach((token,i)=>timeline.to(token,{left:operandXs[i],top:mobile?174:150,width:158,height:100,backgroundColor:'#ffffff00',borderColor:'#ffffff00',duration:2},30.3+i*.1));
  timeline.to('#token-meal .category,#token-taxi .category',{opacity:0,duration:.7},30.3).to('#token-meal .item-label,#token-taxi .item-label',{top:-10,left:0,width:158,justifyContent:'center',fontSize:mobile?20:15,color:'#7a8c9d',duration:2},30.3).to('#token-meal .amount,#token-taxi .amount',{right:26,fontSize:mobile?50:52,color:'#3c675f',duration:2},30.3);
  timeline.to('#token-coffee',{opacity:0,y:18,scale:.7,duration:1},30.4).to('#sum-plus,#sum-line,#sum-label',{opacity:1,duration:1.4},31.6);
  timeline.to('#result-paper',{opacity:1,duration:1.4},33.2).fromTo('#result-total',{y:13,opacity:0},{y:0,opacity:1,duration:1.1,ease:'power3.out',immediateRender:false},33.5);
  // Land on the final receipt. Objects quietly leave while the answer stays readable.
  timeline.to('#token-meal,#token-taxi,#sum-plus,#sum-line,#sum-label',{opacity:0,y:-15,duration:1.1},38.4);
  timeline.to('#result-paper',{top:mobile?160:113,height:242,scale:mobile?1.14:1.1,duration:1.7},38.5).to('#final-seal',{opacity:.8,duration:1},39.7).to('#result-caption',{opacity:1,duration:1},40);
  currentScene='';timeline.time(oldTime,false);if(wasPlaying&&!reduced.matches)timeline.play();update();
}

$('play').addEventListener('click',()=>timeline.paused()?play():pause());
$('replay').addEventListener('click',()=>{goTo(0);if(!reduced.matches)play();});
$('scrubber').addEventListener('pointerdown',pause);
$('scrubber').addEventListener('input',event=>goTo(Number(event.target.value)/100));
$('cues').addEventListener('click',event=>{const b=event.target.closest('[data-cue]');if(b)goTo(E.cues[Number(b.dataset.cue)].time,true);});
document.addEventListener('keydown',event=>{
  if($('inspector').open||event.target.matches('input,textarea,button,[contenteditable]'))return;
  if(event.code==='Space'){event.preventDefault();timeline.paused()?play():pause();}
  if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();goTo(timeline.time()+(event.key==='ArrowRight'?1:-1));}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
reduced.addEventListener('change',()=>{pause();rebuild();});
const observer=new ResizeObserver(()=>{cancelAnimationFrame(resizeTask);resizeTask=requestAnimationFrame(rebuild);});observer.observe(stage);

const dialog=$('inspector');$('inspect').addEventListener('click',()=>{pause();dialog.showModal();});$('close-inspector').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
function tab(name){for(const b of dialog.querySelectorAll('[data-tab]')){const chosen=b.dataset.tab===name;b.setAttribute('aria-selected',chosen);b.tabIndex=chosen?0:-1;$('panel-'+b.dataset.tab).hidden=!chosen;}}
for(const b of dialog.querySelectorAll('[data-tab]')){b.addEventListener('click',()=>tab(b.dataset.tab));b.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const name=event.key==='Home'?'prompt':event.key==='End'?'data':b.dataset.tab==='prompt'?'data':'prompt';tab(name);$('tab-'+name).focus();}});}
rebuild();
})();
