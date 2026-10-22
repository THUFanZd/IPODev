import fs from 'node:fs';
import http from 'node:http';
import crypto from 'node:crypto';
import {args,readJson,writeAtomic,projectPaths,validateModel,validateFeedback,embedFeedback} from './lib.mjs';
const options=args(process.argv.slice(2));if(!options.project)throw Error('Usage: node serve.mjs --project <directory> --port 4317');
const port=Number(options.port||4317);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');
const p=projectPaths(options.project),model=validateModel(readJson(p.model));
let html=fs.readFileSync(p.html,'utf8');
const embedded=JSON.parse(html.match(/<script id="ipo-model" type="application\/json">([\s\S]*?)<\/script>/)[1]);
if(JSON.stringify(embedded)!==JSON.stringify(model))throw Error('Run render.mjs before starting.');
const token=crypto.randomBytes(32).toString('hex'),origin=`http://127.0.0.1:${port}`;let saving=false;
const server=http.createServer(async(req,res)=>{
 const send=(status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj));};
 if(req.headers.host!==`127.0.0.1:${port}`||(req.headers.origin&&req.headers.origin!==origin))return send(403,{error:'请通过本机页面访问'});
 try{
  if(req.method==='GET'&&(req.url==='/'||req.url==='/index.html')){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src data:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"});return res.end(html);}
  if(req.method==='GET'&&req.url==='/api/state')return send(200,{token,projectId:model.id,projectRevision:model.revision,feedback:readJson(p.feedback)});
  if(req.method==='PUT'&&req.url==='/api/feedback'){
   if(req.headers['x-ipo-token']!==token||!req.headers['content-type']?.startsWith('application/json'))return send(403,{error:'保存请求无效'});
   if(saving)return send(409,{error:'正在保存另一条备注，请重试'});saving=true;
   try{
    const chunks=[];let size=0;for await(const chunk of req){chunks.push(chunk);size+=chunk.length;if(size>1024*1024)return send(413,{error:'备注过长'});}
    const request=JSON.parse(Buffer.concat(chunks).toString('utf8')),previous=readJson(p.feedback);
    if(request.baseVersion!==previous.version)return send(409,{error:'其他窗口已更新备注。先保存 HTML 副本，再刷新核对。'});
    if(JSON.stringify(readJson(p.model))!==JSON.stringify(model))return send(409,{error:'页面描述已修改，请重新生成并启动服务'});
    const feedback=validateFeedback(request.feedback,model,previous);feedback.version=previous.version+1;
    const updatedHtml=embedFeedback(html,feedback);
    writeAtomic(p.feedback,JSON.stringify(feedback,null,2)+'\n');writeAtomic(p.html,updatedHtml);html=updatedHtml;
    return send(200,{version:feedback.version});
   }finally{saving=false;}
  }
  if(req.url==='/favicon.ico'){res.writeHead(204);return res.end();}
  send(404,{error:'Not found'});
 }catch(error){send(400,{error:error.message});}
});
server.listen(port,'127.0.0.1',()=>console.log(`IPODev: ${origin}\n${p.root}\nNotes are saved in index.html and feedback.json. Ctrl+C to stop.`));
