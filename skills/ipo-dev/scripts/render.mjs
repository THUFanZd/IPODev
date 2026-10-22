import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {args,readJson,writeAtomic,projectPaths,validateModel,emptyFeedback,renderDocument} from './lib.mjs';
const options=args(process.argv.slice(2));if(!options.project)throw Error('Usage: node render.mjs --project <directory>');
const p=projectPaths(options.project),model=validateModel(readJson(p.model));
const feedback=fs.existsSync(p.feedback)?readJson(p.feedback):emptyFeedback(model);
if(feedback.projectId!==model.id)throw Error('Feedback belongs to a different project');
if(feedback.projectRevision!==model.revision){feedback.projectRevision=model.revision;feedback.version++;}
const template=fs.readFileSync(fileURLToPath(new URL('../assets/review.html',import.meta.url)),'utf8');
const html=renderDocument(template,model,feedback);
writeAtomic(p.html,html);writeAtomic(p.feedback,JSON.stringify(feedback,null,2)+'\n');
console.log(`Generated ${p.html}; ${feedback.comments.length} notes preserved.`);
