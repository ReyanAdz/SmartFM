const c = require('../js/core.js');
for (const s of c.SCENARIOS) {
  // simulate automatic mode in given order, and in shuffled orders
  const runs = 200; let correctTotal = 0; const perFile = {};
  for (let r = 0; r < runs; r++) {
    const tree = c.cloneTree(s.tree); const hist = [];
    const order = s.incoming.slice(); if (r>0) order.sort(()=>Math.random()-0.5);
    for (const [name,, intended] of order) {
      const p = c.predict(tree, name, hist)[0];
      const ok = p.path === intended; correctTotal += ok;
      perFile[name] = perFile[name] || {ok:0, wrong:{}}; if (ok) perFile[name].ok++; else perFile[name].wrong[p.path]=(perFile[name].wrong[p.path]||0)+1;
      c.getFolder(tree, p.path).files.push(name); hist.push(p.path);
    }
  }
  console.log(`\n== ${s.id}: top-1 accuracy ${(correctTotal/(runs*12)*100).toFixed(1)}%`);
  for (const [n,v] of Object.entries(perFile)) if (v.ok<runs) console.log('  ', n, v.ok+'/'+runs, JSON.stringify(v.wrong));
  const t = c.cloneTree(s.tree);
  console.log('  sample:', c.predict(t, s.incoming[0][0], []).slice(0,3).map(x=>x.path+' ['+x.score+'] '+x.reason).join(' | '));
}
