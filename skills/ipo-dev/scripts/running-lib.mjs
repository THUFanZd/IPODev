import fs from 'node:fs';
import {safeJson} from './lib.mjs';
export {safeJson};
export function htmlFilename(value='index.html'){
 if(typeof value!=='string'||!value.trim()||/[\\/\u0000<>:"|?*#]/.test(value)||!value.toLowerCase().endsWith('.html'))throw Error('Output must be an HTML filename within the project directory');
 return value;
}
const text=x=>typeof x==='string'&&x.trim().length>0;
export function validateStory(s){
 const need=(ok,message)=>{if(!ok)throw Error(message);};
 need(s?.schemaVersion===1&&text(s.id)&&Number.isSafeInteger(s.revision)&&s.revision>0,'Invalid story identity');
 need(text(s.title)&&text(s.subtitle)&&Number.isFinite(s.duration)&&s.duration>0,'Title, subtitle and positive duration required');
 need(s.canvas&&['width','height'].every(k=>Number.isFinite(s.canvas[k])&&s.canvas[k]>0),'Canvas size required');
 for(const k of ['mobileWidth','mobileHeight'])if(s.canvas[k]!==undefined)need(Number.isFinite(s.canvas[k])&&s.canvas[k]>0,'Invalid mobile canvas size');
 const e=s.example;
 need(e&&text(e.summary)&&['actual','excerpt','illustrative'].includes(e.sampleKind)&&Object.hasOwn(e,'initial')&&Object.hasOwn(e,'result')&&Array.isArray(e.assumptions)&&e.assumptions.every(text),'Concrete example, provenance and assumptions required');
 need(Array.isArray(s.cues)&&s.cues.length>=2&&s.cues[0].time===0&&s.cues.at(-1).time===s.duration,'Timeline must include start and end');
 need(new Set(s.cues.map(c=>c.id)).size===s.cues.length,'Duplicate cue ID');
 s.cues.forEach((c,i)=>need(text(c.id)&&text(c.label)&&text(c.title)&&text(c.caption)&&Number.isFinite(c.time)&&c.time>=0&&c.time<=s.duration&&(!i||c.time>s.cues[i-1].time),'Invalid or unordered cue'));
 return s;
}
export function emptyFeedback(s){return{schemaVersion:1,projectId:s.id,projectRevision:s.revision,version:0,comments:[]};}
export function validateFeedback(f,s,previous){
 if(f?.schemaVersion!==1||f.projectId!==s.id||f.projectRevision!==s.revision||!Number.isSafeInteger(f.version)||f.version<0||!Array.isArray(f.comments)||f.comments.length>2000||new Set(f.comments.map(c=>c.id)).size!==f.comments.length)throw Error('Invalid feedback identity');
 for(const c of f.comments){
  const old=previous?.comments.find(p=>p.id===c.id);
  if(!text(c.id)||!text(c.cueId)||!Number.isFinite(c.time)||c.time<0||!text(c.body)||c.body.length>10000||!Number.isFinite(Date.parse(c.createdAt))||(c.objectId!==undefined&&typeof c.objectId!=='string')||(c.agentReply!==undefined&&(typeof c.agentReply!=='string'||c.agentReply.length>20000)))throw Error('Invalid comment');
  if((c.time>s.duration||!s.cues.some(q=>q.id===c.cueId))&&(!old||['cueId','time','body','createdAt','objectId'].some(k=>c[k]!==old[k])))throw Error('Invalid comment location');
 }
 for(const old of previous?.comments||[])if(!f.comments.some(c=>c.id===old.id&&['cueId','time','body','createdAt','objectId'].every(k=>c[k]===old[k])))throw Error('Existing comments must be preserved');
 return f;
}
export function readBlock(html,id){
 const match=html.match(new RegExp('<script id="'+id+'" type="application/json">([\\s\\S]*?)</script>'));
 if(!match)throw Error('Missing '+id);
 return JSON.parse(match[1]);
}
export function embedFeedback(html,f){return html.replace(/(<script id="running-feedback" type="application\/json">)[\s\S]*?(<\/script>)/,(_,a,z)=>a+safeJson(f)+z);}
export function ensureUnchanged(files){for(const [p,contents] of files)if(fs.readFileSync(p,'utf8')!==contents)throw Error('Files changed outside the server; stop and rebuild before saving');}
