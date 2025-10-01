export const DB = (()=>{
  const DB_NAME='ovinosln-db', STORE='animais'; let idb;
  function open(){ return new Promise((res,rej)=>{ const req=indexedDB.open(DB_NAME,1); req.onupgradeneeded=()=>{ idb=req.result; if(!idb.objectStoreNames.contains(STORE)){ const st=idb.createObjectStore(STORE,{keyPath:'id',autoIncrement:true}); st.createIndex('nome','nome',{unique:false}); }}; req.onsuccess=()=>{ idb=req.result; res(); }; req.onerror=()=>rej(req.error); }); }
  function st(mode='readonly'){ return idb.transaction(STORE,mode).objectStore(STORE); }
  async function ensure(){ if(!idb) await open(); }
  async function add(a){ await ensure(); return new Promise((res,rej)=>{ const r=st('readwrite').add(a); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); }
  async function put(a){ await ensure(); return new Promise((res,rej)=>{ const r=st('readwrite').put(a); r.onsuccess=()=>res(true); r.onerror=()=>rej(r.error); }); }
  async function get(id){ await ensure(); return new Promise((res,rej)=>{ const r=st().get(Number(id)); r.onsuccess=()=>res(r.result||null); r.onerror=()=>rej(r.error); }); }
  async function list(){ await ensure(); return new Promise((res,rej)=>{ const out=[]; const c=st().openCursor(); c.onsuccess=e=>{ const cur=e.target.result; if(cur){ out.push(cur.value); cur.continue(); } else res(out); }; c.onerror=()=>rej(c.error); }); }
  async function search(q=''){ const all=await list(); const s=(q||'').toLowerCase(); if(!s) return all; return all.filter(a=> (a.nome||'').toLowerCase().includes(s) || String(a.brinco||'').toLowerCase().includes(s)); }
  async function seed(){ return; } // Sem registros automáticos
  return { open, add, put, get, list, search, seed };
})();