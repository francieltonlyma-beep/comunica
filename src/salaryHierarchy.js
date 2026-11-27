export function buildSalaryHierarchy(roles, records) {
  const nodes = new Map(roles.filter(role => !role.mergedIntoRoleId).map(role => [
    role.id, { ...role, plan: records[role.id]?.plan, reports: [], chain: [], issue: '' },
  ]));
  const roots = [];
  for (const node of nodes.values()) {
    const supervisor = node.plan?.supervisor;
    node.parent = nodes.get(supervisor);
    if (node.parent) node.parent.reports.push(node);
    else {
      roots.push(node);
      if (supervisor) node.issue = 'missing';
    }
  }

  const stack = roots.slice().reverse();
  const rows = [];
  const reached = new Set();
  while (stack.length) {
    const node = stack.pop();
    node.depth = node.parent ? node.parent.depth + 1 : 0;
    node.chain = node.parent ? [...node.parent.chain, node.parent] : [];
    rows.push(node);
    reached.add(node.id);
    stack.push(...node.reports.slice().reverse());
  }

  // Every unreached role leads to a cycle. Keep it selectable without drawing a misleading tree.
  for (const node of nodes.values()) {
    if (reached.has(node.id)) continue;
    node.issue = 'cycle';
    node.depth = 0;
    rows.push(node);
  }
  return { nodes, rows };
}
