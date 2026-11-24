export function allowsCompanyTab(policy, id) {
  if (!policy) return false;
  return (policy.tabs?.[id] ?? policy.defaultEnabled) === true;
}
