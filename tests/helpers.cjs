const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
function boot(seed={},shared){const values=shared||new Map(Object.entries(seed));const storage={fail:false,getItem:k=>values.get(k)||null,setItem(k,v){if(this.fail)throw Error('quota');values.set(k,String(v))},removeItem:k=>values.delete(k)};const c={console,Date,Math,Set,Map,JSON,Number,String,Object,Array,Boolean,Error,localStorage:storage};const listeners={};c.addEventListener=(type,fn)=>(listeners[type]??=[]).push(fn);c.window=c;c.TG={};vm.createContext(c);for(const file of ['data.js','commands.js','story.js','store.js','game.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',file),'utf8'),c,{filename:file});return {c,TG:c.TG,S:c.TG.store,G:c.TG.engine,storage,values,fireStorage:e=>(listeners.storage||[]).forEach(fn=>fn(e))};}
// Test shortcut: treat a story mission's guardian prerequisite as already resolved.
// The opening mission spawns its guardian later through a script, so drop the script
// (no further packs) and record a resolved stand-in guardian.
function unlockStoryGate(g){const gate=g.storyGate;if(!gate)return;if(gate.kind!=='archive'&&!gate.guardIds.length)gate.guardIds.push(-1);g.script=null;gate.defeated=[...gate.guardIds];}
// Test shortcut: a dormant archive sweep, for checks about the retrieval flow rather than the beams.
const dormantSweep=()=>({angle:0,reach:0,warmup:Infinity,hits:0});
// Test shortcut: an objective mission whose swarm was already cleared (objective unlocked, no escorts).
function openObjective(g){if(g?.script){g.script.phase='objective';g.script.pending=[];g.script.escortClock=-1e9;}return g;}
// Test shortcut: a dormant snow bell, for checks about relay flow rather than the strikes.
const dormantBell=()=>({x:0,y:0,clock:Infinity,warning:0,diagonal:false,hits:0,dodged:0});
module.exports={boot,ROOT,unlockStoryGate,dormantSweep,openObjective,dormantBell};
