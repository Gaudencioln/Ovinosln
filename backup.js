import { DB } from './db.js';
export async function exportar(){
  const data = await DB.list();
  const blob = new Blob([JSON.stringify({version:1, animais:data}, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='backup-ovinosln.json'; a.click();
  URL.revokeObjectURL(url);
}
export async function importar(file){
  const text = await file.text(); const json = JSON.parse(text);
  // regrava itens (simplificado)
  for(const a of json.animais||[]){ await DB.put(a.id ? a : {...a}); }
}