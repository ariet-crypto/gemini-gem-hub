const http=require("http"),fs=require("fs"),path=require("path");
const PORT=process.env.PORT||3000,KEY=process.env.GEMINI_API_KEY,ROOT=path.join(__dirname,"public");
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".webmanifest":"application/manifest+json"};
http.createServer((req,res)=>{
 if(req.method==="POST"&&req.url==="/api/chat"){
  if(!KEY){res.writeHead(503,{"Content-Type":"application/json"});return res.end(JSON.stringify({error:"Сервер не настроен: добавь GEMINI_API_KEY в секреты хостинга."}))}
  let raw="";req.on("data",c=>{raw+=c;if(raw.length>100000)req.destroy()});req.on("end",async()=>{try{
   const b=JSON.parse(raw||"{}");if(typeof b.message!=="string"||!b.message.trim())throw Error("Пустое сообщение");
   const payload={model:"gemini-3.8-flash",input:b.message.trim()};
   if(b.systemInstruction)payload.system_instruction=b.systemInstruction;
   if(b.previousInteractionId)payload.previous_interaction_id=b.previousInteractionId;
   const api=await fetch("https://generativelanguage.googleapis.com/v1beta/interactions",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":KEY},body:JSON.stringify(payload)});
   const d=await api.json();if(!api.ok)throw Error(d.error?.message||"Gemini API error "+api.status);
   res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});res.end(JSON.stringify({text:d.output_text||"",interactionId:d.id||null}));
  }catch(e){res.writeHead(400,{"Content-Type":"application/json"});res.end(JSON.stringify({error:e.message||"Request failed"}))}});return;
 }
 let p=decodeURIComponent(new URL(req.url,"http://localhost").pathname);if(p==="/")p="/index.html";let f=path.join(ROOT,p.replace(/^\/+/,""));if(!f.startsWith(ROOT)){res.writeHead(403);return res.end("Forbidden")}
 fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end("Not found")}res.writeHead(200,{"Content-Type":mime[path.extname(f)]||"application/octet-stream"});res.end(d)});
}).listen(PORT,()=>console.log("Gem Hub on "+PORT));