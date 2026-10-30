(function(){
'use strict';
const $=id=>document.getElementById(id),story=JSON.parse($('running-story').textContent),G=window.gsap;
let feedback=JSON.parse($('running-feedback').textContent),timeline,seekTween,cleanup,activeCue='',resizeTask,token=null,baseVersion=feedback.version,saveBusy=false;
const stage=$('rx-stage'),world=$('world'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const key='running-example:'+story.id+':'+story.revision+':'+location.pathname;
const draftKey=key+':draft';
const clamp=t=>Math.max(0,Math.min(story.duration,t));
const cueAt=t=>story.cues.findLast(c=>t>=c.time)||story.cues[0];
const clock=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
const error=message=>{$('rx-error').hidden=false;$('rx-error').textContent=message;};
const safeJSON=x=>JSON.stringify(x,null,2).replace(/</g,'\\u003c');
document.title=story.title;$('rx-title').textContent=story.title;$('rx-subtitle').textContent=story.subtitle;
$('rx-provenance').textContent={illustrative:'示意案例',actual:'实际内容',excerpt:'真实内容节选'}[story.example.sampleKind];
$('rx-example-content').textContent=JSON.stringify(story.example,null,2);
$('rx-range').max=story.duration;
story.cues.forEach(c=>{const b=document.createElement('button');b.className='rx-cue';b.textContent=c.label;b.title=c.title;b.setAttribute('aria-label','跳到'+c.label);b.dataset.cue=c.id;b.style.left=c.time/story.duration*100+'%';b.addEventListener('click',()=>go(c.time,true));$('rx-cues').append(b);});
if(story.example.assumptions.length){$('rx-assumptions').hidden=false;for(const text of story.example.assumptions){const li=document.createElement('li');li.textContent=text;$('rx-assumption-list').append(li);}}
function update(){
 if(!timeline)return;
 const t=timeline.time(),cue=cueAt(t),playing=!timeline.paused()&&t<story.duration;
 $('rx-range').value=t;$('rx-range').style.setProperty('--progress',t/story.duration*100+'%');
 $('rx-range').setAttribute('aria-valuetext',cue.title+'，'+Math.round(t/story.duration*100)+'%');
 $('rx-time').textContent=clock(t)+' / '+clock(story.duration);
 $('rx-play').textContent=playing?'暂停':t>=story.duration?'再播放':'播放';
 $('rx-play').setAttribute('aria-label',playing?'暂停演示':t>=story.duration?'重新播放演示':'播放演示');
 if(activeCue!==cue.id){activeCue=cue.id;$('rx-now-title').textContent=cue.title;$('rx-caption').textContent=cue.caption;stage.setAttribute('aria-label',cue.title+'。'+cue.caption);for(const b of $('rx-cues').children)b.setAttribute('aria-current',b.dataset.cue===cue.id?'step':'false');}
}
function pause(){seekTween?.kill();seekTween=null;timeline?.pause();update();}
function go(t,smooth=false){pause();t=clamp(t);if(smooth&&!reduced.matches)seekTween=G.to(timeline,{time:t,duration:.6,ease:'power2.inOut',onUpdate:update,onComplete:()=>{seekTween=null;update();}});else timeline.time(t,false);update();}
function play(){
 if(reduced.matches){go(story.cues.find(c=>c.time>timeline.time()+.01)?.time??0);return;}
 seekTween?.kill();seekTween=null;if(timeline.time()>=story.duration)timeline.time(0,false);timeline.play();update();
}
function rebuild(){
 const t=timeline?.time()||0,playing=timeline&&!timeline.paused();
 seekTween?.kill();timeline?.kill();cleanup?.();cleanup=null;
 G.set(world.querySelectorAll('*'),{clearProps:'all'});
 const mobile=stage.clientWidth<600,c=story.canvas,W=mobile?(c.mobileWidth||c.width):c.width,H=mobile?(c.mobileHeight||c.height):c.height;
 const responsiveHeight=mobile?Math.max(430,Math.min(660,(stage.clientWidth-16)*H/W+24)):null;
 if(mobile)stage.style.height=responsiveHeight+'px';else stage.style.removeProperty('height');
 world.style.width=W+'px';world.style.height=H+'px';
 const scale=Math.min((stage.clientWidth-16)/W,(stage.clientHeight-24)/H);
 world.style.transform='translate('+(-W*scale/2)+'px,'+(-H*scale/2)+'px) scale('+scale+')';
 const cueWidth=$('rx-cues').clientWidth;
 for(let i=0;i<story.cues.length;i++){
  const c=story.cues[i],left=i?(c.time-story.cues[i-1].time)/story.duration*cueWidth:Infinity,right=i<story.cues.length-1?(story.cues[i+1].time-c.time)/story.duration*cueWidth:Infinity;
  const available=(i===0?right/2:i===story.cues.length-1?left/2:Math.min(left,right))-5;
  $('rx-cues').children[i].style.maxWidth=Math.max(12,Math.min(mobile?60:110,available))+'px';
 }
 timeline=G.timeline({paused:true,defaults:{ease:'power2.inOut'},onUpdate:update,onComplete:()=>{timeline.pause();update();}});
 timeline.to({},{duration:story.duration},0);
 cleanup=window.designExample({timeline,gsap:G,world,story,mobile});
 if(typeof cleanup!=='function')cleanup=null;
 if(timeline.duration()>story.duration+.001)throw Error('Scene animations exceed story.duration');
 activeCue='';timeline.time(t,false);if(playing&&!reduced.matches)timeline.play();update();
}
function localRemember(){
 $('running-feedback').textContent=safeJSON(feedback);
 try{localStorage.setItem(key,JSON.stringify(feedback));}catch{}
 $('rx-note-count').textContent=feedback.comments.length;
}
function renderNotes(){
 $('rx-note-list').replaceChildren();
 for(const c of feedback.comments){const item=document.createElement('div');item.className='rx-note';const b=document.createElement('button');b.className='rx-note-location';b.textContent=clock(c.time)+' · '+(story.cues.find(q=>q.id===c.cueId)?.label||c.cueId)+(c.objectId?' · '+c.objectId:'');b.addEventListener('click',()=>{go(c.time);$('rx-note-dialog').close();});const p=document.createElement('p');p.textContent=c.body;item.append(b,p);if(c.agentReply){const reply=document.createElement('p');reply.className='rx-note-reply';reply.textContent='修改回复：'+c.agentReply;item.append(reply);}$('rx-note-list').append(item);}
 $('rx-note-count').textContent=feedback.comments.length;
}
async function save(){
 if(!token){$('rx-save-status').textContent='批注已保留在浏览器；请保存 HTML 副本交给 agent';return false;}
 if(saveBusy){$('rx-save-status').textContent='正在保存，请稍后再试';return false;}saveBusy=true;
 try{
  const response=await fetch('/api/feedback',{method:'PUT',headers:{'Content-Type':'application/json','X-Running-Token':token},body:JSON.stringify({baseVersion,feedback})}),result=await response.json();
  if(!response.ok)throw Error(result.error);
  baseVersion=result.version;feedback.version=baseVersion;localRemember();$('rx-save-status').textContent='批注已保存到 HTML 与 feedback.json';return true;
 }catch(e){$('rx-save-status').textContent='保存未完成：'+e.message+'。请保存 HTML 副本。';return false;}finally{saveBusy=false;}
}
async function connect(){
 if(!/^https?:$/.test(location.protocol))return;
 try{const response=await fetch('/api/state');if(!response.ok)return;const state=await response.json();if(state.projectId!==story.id||state.projectRevision!==story.revision)return;
  token=state.token;baseVersion=state.feedback.version;
  // Merge only additive local notes. Server copies remain authoritative for existing IDs.
  const unsaved=feedback.comments.filter(c=>!state.feedback.comments.some(p=>p.id===c.id));feedback={...state.feedback,comments:[...state.feedback.comments,...unsaved]};localRemember();renderNotes();
  if(unsaved.length)await save();else $('rx-save-status').textContent='本机保存已连接';
 }catch{}
}
try{const local=JSON.parse(localStorage.getItem(key)||'null');if(local?.projectId===story.id&&local.projectRevision===story.revision&&Array.isArray(local.comments)){const ids=new Set(feedback.comments.map(c=>c.id));feedback.comments.push(...local.comments.filter(c=>!ids.has(c.id)));}}catch{}
try{
 if(!G||typeof window.designExample!=='function')throw Error('Missing GSAP or scene design');
 rebuild();new ResizeObserver(()=>{cancelAnimationFrame(resizeTask);resizeTask=requestAnimationFrame(()=>{try{rebuild();}catch(e){error(e.message);}});}).observe(stage);
}catch(e){error('画面加载失败：'+e.message);$('rx-play').disabled=true;$('rx-range').disabled=true;}
$('rx-range').addEventListener('pointerdown',pause);
$('rx-range').addEventListener('input',e=>go(Number(e.target.value)));
$('rx-play').addEventListener('click',()=>timeline.paused()?play():pause());
$('rx-replay').addEventListener('click',()=>{go(0);if(!reduced.matches)play();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
reduced.addEventListener('change',pause);
document.addEventListener('keydown',e=>{if($('rx-inspector').open||$('rx-note-dialog').open||e.target.matches('input,textarea,select,button'))return;if(e.code==='Space'){e.preventDefault();timeline.paused()?play():pause();}if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();go(timeline.time()+(e.key==='ArrowRight'?1:-1));}});
$('rx-details').addEventListener('click',()=>{pause();const c=cueAt(timeline.time());$('rx-detail-label').textContent=clock(timeline.time())+' · '+c.title;$('rx-detail-content').textContent=typeof c.details==='string'?c.details:JSON.stringify(c.details??{说明:c.caption},null,2);$('rx-inspector').showModal();});
$('rx-close-details').addEventListener('click',()=>$('rx-inspector').close());
$('rx-notes').addEventListener('click',()=>{
 pause();const t=timeline.time(),c=cueAt(t);$('rx-note-context').textContent=clock(t)+' · '+c.title;
 $('rx-note-object').replaceChildren(new Option('整个画面',''));
 const seen=new Set();for(const el of world.querySelectorAll('[data-object-id]')){if(seen.has(el.dataset.objectId))continue;const r=el.getBoundingClientRect(),sr=stage.getBoundingClientRect();let hidden=r.width===0||r.height===0||r.right<sr.left||r.left>sr.right||r.bottom<sr.top||r.top>sr.bottom;for(let parent=el;parent&&parent!==stage;parent=parent.parentElement){const s=getComputedStyle(parent);if(Number(s.opacity)===0||s.visibility==='hidden'||s.display==='none')hidden=true;}if(hidden)continue;seen.add(el.dataset.objectId);$('rx-note-object').add(new Option(el.dataset.objectLabel||el.dataset.objectId,el.dataset.objectId));}
 try{$('rx-note-body').value=localStorage.getItem(draftKey)||'';}catch{}
 $('rx-note-message').textContent='';renderNotes();$('rx-note-dialog').showModal();
});
$('rx-close-notes').addEventListener('click',()=>$('rx-note-dialog').close());
$('rx-note-body').addEventListener('input',()=>{try{localStorage.setItem(draftKey,$('rx-note-body').value);}catch{}});
$('rx-note-form').addEventListener('submit',async e=>{
 e.preventDefault();const body=$('rx-note-body').value.trim();if(!body||saveBusy)return;
 const t=timeline.time(),c=cueAt(t);feedback.comments.push({id:crypto.randomUUID?.()||'note-'+Date.now()+'-'+Math.random().toString(36).slice(2),cueId:c.id,time:t,objectId:$('rx-note-object').value,body,createdAt:new Date().toISOString()});
 $('rx-note-body').value='';try{localStorage.setItem(draftKey,'');}catch{}localRemember();renderNotes();
 const ok=await save();$('rx-note-message').textContent=ok?'已保存到页面文件':'已保留批注；请用“保存 HTML 副本”导出。';
});
$('rx-export').addEventListener('click',()=>{
 pause();localRemember();
 const clone=document.documentElement.cloneNode(true);clone.querySelector('#running-feedback').textContent=safeJSON(feedback);
 for(const dialog of clone.querySelectorAll('dialog'))dialog.removeAttribute('open');
 const url=URL.createObjectURL(new Blob(['<!doctype html>\n'+clone.outerHTML],{type:'text/html;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='running-example-notes.html';a.click();URL.revokeObjectURL(url);
});
localRemember();renderNotes();connect();
})();
