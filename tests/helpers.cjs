const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
function boot(seed={}){const values=new Map(Object.entries(seed));const storage={fail:false,getItem:k=>values.get(k)||null,setItem(k,v){if(this.fail)throw Error('quota');values.set(k,String(v))},removeItem:k=>values.delete(k)};const c={console,Date,Math,Set,Map,JSON,Number,String,Object,Array,Boolean,Error,localStorage:storage};c.window=c;c.TG={};vm.createContext(c);for(const file of ['data.js','store.js','game.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',file),'utf8'),c,{filename:file});return {c,TG:c.TG,S:c.TG.store,G:c.TG.engine,storage,values};}
module.exports={boot,ROOT};
