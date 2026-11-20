'use strict';
// One release, one version: the app constant, package, script cache-busters and the
// service-worker cache key must all move together, or installed PWAs keep stale code.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
test('app, package, script query strings and service-worker cache share one version',()=>{
 const version=read('js/data.js').match(/TG\.VERSION\s*=\s*'([^']+)'/)?.[1];
 assert(version,'TG.VERSION is declared');
 assert.equal(JSON.parse(read('package.json')).version,version);
 const compact=version.replace(/\./g,'');               // 0.27.0-arcs1 → 0270-arcs1
 assert.match(read('sw.js'),new RegExp("CACHE\\s*=\\s*'terminus-v"+compact+"'"));
 const html=read('index.html'),tags=[...html.matchAll(/src="js\/[a-z]+\.js\?v=([a-z0-9]+)"/g)].map(m=>m[1]);
 assert(tags.length>=9,'every script carries a cache-buster');
 assert(tags.every(tag=>tag===compact.replace('-','')),'all script cache-busters match '+compact.replace('-',''));
});
