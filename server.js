const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const DATA = path.join(__dirname, 'keys.json');
const SHORTENER = 'https://snet.blog/velqerix';
const THREE_HOURS = 3 * 60 * 60 * 1000;
const SESSION_TIME = 20 * 60 * 1000;

function load(){ try { return JSON.parse(fs.readFileSync(DATA,'utf8')); } catch { return {sessions:{}, keys:{}}; } }
function save(db){ fs.writeFileSync(DATA, JSON.stringify(db,null,2)); }
function send(res, code, obj, headers={}){ res.writeHead(code, {'Content-Type':'application/json; charset=utf-8', ...headers}); res.end(JSON.stringify(obj)); }
function cookie(req,name){ const raw=req.headers.cookie||''; const m=raw.match(new RegExp('(?:^|; )'+name.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'=([^;]+)')); return m ? decodeURIComponent(m[1]) : null; }
function key(){ return 'VQ-'+crypto.randomBytes(4).toString('hex').toUpperCase().slice(0,6); }
function token(){ return crypto.randomBytes(24).toString('hex'); }

const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(req.method==='GET' && u.pathname==='/'){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
    return res.end(fs.readFileSync(path.join(__dirname,'public','index.html')));
  }

  // Start: create a private browser session, then send the user to SuaUrl.
  if(req.method==='GET' && u.pathname==='/api/start'){
    const t=token(); const db=load();
    db.sessions[t]={created:Date.now(), claimed:false}; save(db);
    const destination = u.searchParams.get('test') === '1' ? '/claim' : SHORTENER;
    res.writeHead(302,{
      'Location':destination,
      'Set-Cookie':`vq_session=${encodeURIComponent(t)}; Max-Age=1200; Path=/; HttpOnly; SameSite=Lax`
    });
    return res.end();
  }

  // SuaUrl should return here after the journey. The session cookie identifies this visitor.
  if(req.method==='GET' && u.pathname==='/claim'){
    const t=cookie(req,'vq_session'); const db=load(); const s=t&&db.sessions[t];
    if(!s || Date.now()-s.created>SESSION_TIME){
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
      return res.end('<!doctype html><meta charset="utf-8"><title>VELQERIX</title><body style="background:#000;color:#fff;font-family:Arial;text-align:center;padding:60px"><h2>Link expirado</h2><p>Volte ao VELQERIX e clique em PEGAR KEY GRÁTIS novamente.</p></body>');
    }
    if(!s.claimed){
      let k; do{k=key();}while(db.keys[k]);
      db.keys[k]={created:Date.now(),expires:Date.now()+THREE_HOURS,revoked:false};
      s.claimed=true; s.key=k; save(db);
    }
    const k=s.key;
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
    return res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sua KEY VELQERIX</title><style>body{margin:0;background:#000;color:#fff;font-family:Arial;text-align:center;padding:45px 18px}.box{max-width:520px;margin:auto;background:#0b1020;border:1px solid #293147;border-radius:24px;padding:28px}.key{font-size:30px;font-weight:900;letter-spacing:2px;margin:25px 0;color:#15e6c8}.btn{display:inline-block;padding:15px 22px;border-radius:14px;background:#14d9bd;color:#001;font-weight:900;text-decoration:none}</style><div class="box"><h1>🎁 KEY LIBERADA</h1><p>Sua chave é válida por <b>3 horas</b>.</p><div class="key">${k}</div><p>Copie a chave e volte ao VELQERIX PROXY para ativá-la.</p><a class="btn" href="/">VOLTAR AO PROXY</a></div>`);
  }

  if(req.method==='POST' && u.pathname==='/api/license'){
    let body=''; req.on('data',c=>body+=c); req.on('end',()=>{
      let d={}; try{d=JSON.parse(body)}catch{}
      const k=String(d.key||'').trim().toUpperCase(); const db=load(); const item=db.keys[k];
      if(!/^VQ-[A-Z0-9]{6}$/.test(k) || !item) return send(res,200,{ok:false,message:'❌ Chave inválida.'});
      if(item.revoked) return send(res,200,{ok:false,message:'❌ Chave revogada.'});
      if(Date.now()>item.expires) return send(res,200,{ok:false,message:'⏰ Essa chave expirou.'});
      return send(res,200,{ok:true,expiresAt:item.expires,message:'✅ Licença ativada! Acesso liberado por mais '+Math.ceil((item.expires-Date.now())/60000)+' min.'});
    }); return;
  }

  res.writeHead(404); res.end('Not found');
});
server.listen(PORT,'0.0.0.0',()=>console.log(`VELQERIX em http://0.0.0.0:${PORT}`));
