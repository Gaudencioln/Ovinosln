import { DB } from './db.js';

export async function kpis(){
  const ls = await DB.list();
  return {
    total: ls.length,
    matrizes: ls.filter(a=>a.sexo==='F' && a.status!=='inativo').length,
    reprodutores: ls.filter(a=>a.sexo==='M' && a.status!=='inativo').length,
    inativos: ls.filter(a=>a.status==='inativo').length,
  };
}

export async function relatorioGeral(){
  const ls = await DB.list();
  const ativos = ls.filter(a=>a.status!=='inativo').length;
  const inativos = ls.filter(a=>a.status==='inativo').length;
  const porMotivo = {
    abate: ls.filter(a=>a.motivo==='abate').length,
    venda: ls.filter(a=>a.motivo==='venda').length,
    doenca_morte: ls.filter(a=>a.motivo==='doenca_morte').length
  };
  return { total: ls.length, ativos, inativos, porMotivo };
}

export async function relatorioPorAnimal(id){
  return await DB.get(id);
}

export function graficoLinha(id,series){
  const el=document.getElementById(id); el.innerHTML='';
  const w=el.clientWidth||600,h=240;
  const svg=d3.select(el).append('svg').attr('width',w).attr('height',h);
  const m={t:10,r:10,b:30,l:30}, iw=w-m.l-m.r, ih=h-m.t-m.b;
  const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const x=d3.scaleLinear().domain([0,series.length-1]).range([0,iw]);
  const y=d3.scaleLinear().domain([0,Math.max(...series,1)]).range([ih,0]);
  const line=d3.line().x((d,i)=>x(i)).y(d=>y(d));
  g.append('path').attr('d',line(series)).attr('fill','none').attr('stroke','#1f2937').attr('stroke-width',2);
  g.append('g').attr('transform',`translate(0,${ih})`).call(d3.axisBottom(x).ticks(series.length).tickFormat(i=>String(i+1)));
  g.append('g').call(d3.axisLeft(y).ticks(5));
}