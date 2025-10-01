import { DB } from './db.js';

export function badgeClass(c){ if(c==='descartar') return 'badge badge-red'; if(c==='avaliacao') return 'badge badge-yellow'; if(c==='produtora') return 'badge badge-green'; if(c==='excelente') return 'badge badge-blue'; return 'badge badge-gray'; }

export async function renderLista({q='', mostrarInativos=false, filtroClass=''}){
  const lista = document.getElementById('lista');
  let dados = await DB.search(q);
  if(!mostrarInativos) dados = dados.filter(a=>a.status!=='inativo');
  if(filtroClass) dados = dados.filter(a=>a.classificacao===filtroClass);
  lista.innerHTML = '';
  for(const a of dados){
    const div = document.createElement('div'); div.className='card';
    const st = a.status==='inativo' ? `<span class="badge badge-gray ml-2">Inativo${a.motivo?' · '+a.motivo:''}</span>`: '';
    div.innerHTML = `<div class="flex items-center justify-between">
      <div><div class="font-semibold">${a.nome||'Sem nome'} <span class="text-stone-400">#${a.id}</span></div>
      <div class="text-sm text-stone-500">${a.brinco||''} ${a.sexo?'• '+a.sexo:''} ${a.nascimento||''}</div>
      <div class="mt-1"><span class="${badgeClass(a.classificacao)}">${a.classificacao||'—'}</span>${st}</div></div>
      <div class="flex gap-2">
        <button class="btn-outline btn-rel" data-id="${a.id}">Relatório</button>
        <button class="btn-outline btn-gene" data-id="${a.id}">Genealogia</button>
        <button class="btn-outline btn-edit" data-id="${a.id}">Editar</button>
      </div></div>`;
    lista.appendChild(div);
  }
}