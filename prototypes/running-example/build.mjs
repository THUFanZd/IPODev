import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const file of ['vendor/gsap.min.js','example.js','app.js']){
  const script=fs.readFileSync(path.join(root,file),'utf8').replace(/<\/script/gi,'<\\/script');
  html=html.replace(`<script src="./${file}"></script>`,()=>`<script>\n${script}\n</script>`);
}
fs.writeFileSync(path.join(root,'standalone.html'),html,'utf8');
console.log('Built '+path.join(root,'standalone.html'));
