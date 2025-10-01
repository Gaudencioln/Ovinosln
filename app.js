import { DB } from './db.js';
import { renderLista } from './animais.js';
import { kpis, relatorioGeral, relatorioPorAnimal, graficoLinha } from './relatorios.js';
import { buildAncestorsTree, renderTree } from './genealogia.js';
import * as Backup from './backup.js';

// Navegação
const views = {home:$('#view-home'),dashboard:$('#view-dashboard'),rebanho:$('#view-rebanho'),genealogia:$('#view-genealogia'),relatorios:$('#view-relatorios'),config:$('#view-config')};
function $(sel){ return document.querySelector(sel); }
function show(id){ Object.values(views).forEach(v=>v.classList.add('hidden')); views[id]?.classList.remove('hidden'); }
document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>show(b.dataset.nav));
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>show('home'));
$('#btn-atalho-novo').onclick = ()=> $('#btn-novo').click();

// SW
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));

// Rebanho
let mostrarInativos=false, filtroClass='', editId=null;
const busca = $('#busca');
async function refreshLista(){ await renderLista({q:busca?.value||'', mostrarInativos, filtroClass}); bindCardActions(); }
$('#btn-toggle-inativos').onclick = async (e)=>{ mostrarInativos=!mostrarInativos; e.target.textContent='Mostrar Inativos: ' + (mostrarInativos?'Sim':'Não'); await refreshLista(); };
document.querySelectorAll('.chip').forEach(c=>c.onclick=async()=>{ const cls=c.dataset.cls; filtroClass=(cls==='limpar')?'':cls; await refreshLista(); });
if(busca) busca.addEventListener('input', refreshLista);

function bindCardActions(){
  document.querySelectorAll('.btn-edit').forEach(b=>b.onclick=async()=>{ editId=Number(b.dataset.id); const a=await DB.get(editId); openForm(a); });
  document.querySelectorAll('.btn-gene').forEach(b=>b.onclick=async()=>{ $('#gene-id').value=b.dataset.id; show('genealogia'); await abrirArvore(Number(b.dataset.id)); });
  document.querySelectorAll('.btn-rel').forEach(b=>b.onclick=async()=>{ show('relatorios'); await abrirRelAnimal(Number(b.dataset.id)); });
}

// Modal / Form
const modal=$('#modal');
function resetForm(){ ['f-nome','f-brinco','f-nascimento','f-pai','f-mae'].forEach(id=>$('#'+id).value=''); ['f-sexo','f-classificacao'].forEach(id=>$('#'+id).value=''); $('#f-status').value='ativo'; $('#f-motivo').value=''; $('#f-motivo').classList.add('hidden'); }
function openForm(a){ resetForm(); if(a){ editId=a.id; $('#modal-title').textContent='Editar animal #'+a.id; $('#f-nome').value=a.nome||''; $('#f-brinco').value=a.brinco||''; $('#f-sexo').value=a.sexo||''; $('#f-nascimento').value=a.nascimento||''; $('#f-pai').value=a.paiId||''; $('#f-mae').value=a.maeId||''; $('#f-classificacao').value=a.classificacao||''; $('#f-status').value=a.status||'ativo'; if(a.status==='inativo') $('#f-motivo').classList.remove('hidden'); $('#f-motivo').value=a.motivo||''; $('#modal').showModal(); } else { editId=null; $('#modal-title').textContent='Novo Animal'; modal.showModal(); } }
$('#btn-novo').onclick=()=>openForm(null);
$('#f-status').addEventListener('change', e=>$('#f-motivo').classList.toggle('hidden', e.target.value!=='inativo'));
$('#btn-salvar').onclick = async ev=>{ ev.preventDefault(); const a={ id:editId||undefined, nome:$('#f-nome').value.trim(), brinco:$('#f-brinco').value.trim(), sexo:$('#f-sexo').value||undefined, nascimento:$('#f-nascimento').value||undefined, paiId:Number($('#f-pai').value)||undefined, maeId:Number($('#f-mae').value)||undefined, classificacao:$('#f-classificacao').value||undefined, status:$('#f-status').value||'ativo', motivo:$('#f-motivo').classList.contains('hidden')?undefined:($('#f-motivo').value||undefined)}; if(editId) await DB.put(a); else { delete a.id; await DB.add(a);} modal.close(); await refreshLista(); };

// Relatórios
async function abrirRelGeral(){ const r=await relatorioGeral(); $('#rel-box').classList.remove('hidden'); $('#rel-titulo').textContent='Relatório Geral'; $('#rel-conteudo').innerHTML=`Total: <b>${r.total}</b> • Ativos: <b>${r.ativos}</b> • Inativos: <b>${r.inativos}</b><div class='text-sm text-stone-600 mt-1'>Inativos → Abate: <b>${r.porMotivo.abate}</b> • Venda: <b>${r.porMotivo.venda}</b> • Doença/Morte: <b>${r.porMotivo.doenca_morte}</b></div><div id='chart-rel' class='h-64 mt-3'></div>`; graficoLinha('chart-rel',[r.ativos,r.inativos]); }
async function abrirRelAnimal(id){ $('#rel-box').classList.remove('hidden'); $('#rel-titulo').textContent='Relatório por Animal'; const a=await relatorioPorAnimal(id); $('#rel-conteudo').innerHTML = a? `<div><b>${a.nome||'Sem nome'}</b> #${a.id}</div><div>${a.brinco||''} ${a.sexo||''} ${a.nascimento||''}</div><div>Classificação: <b>${a.classificacao||'-'}</b></div><div>Status: <b>${a.status||'ativo'}</b> ${a.motivo?'• '+a.motivo:''}</div><div>Pai: ${a.paiId||'-'} • Mãe: ${a.maeId||'-'}</div>`:'Animal não encontrado.'; }
$('#btn-rel-geral').onclick=abrirRelGeral; $('#btn-rel-animal').onclick=async()=>{ const id=Number(prompt('Informe o ID do animal:')); if(id) await abrirRelAnimal(id); };
$('#btn-exportar-rel-img').onclick=async()=>{ const box=$('#rel-box'); const blob=await window.domtoimage.toBlob(box); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='relatorio.png'; a.click(); URL.revokeObjectURL(url); };

// Genealogia
async function abrirArvore(id){ const data=await buildAncestorsTree(id); if(!data){ alert('Animal não encontrado'); return; } await renderTree('arvore', data); }
$('#btn-ver-arvore').onclick=async()=>{ const id=Number($('#gene-id').value); if(id) await abrirArvore(id); };
$('#btn-exportar-img').onclick=async()=>{ const el=document.getElementById('gene-container'); const blob=await window.domtoimage.toBlob(el); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='genealogia.png'; a.click(); URL.revokeObjectURL(url); };

// Config - backup
$('#btn-exportar').onclick=Backup.exportar;
$('#input-importar').addEventListener('change', async e=>{ const f=e.target.files?.[0]; if(!f) return; await Backup.importar(f); await loadAll(); alert('Importado com sucesso.'); });

// Dashboard
async function renderDashboard(){ const s=await kpis(); $('#kpi-total').textContent=s.total; $('#kpi-matrizes').textContent=s.matrizes; $('#kpi-reprodutores').textContent=s.reprodutores; $('#kpi-inativos').textContent=s.inativos; document.getElementById('chart-evolucao').innerHTML=''; graficoLinha('chart-evolucao',[3,5,6,4,9,10,12]); }

// Init
async function loadAll(){ await DB.open(); await DB.seed(); await renderDashboard(); await refreshLista(); }
loadAll();