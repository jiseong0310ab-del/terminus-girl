'use strict';
const CACHE='terminus-v0100-rc1';
const ROOT=new URL('./',self.location.href);
const FILES=['index.html','style.css','manifest.webmanifest','js/data.js','js/store.js','js/audio.js','js/game.js','js/render.js','js/input.js','js/ui.js','assets/rize-sd-v03.webp','assets/rize-walk-v09.webp','assets/enemies-v09.webp','assets/station-props-v010.webp','assets/platform-stone-v03.webp','assets/terminus-night-v03.webp','assets/icon-192.png','assets/icon-512.png','assets/icon-maskable-512.png'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 try{const cache=await caches.open(CACHE);const bundle=await Promise.all(FILES.map(async f=>{const canonical=new URL(f,ROOT).href,url=new URL(canonical);url.searchParams.set('build',CACHE);const response=await fetch(new Request(url.href,{cache:'reload',credentials:'same-origin'}));if(!response.ok)throw Error('Incomplete offline build');return [canonical,response]}));await Promise.all(bundle.map(([key,response])=>cache.put(key,response)));}catch(error){await caches.delete(CACHE);throw error;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('terminus-')&&name!==CACHE)await caches.delete(name);await self.clients.claim()})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;let key=url.href;if(url.pathname===ROOT.pathname||url.pathname===new URL('index.html',ROOT).pathname)key=new URL('index.html',ROOT).href;else{url.search='';key=url.href;}event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(key);if(cached)return cached;return fetch(event.request)})())});
