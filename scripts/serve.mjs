#!/usr/bin/env node
/* Local static server that behaves like the hosts: /_blob/<hash> -> /assets/<hash>.<ext>, /studio -> the studio, unknown URLs -> 404.html.
 *   node scripts/serve.mjs            # http://127.0.0.1:8792  (ROOT=public, PORT=8792)
 * Used by scripts/mobile-audit.mjs and scripts/rules-audit.mjs. (python -m http.server cannot do the /_blob rewrites, so book photos show as broken there.) */
import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT=process.env.ROOT||path.join(path.dirname(fileURLToPath(import.meta.url)),'..','public'); const T={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.ico':'image/x-icon','.txt':'text/plain','.webp':'image/webp'};
http.createServer((req,res)=>{ let u=decodeURIComponent(req.url.split('?')[0]); if(u==='/')u='/G1-Home.dc.html'; if(u==='/studio')u='/G30-Studio.dc.html';
 let m=u.match(/^\/_blob\/([0-9a-f]{32})$/); if(m){ for(const e of ['webp','jpg','png','svg']){ const f=path.join(ROOT,'assets',m[1]+'.'+e); if(fs.existsSync(f)){u='/assets/'+m[1]+'.'+e;break;} } }
 let f=path.join(ROOT,u); if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){ res.statusCode=404; res.setHeader('content-type','text/html'); try{res.end(fs.readFileSync(path.join(ROOT,'404.html')));}catch(e){res.end('404');} return; }
 res.setHeader('content-type',T[path.extname(f)]||'application/octet-stream'); res.setHeader('cache-control','no-store'); fs.createReadStream(f).pipe(res); }).listen(+process.env.PORT||8792,'127.0.0.1');
console.log('serving '+ROOT+' on http://127.0.0.1:'+(+process.env.PORT||8792));
