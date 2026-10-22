import fs from 'node:fs';
import path from 'node:path';
export function args(argv){const result={};for(let i=0;i<argv.length;i+=2){if(!argv[i].startsWith('--')||!argv[i+1])throw Error('Expected --name value');result[argv[i].slice(2)]=argv[i+1];}return result;}
export function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));}
export function safeJson(value){return JSON.stringify(value,null,2).replace(/</g,'\\u003c');}
export function writeAtomic(file,text){const temp=file+'.pending';fs.writeFileSync(temp,text,'utf8');fs.renameSync(temp,file);}
export function projectPaths(root){return{root:path.resolve(root),model:path.resolve(root,'project.json'),feedback:path.resolve(root,'feedback.json'),html:path.resolve(root,'index.html')};}
export function outputDerivations(n){
 if(n.process.derivations?.length)return n.process.derivations;
 return n.output.artifactIds.map(id=>({id:'output-'+id,outputId:id,inputIds:n.output.artifactIds.length===1?[...n.input.artifactIds]:[],steps:[n.process.description],traceIds:n.trace.map(t=>t.id),legacy:true,uncertain:n.output.artifactIds.length>1}));
}
export function anchors(n){return new Set(['input','process','output',...(n.input.artifactIds||[]).concat(n.output.artifactIds||[]).map(id=>'artifact:'+id),...n.process.rules.map(x=>'rule:'+x.id),...n.trace.map(x=>'trace:'+x.id),...n.questions.map(x=>'question:'+x.id),...outputDerivations(n).map(x=>'derivation:'+x.id)]);}
export function validateModel(m){
 const require=(ok,message)=>{if(!ok)throw Error(message);};const text=x=>typeof x==='string'&&x.trim().length>0;
 require(m.schemaVersion===2&&text(m.id)&&Number.isSafeInteger(m.revision)&&m.revision>0,'Invalid model identity (schema v2 required)');
 require(['plan','review'].includes(m.mode),'Invalid mode');for(const k of ['title','subtitle','goal','scope'])require(text(m[k]),'Missing '+k);
 require(Array.isArray(m.nodes)&&m.nodes.length>0,'Missing steps');const ids=new Set(m.nodes.map(n=>n.id));require(ids.size===m.nodes.length,'Duplicate step ID');
 require(Array.isArray(m.artifacts)&&m.artifacts.length>0,'Concrete artifacts required');
 const artifacts=new Map(m.artifacts.map(a=>[a.id,a]));require(artifacts.size===m.artifacts.length,'Duplicate artifact ID');
 for(const a of m.artifacts){require(text(a.id)&&text(a.name)&&text(a.location)&&text(a.format)&&['file','data','html','dom','request'].includes(a.kind),'Invalid artifact source');if(a.summary!==undefined)require(text(a.summary),'Invalid artifact summary');require(['actual','excerpt','illustrative'].includes(a.sampleKind)&&Object.hasOwn(a,'example'),'Artifact sample/provenance required');require(Array.isArray(a.fields)&&a.fields.every(f=>text(f.path)&&text(f.type)&&text(f.meaning)),'Artifact fields required');if(a.producedBy)require(ids.has(a.producedBy),'Unknown artifact producer');}
 require(Array.isArray(m.flow)&&m.flow.length>1&&m.flow.every(id=>artifacts.has(id)),'Invalid dataflow chain');
 for(const n of m.nodes){
  require(text(n.id)&&text(n.title)&&text(n.summary),'Invalid step');require(Array.isArray(n.dependsOn)&&n.dependsOn.every(id=>ids.has(id)&&id!==n.id),'Invalid dependency');
  for(const k of ['input','output']){require(n[k]&&text(n[k].description)&&Array.isArray(n[k].artifactIds)&&n[k].artifactIds.length>0&&n[k].artifactIds.every(id=>artifacts.has(id)),'Missing concrete '+k+' artifacts in '+n.id);if(n[k].summary!==undefined)require(text(n[k].summary),'Invalid I/O summary');}
  for(const id of n.output.artifactIds)require(artifacts.get(id).producedBy===n.id,'Output producer mismatch: '+id);
  for(const id of n.input.artifactIds){const producer=artifacts.get(id).producedBy;if(producer)require(n.dependsOn.includes(producer),'Input dependency missing: '+id);}
  require(n.process&&text(n.process.description)&&Array.isArray(n.process.rules)&&Array.isArray(n.process.errors)&&n.process.errors.every(text),'Invalid process');
  require(Array.isArray(n.trace)&&n.trace.length>0&&Array.isArray(n.questions),'Missing intermediate transformations');
  for(const list of [n.trace,n.process.rules,n.questions])require(list.every(x=>text(x.id))&&new Set(list.map(x=>x.id)).size===list.length,'Duplicate/missing detail IDs');
  require(n.process.rules.every(x=>text(x.text)&&['proposed','observed','unresolved'].includes(x.state)),'Invalid rule');
  if(n.process.mappings)require(Array.isArray(n.process.mappings)&&n.process.mappings.every(x=>text(x.from)&&text(x.operation)&&text(x.to)),'Invalid field mapping');
  require(n.trace.every(x=>text(x.label)&&text(x.operation)&&Object.hasOwn(x,'before')&&Object.hasOwn(x,'after')),'Incomplete transformation');
  if(n.process.derivations!==undefined){const ds=n.process.derivations;require(Array.isArray(ds)&&ds.length===n.output.artifactIds.length&&new Set(ds.map(d=>d.id)).size===ds.length&&new Set(ds.map(d=>d.outputId)).size===ds.length,'One derivation per output required');for(const d of ds){require(text(d.id)&&n.output.artifactIds.includes(d.outputId)&&Array.isArray(d.inputIds)&&d.inputIds.length>0&&d.inputIds.every(id=>n.input.artifactIds.includes(id)),'Invalid output/input derivation');require(Array.isArray(d.steps)&&d.steps.length>0&&d.steps.every(text),'Derivation needs readable steps');require(!d.traceIds||(Array.isArray(d.traceIds)&&d.traceIds.every(id=>n.trace.some(t=>t.id===id))),'Invalid derivation trace');}}
  require(n.questions.every(x=>text(x.text)&&text(x.impact)&&anchors(n).has(x.field)),'Invalid question anchor');
 }
 for(const a of m.artifacts.filter(a=>a.producedBy))require(m.nodes.find(n=>n.id===a.producedBy).output.artifactIds.includes(a.id),'Producer does not output artifact: '+a.id);
 for(let i=1;i<m.flow.length;i++)require(m.nodes.some(n=>n.input.artifactIds.includes(m.flow[i-1])&&n.output.artifactIds.includes(m.flow[i])),'Disconnected dataflow chain');
 const visiting=new Set(),done=new Set();function visit(id){require(!visiting.has(id),'Dependency cycle');if(done.has(id))return;visiting.add(id);m.nodes.find(n=>n.id===id).dependsOn.forEach(visit);visiting.delete(id);done.add(id);}m.nodes.forEach(n=>visit(n.id));return m;
}
export function emptyFeedback(m){return{schemaVersion:1,projectId:m.id,projectRevision:m.revision,version:0,comments:[]};}
export function validateFeedback(f,m,previous){
 if(f.schemaVersion!==1||f.projectId!==m.id||f.projectRevision!==m.revision||!Array.isArray(f.comments)||f.comments.length>2000||new Set(f.comments.map(c=>c.id)).size!==f.comments.length)throw Error('Invalid note data');
 for(const c of f.comments){
  if(typeof c.id!=='string'||!c.id||typeof c.nodeId!=='string'||typeof c.field!=='string'||typeof c.body!=='string'||!c.body.trim()||c.body.length>10000||!Number.isFinite(Date.parse(c.createdAt))||(c.agentReply!==undefined&&(typeof c.agentReply!=='string'||c.agentReply.length>20000)))throw Error('Invalid note');
  const n=m.nodes.find(n=>n.id===c.nodeId),old=previous?.comments.find(x=>x.id===c.id);
  if((!n||!anchors(n).has(c.field))&&(!old||['nodeId','field','body','createdAt'].some(k=>c[k]!==old[k])))throw Error('Invalid note anchor');
 }
 for(const old of previous?.comments||[]){if(!f.comments.some(c=>c.id===old.id))throw Error('Existing notes must be preserved');}
 return f;
}
export function embedFeedback(html,feedback){return html.replace(/(<script id="ipo-feedback" type="application\/json">)[\s\S]*?(<\/script>)/,(_,start,end)=>start+safeJson(feedback)+end);}
export function renderDocument(template,model,feedback){
 for(const name of ['MODEL','FEEDBACK']){const marker=`/*__IPO_${name}__*/`;if(template.split(marker).length!==2)throw Error(`Template needs exactly one ${marker}`);}
 // Replace in one pass: model examples can themselves contain these markers.
 return template.replace(/\/\*__IPO_(MODEL|FEEDBACK)__\*\//g,(_,name)=>safeJson(name==='MODEL'?model:feedback));
}
