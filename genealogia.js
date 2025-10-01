import { DB } from './db.js';

async function fetchAnimal(id){ if(!id) return null; return await DB.get(id); }

export async function buildAncestorsTree(id){
  const self = await fetchAnimal(id);
  if(!self) return null;
  async function node(a,labelIfMissing){
    if(!a) return {name:labelIfMissing||'—'};
    return {name:`${a.nome||'Sem nome'} (#${a.id}${a.brinco? ' · '+a.brinco:''})`, id:a.id};
  }
  const pai = await fetchAnimal(self.paiId);
  const mae = await fetchAnimal(self.maeId);

  async function parentsOf(a,prefix){
    if(!a) return [await node(null,`${prefix} —`), await node(null,`${prefix} —`)];
    const avop = await fetchAnimal(a.paiId);
    const avom = await fetchAnimal(a.maeId);
    return [await node(avop,`Avô ${prefix}`), await node(avom,`Avó ${prefix}`)];
  }
  async function greatOf(avop,avom,prefix){
    async function gp(a,lab){ return await node(a,lab); }
    const p1 = avop? await fetchAnimal(avop.paiId): null;
    const m1 = avop? await fetchAnimal(avop.maeId): null;
    const p2 = avom? await fetchAnimal(avom.paiId): null;
    const m2 = avom? await fetchAnimal(avom.maeId): null;
    return [await gp(p1,`Bisavô ${prefix}1`), await gp(m1,`Bisavó ${prefix}1`), await gp(p2,`Bisavô ${prefix}2`), await gp(m2,`Bisavó ${prefix}2`)];
  }

  const [avop, avom] = await parentsOf(pai,'P');
  const [avomp, avomm] = await parentsOf(mae,'M');

  // build structure
  const tree = { name: `${self.nome||'Sem nome'} (#${self.id}${self.brinco? ' · '+self.brinco:''})`, id:self.id,
    children: [
      { name: 'Pai', id:pai?.id, children: [
          avop, avom
        ]
      },
      { name: 'Mãe', id:mae?.id, children: [
          avomp, avomm
        ]
      }
    ]
  };

  // attach great-grandparents as children of each grandparent
  async function attachGreat(grandNode, prefix){
    const a = await fetchAnimal(grandNode.id);
    const g = await greatOf(a?.id? await fetchAnimal(a.id) : null, null, prefix); // placeholder, will compute below
  }

  // Enriquecemos avós com bisavós (buscando dados reais)
  async function enrichGrand(grand, labelPrefix){
    const a = await fetchAnimal(grand.id);
    const p = a? await fetchAnimal(a.paiId): null;
    const m = a? await fetchAnimal(a.maeId): null;
    grand.children = [
      await node(p,`Bisavô ${labelPrefix}`),
      await node(m,`Bisavó ${labelPrefix}`)
    ];
  }
  await enrichGrand(tree.children[0].children[0],'P1');
  await enrichGrand(tree.children[0].children[1],'P2');
  await enrichGrand(tree.children[1].children[0],'M1');
  await enrichGrand(tree.children[1].children[1],'M2');

  return tree;
}

export async function renderTree(containerId, data){
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  const w = el.clientWidth || 1000, h = el.clientHeight || 540;
  const svg = d3.select(el).append('svg').attr('width', w).attr('height', h);
  const g = svg.append('g').attr('transform','translate(40,40)');
  const root = d3.hierarchy(data);
  const treeLayout = d3.tree().size([h-80, w-160]);
  treeLayout(root);

  g.selectAll('.link').data(root.links()).enter().append('path')
    .attr('fill','none').attr('stroke','#CBD5E1').attr('stroke-width',2)
    .attr('d', d3.linkHorizontal().x(d=>d.y).y(d=>d.x));

  const node = g.selectAll('.node').data(root.descendants()).enter().append('g')
    .attr('transform', d=>`translate(${d.y},${d.x})`);
  node.append('circle').attr('r',6).attr('fill','#3B82F6').attr('stroke','#1E293B');
  node.append('text').attr('x',10).attr('dy','.32em').style('font-size','12px').text(d=>d.data.name);

  // zoom/pan
  const zoom = d3.zoom().scaleExtent([0.5, 2]).on('zoom', e=> g.attr('transform', e.transform));
  svg.call(zoom);
}