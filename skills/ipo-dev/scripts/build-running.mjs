import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {args,readJson,writeAtomic,safeJson} from './lib.mjs';
import {validateStory,emptyFeedback,validateFeedback,htmlFilename} from './running-lib.mjs';
const options=args(process.argv.slice(2));
if(!options.project)throw Error('Usage: node build-running.mjs --project <directory> [--output <filename.html>]');
const root=path.resolve(options.project),asset=fileURLToPath(new URL('../assets/',import.meta.url));
const output=path.join(root,htmlFilename(options.output));
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const story=validateStory(JSON.parse(read('story.json')));
const feedbackPath=path.join(root,'feedback.json');
const previous=fs.existsSync(feedbackPath)?readJson(feedbackPath):emptyFeedback(story);
if(previous.projectId!==story.id)throw Error('Feedback belongs to another project');
const feedback={...previous,projectRevision:story.revision,version:previous.version+(previous.projectRevision!==story.revision?1:0)};
validateFeedback(feedback,story,previous);
const scene=read('scene.html'),css=read('scene.css'),script=read('scene.js');
if(!scene.trim()||!script.trim())throw Error('Authored scene HTML and JS required');
if(/<script\b/i.test(scene))throw Error('Put scene scripts in scene.js');
if(/<\/style/i.test(css))throw Error('Invalid closing style tag in scene.css');
new vm.Script(script,{filename:'scene.js'});
const js=s=>s.replace(/<\/script/gi,'<\\/script');
const chunks={
 STORY:safeJson(story),FEEDBACK:safeJson(feedback),SCENE:scene,CSS:css,
 GSAP:js(fs.readFileSync(path.join(asset,'vendor/gsap.min.js'),'utf8')),
 SCRIPT:js(script),PLAYER:js(fs.readFileSync(path.join(asset,'running-player.js'),'utf8'))
};
const template=fs.readFileSync(path.join(asset,'running.html'),'utf8');
for(const key of Object.keys(chunks))if(template.split('/*__RUN_'+key+'__*/').length!==2)throw Error('Invalid template marker '+key);
const html=template.replace(/\/\*__RUN_(\w+)__\*\//g,(_,key)=>chunks[key]);
writeAtomic(output,html);
writeAtomic(feedbackPath,JSON.stringify(feedback,null,2)+'\n');
console.log('Generated '+output+'; '+feedback.comments.length+' comments preserved.');
