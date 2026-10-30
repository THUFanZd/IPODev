import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import {args,writeAtomic} from './lib.mjs';
import {validateStory,readBlock,validateFeedback,embedFeedback,ensureUnchanged,htmlFilename} from './running-lib.mjs';
const options=args(process.argv.slice(2));if(!options.project)throw Error('Usage: node serve-running.mjs --project <directory> --port <port> [--output <filename.html>]');
const root=path.resolve(options.project),port=Number(options.port||4341);
const output=htmlFilename(options.output),pagePath='/'+encodeURIComponent(output);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');
const files=['story.json',output,'feedback.json'].map(f=>path.join(root,f));
let snapshot=files.map(p=>[p,fs.readFileSync(p,'utf8')]),html=snapshot[1][1];
const story=validateStory(JSON.parse(snapshot[0][1]));
if(JSON.stringify(readBlock(html,'running-story'))!==JSON.stringify(story))throw Error('Build page before starting the server');
let feedback=validateFeedback(JSON.parse(snapshot[2][1]),story);
if(JSON.stringify(readBlock(html,'running-feedback'))!==JSON.stringify(feedback))throw Error('Feedback differs from HTML; rebuild first');
const origin='http://127.0.0.1:'+port,token=crypto.randomBytes(32).toString('hex');let saving=false;
http.createServer(async(req,res)=>{
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 if(req.headers.host!=='127.0.0.1:'+port||(req.headers.origin&&req.headers.origin!==origin))return send(403,{error:'请通过本机页面访问'});
 try{
  if(req.method==='GET'&&['/',pagePath].includes(req.url)){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src data:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"});return res.end(html);}
  if(req.method==='GET'&&req.url==='/api/state')return send(200,{token,feedback,projectId:story.id,projectRevision:story.revision});
  if(req.method==='PUT'&&req.url==='/api/feedback'){
   if(req.headers['x-running-token']!==token||!req.headers['content-type']?.startsWith('application/json'))return send(403,{error:'保存请求无效'});
   if(saving)return send(409,{error:'正在保存，请稍后重试'});saving=true;
   try{
    const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1024*1024)return send(413,{error:'批注过长'});chunks.push(chunk);}
    ensureUnchanged(snapshot);
    const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if(data.baseVersion!==feedback.version)return send(409,{error:'其他窗口已修改批注，请先导出 HTML 再刷新核对'});
    const next=validateFeedback(data.feedback,story,feedback);next.version=feedback.version+1;
    const updated=embedFeedback(html,next);
    writeAtomic(files[2],JSON.stringify(next,null,2)+'\n');writeAtomic(files[1],updated);
    html=updated;feedback=next;snapshot=files.map(p=>[p,fs.readFileSync(p,'utf8')]);
    return send(200,{version:next.version});
   }finally{saving=false;}
  }
  if(req.url==='/favicon.ico'){res.writeHead(204);return res.end();}
  send(404,{error:'Not found'});
 }catch(error){send(409,{error:error.message});}
}).listen(port,'127.0.0.1',()=>console.log('Running example: '+origin+pagePath+'\n'+root+'\nComments save to '+output+' and feedback.json. Ctrl+C to stop.'));
