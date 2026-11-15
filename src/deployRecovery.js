// One retry per published build, including when browser storage is unavailable.
export function claimDeployRecovery({ url, buildId, getStorage }) {
  const target = new URL(url);
  if (target.searchParams.get('_deploy') === buildId) return null;
  try {
    const storage = getStorage();
    if (storage.getItem('comunica_deploy_recovery') === buildId) return null;
    storage.setItem('comunica_deploy_recovery', buildId);
  } catch {
    // The URL marker prevents a reload loop in private or restricted browsers.
  }
  target.searchParams.set('_deploy', buildId);
  return target.toString();
}
