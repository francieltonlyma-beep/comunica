// Cópias entre turmas não transferem colaboradores nem exceções pessoais.
export function copyGroupRules(groups, sourceId, targetIds, newId = () => globalThis.crypto.randomUUID()) {
  const source = groups.find(group => group.id === sourceId);
  if (!source) return groups;
  const targets = new Set(targetIds);
  return groups.map(group => {
    if (group.id === sourceId || !targets.has(group.id)) return group;
    const personalRules = (group.dayRules || []).filter(rule => rule.userIds?.length);
    const commonRules = (source.dayRules || []).filter(rule => !rule.userIds?.length).map(rule => ({
      ...structuredClone(rule), id: `day-${newId()}`, userIds: [],
    }));
    return {
      ...group,
      shiftId: source.shiftId || '',
      weekdays: source.weekdays ? [...source.weekdays] : null,
      policy: structuredClone(source.policy || {}),
      dayRules: [...personalRules, ...commonRules],
    };
  });
}
