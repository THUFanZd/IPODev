import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),port=Number(process.argv[2]||4340);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');
const files=new Set(['index.html','standalone.html','app.js','example.js','vendor/gsap.min.js']);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8'};
http.createServer((req,res)=>{
 if(req.headers.host!==`127.0.0.1:${port}`){res.writeHead(403);res.end();return;}
 const target=req.url==='/'?'index.html':req.url?.slice(1);
 if(req.method!=='GET'||!files.has(target)){res.writeHead(req.url==='/favicon.ico'?204:404);res.end();return;}
 res.writeHead(200,{'Content-Type':types[path.extname(target)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"});
 res.end(fs.readFileSync(path.join(root,target)));
}).listen(port,'127.0.0.1',()=>console.log(`Running example: http://127.0.0.1:${port}\n${root}`));
