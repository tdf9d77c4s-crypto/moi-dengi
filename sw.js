/* Living 3D v2.5: network-first, offline fallback. Never touches private data. */
const CACHE='moi-dengi-pwa-v250-20261031-1';
const ASSETS=['./','./index.html','./styles.css','./app.js','./mascot3d.js','./version.json','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const INDEX=new URL('./index.html',self.registration.scope).href;
const SCOPE=new URL(self.registration.scope);
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  await Promise.all(ASSETS.map(async file=>{
   const uri=new URL(file,self.registration.scope).href;
   const response=await fetch(uri,{cache:'reload'});
   if(!response.ok)throw Error('Не получен '+file+': '+response.status);
   await c.put(uri,response);
  }));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(x=>x.startsWith('moi-dengi-pwa-')&&x!==CACHE).map(x=>caches.delete(x)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(request,{cache:'no-store'});
   if(response.ok&&response.type!=='opaque'){
    const key=request.mode==='navigate'?INDEX:request;
    await cache.put(key,response.clone());
   }
   return response;
  }catch(err){
   if(request.mode==='navigate'){
    const offline=await cache.match(INDEX);if(offline)return offline;
   }
   const offline=await cache.match(request,{ignoreSearch:true});
   return offline||Response.error();
  }
 })());
});
