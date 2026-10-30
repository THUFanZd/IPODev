import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawn,spawnSync} from 'node:child_process';
const skill=process.env.IPO_SKILL_ROOT||fileURLToPath(new URL('../skills/ipo-dev/',import.meta.url));
const {validateStory,readBlock,embedFeedback,validateFeedback,emptyFeedback}=await import(pathToFileURL(path.join(skill,'scripts/running-lib.mjs')));
const story={schemaVersion:1,id:'test-story',revision:1,title:'字符变成结果',subtitle:'具体数据的连续变化',duration:8,canvas:{width:900,height:420},example:{sampleKind:'illustrative',summary:'两个字符组合成一个词',initial:['缓','存'],result:'缓存',assumptions:[]},cues:[{id:'start',time:0,label:'字符',title:'两个字符',caption:'原始内容'},{id:'end',time:8,label:'结果',title:'组成一个词',caption:'得到缓存',details:{result:'缓存'}}]};
function project(output){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'running-skill-test-'));
 fs.writeFileSync(path.join(dir,'story.json'),JSON.stringify(story));
 fs.writeFileSync(path.join(dir,'scene.html'),'<div data-object-id="text">缓 存</div>');
 fs.writeFileSync(path.join(dir,'scene.css'),'#world{color:#123456}');
 fs.writeFileSync(path.join(dir,'scene.js'),'window.designExample=({timeline,gsap,world})=>{gsap.set(world.children[0],{opacity:1});timeline.to(world.children[0],{x:100,duration:2},2);};');
 const result=spawnSync(process.execPath,[path.join(skill,'scripts/build-running.mjs'),'--project',dir,...(output?['--output',output]:[])],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
 return dir;
}
test('portable build preserves arbitrary story and author scene, with parseable inline scripts',()=>{
 const dir=project(),html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
 assert.deepEqual(readBlock(html,'running-story'),story);
 assert.equal(readBlock(html,'running-feedback').comments.length,0);
 assert.ok(html.includes('data-object-id="text"'));
 assert.ok(!/<script[^>]+src=/.test(html));
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(!match[0].includes('application/json'))new vm.Script(match[1]);
});
test('feedback escapes HTML and retains annotations when a cue is removed',()=>{
 const c={id:'note-1',cueId:'start',time:2,body:'保留 </script> 与 $& 的文字',createdAt:new Date().toISOString()};
 const f={...emptyFeedback(story),comments:[c]};
 const html=embedFeedback('<script id="running-feedback" type="application/json">{}</script>',f);
 assert.deepEqual(readBlock(html,'running-feedback'),f);assert.ok(!html.includes('保留 </script>'));
 const changed={...story,cues:[{...story.cues[0],id:'new-start'},story.cues[1]]};
 assert.equal(validateFeedback(f,changed,f),f);
 assert.throws(()=>validateFeedback({...f,comments:[]},story,f),/preserved/);
 assert.throws(()=>validateFeedback({...f,comments:[{...c,cueId:'missing'}]},story),/location/);
 assert.throws(()=>validateStory({...story,cues:[story.cues[1],story.cues[0]]}),/start and end/);
});
for(const output of [undefined,'数据 example.html'])test('local service saves notes into chosen HTML/JSON and rejects stale or external edits: '+(output||'default'),async()=>{
 const dir=project(output),filename=output||'index.html',port=18000+Math.floor(Math.random()*20000);
 if(output)assert.equal(fs.existsSync(path.join(dir,'index.html')),false);
 const child=spawn(process.execPath,[path.join(skill,'scripts/serve-running.mjs'),'--project',dir,'--port',String(port),...(output?['--output',output]:[])],{stdio:['ignore','pipe','pipe']});
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('server timeout')),5000);child.stdout.once('data',()=>{clearTimeout(timer);resolve();});child.once('error',reject);});
  const url='http://127.0.0.1:'+port,state=await (await fetch(url+'/api/state')).json();
  for(const route of ['/', '/'+encodeURIComponent(filename)]){
   const response=await fetch(url+route);assert.equal(response.status,200);
   assert.deepEqual(readBlock(await response.text(),'running-story'),story);
  }
  const f={...state.feedback,comments:[{id:'note-http',cueId:'start',time:2,body:'测试批注',createdAt:new Date().toISOString()}]};
  const put=base=>fetch(url+'/api/feedback',{method:'PUT',headers:{'Content-Type':'application/json','X-Running-Token':state.token},body:JSON.stringify({baseVersion:base,feedback:f})});
  assert.equal((await put(0)).status,200);
  assert.equal(readBlock(fs.readFileSync(path.join(dir,filename),'utf8'),'running-feedback').comments[0].body,'测试批注');
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'feedback.json'),'utf8')).version,1);
  assert.equal((await put(0)).status,409);
  fs.appendFileSync(path.join(dir,filename),'<!-- external edit -->');
  assert.equal((await put(1)).status,409);
 }finally{child.kill();}
});
